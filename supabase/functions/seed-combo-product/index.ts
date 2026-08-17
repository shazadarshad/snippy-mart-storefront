import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQL = `
CREATE TABLE IF NOT EXISTS public.bank_sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL,
  body text NOT NULL,
  amount numeric(10,2) NOT NULL,
  reference_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  claimed_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bank_sms_logs_amount_idx ON public.bank_sms_logs (amount);
CREATE INDEX IF NOT EXISTS bank_sms_logs_claimed_order_id_idx ON public.bank_sms_logs (claimed_order_id);
CREATE INDEX IF NOT EXISTS bank_sms_logs_received_at_idx ON public.bank_sms_logs (received_at);

ALTER TABLE public.bank_sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read unclaimed SMS" ON public.bank_sms_logs;
CREATE POLICY "Public read unclaimed SMS"
  ON public.bank_sms_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manage bank sms" ON public.bank_sms_logs;
CREATE POLICY "Service role manage bank sms"
  ON public.bank_sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.match_and_auto_approve_orders(p_max_threshold numeric DEFAULT 700.00)
RETURNS TABLE (
  approved_order_id uuid,
  order_number text,
  matched_amount numeric,
  time_delta_seconds integer
) AS $$
DECLARE
  rec RECORD;
  best_sms RECORD;
  match_count integer;
BEGIN
  FOR rec IN 
    SELECT o.id, o.order_number, o.total_amount, o.created_at, o.notes
    FROM public.orders o
    WHERE o.status = 'pending'
      AND o.total_amount < p_max_threshold
      AND o.created_at >= (now() - interval '45 minutes')
    ORDER BY o.created_at ASC
  LOOP
    SELECT count(*) INTO match_count
    FROM public.bank_sms_logs s
    WHERE s.claimed_order_id IS NULL
      AND s.amount = rec.total_amount
      AND s.received_at >= (rec.created_at - interval '30 minutes')
      AND s.received_at <= (rec.created_at + interval '30 minutes');

    IF match_count > 0 THEN
      SELECT s.id, s.amount, s.received_at, s.reference_number,
             EXTRACT(EPOCH FROM abs(s.received_at - rec.created_at))::integer AS delta
      INTO best_sms
      FROM public.bank_sms_logs s
      WHERE s.claimed_order_id IS NULL
        AND s.amount = rec.total_amount
        AND s.received_at >= (rec.created_at - interval '30 minutes')
        AND s.received_at <= (rec.created_at + interval '30 minutes')
      ORDER BY abs(EXTRACT(EPOCH FROM (s.received_at - rec.created_at))) ASC
      LIMIT 1;

      IF best_sms.id IS NOT NULL THEN
        UPDATE public.bank_sms_logs
        SET claimed_order_id = rec.id,
            claimed_at = now()
        WHERE id = best_sms.id;

        UPDATE public.orders
        SET status = 'processing',
            notes = coalesce(rec.notes || ' | ', '') || '⚡ Smart AI Auto-Approved via DF-Alert SMS (LKR ' || best_sms.amount || ')',
            updated_at = now()
        WHERE id = rec.id;

        approved_order_id := rec.id;
        order_number := rec.order_number;
        matched_amount := best_sms.amount;
        time_delta_seconds := best_sms.delta;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow guest insert orders" ON public.orders;
CREATE POLICY "Allow guest insert orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow guest update orders" ON public.orders;
CREATE POLICY "Allow guest update orders" ON public.orders
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow guest insert order_items" ON public.order_items;
CREATE POLICY "Allow guest insert order_items" ON public.order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow guest read orders" ON public.orders;
CREATE POLICY "Allow guest read orders" ON public.orders
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow guest read order_items" ON public.order_items;
CREATE POLICY "Allow guest read order_items" ON public.order_items
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.admin_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all insert admin_push_tokens" ON public.admin_push_tokens;
CREATE POLICY "Allow all insert admin_push_tokens" ON public.admin_push_tokens
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update admin_push_tokens" ON public.admin_push_tokens;
CREATE POLICY "Allow all update admin_push_tokens" ON public.admin_push_tokens
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all select admin_push_tokens" ON public.admin_push_tokens;
CREATE POLICY "Allow all select admin_push_tokens" ON public.admin_push_tokens
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin update products" ON public.products;
CREATE POLICY "Allow admin update products" ON public.products
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin insert products" ON public.products;
CREATE POLICY "Allow admin insert products" ON public.products
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete products" ON public.products;
CREATE POLICY "Allow admin delete products" ON public.products
  FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.product_pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read product_pricing_plans" ON public.product_pricing_plans;
CREATE POLICY "Allow public read product_pricing_plans" ON public.product_pricing_plans
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all update product_pricing_plans" ON public.product_pricing_plans;
CREATE POLICY "Allow all update product_pricing_plans" ON public.product_pricing_plans
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all insert product_pricing_plans" ON public.product_pricing_plans;
CREATE POLICY "Allow all insert product_pricing_plans" ON public.product_pricing_plans
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all delete product_pricing_plans" ON public.product_pricing_plans;
CREATE POLICY "Allow all delete product_pricing_plans" ON public.product_pricing_plans
  FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.product_pricing_plan_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read product_pricing_plan_variants" ON public.product_pricing_plan_variants;
CREATE POLICY "Allow public read product_pricing_plan_variants" ON public.product_pricing_plan_variants
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all update product_pricing_plan_variants" ON public.product_pricing_plan_variants;
CREATE POLICY "Allow all update product_pricing_plan_variants" ON public.product_pricing_plan_variants
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all insert product_pricing_plan_variants" ON public.product_pricing_plan_variants;
CREATE POLICY "Allow all insert product_pricing_plan_variants" ON public.product_pricing_plan_variants
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all delete product_pricing_plan_variants" ON public.product_pricing_plan_variants;
CREATE POLICY "Allow all delete product_pricing_plan_variants" ON public.product_pricing_plan_variants
  FOR DELETE TO anon, authenticated USING (true);

-- Insert Product: 🎥 HeyGen Pro – 3 Months
INSERT INTO public.products (
  name,
  slug,
  description,
  price,
  old_price,
  category,
  categories,
  image_url,
  is_active,
  is_featured,
  stock_status,
  manual_fulfillment,
  use_variant_pricing,
  requirements
)
VALUES (
  '🎥 HeyGen Pro – 3 Months',
  'heygen-pro-3-months',
  'Get access to the HeyGen Pro Plan for 3 months, activated directly on your new account.

✨ Plan Features

Video Generation
🎬 Videos up to 30 minutes
🖥️ 4K video export
🤖 Extended Avatar IV video generation
⚡ Faster video processing
👤 Unlimited Photo Avatars
🚫 Watermark removal

📌 Activation Requirements
A new account is required
Activation is performed directly on your account
Account details must be provided for activation',
  4999,
  6999,
  'AI Tools',
  ARRAY['AI Tools', 'Video', 'Software'],
  '/heygen-pro-3months.svg',
  true,
  true,
  'in_stock',
  true,
  true,
  '{"require_email": true, "require_password": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  image_url = EXCLUDED.image_url,
  use_variant_pricing = EXCLUDED.use_variant_pricing,
  requirements = EXCLUDED.requirements;

UPDATE public.products SET image_url = '/heygen-pro-3months.svg' WHERE slug = 'heygen-pro-3-months';

DO $$
DECLARE
  v_prod_id uuid;
  v_plan_id uuid;
BEGIN
  SELECT id INTO v_prod_id FROM public.products WHERE slug = 'heygen-pro-3-months';

  IF v_prod_id IS NOT NULL THEN
    DELETE FROM public.product_pricing_plans WHERE product_id = v_prod_id;

    INSERT INTO public.product_pricing_plans (product_id, name, duration, price, old_price, is_default)
    VALUES (v_prod_id, 'Warranty Options', '3 Months', 4999, 6999, true)
    RETURNING id INTO v_plan_id;

    INSERT INTO public.product_pricing_plan_variants (plan_id, name, price, old_price, stock_status)
    VALUES
      (v_plan_id, '1 Month Warranty', 4999, 6999, 'in_stock'),
      (v_plan_id, 'Full Warranty (3 Months)', 13999, 16999, 'in_stock');
  END IF;
END $$;
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const databaseUrl = Deno.env.get("SUPABASE_DB_URL") || Deno.env.get("DB_URL");
  if (!databaseUrl) {
    return new Response(JSON.stringify({ error: "No SUPABASE_DB_URL" }), { status: 500, headers: corsHeaders });
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    await sql.unsafe(SQL);
    const rows = await sql`
      SELECT id, name, slug, price, old_price, image_url, category FROM public.products WHERE slug = 'railway-hobby-framer-pro-12-months-combo'
    `;
    return new Response(JSON.stringify({ ok: true, product: rows[0] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  } finally {
    await sql.end({ timeout: 5 });
  }
});

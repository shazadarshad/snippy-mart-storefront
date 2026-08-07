import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQL = `
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
  '🔥 Railway Hobby + Framer Pro Combo (12 Months)',
  'railway-hobby-framer-pro-12-months-combo',
  '🔥 COMBO OFFER – LIMITED TIME! 🔥

🚂 Railway Hobby – 12 Months
🎨 Framer Pro – 12 Months

💰 Combo Price: Only LKR 3,999 (Previously LKR 5,399)

✨ Perfect for Developers & Designers
✅ 12 Months Access for Both Plans
✅ Coupon Codes Provided – Login Access Not Needed!
✅ Activated Directly on Your Own Accounts
✅ Railway Hobby – Deploy & Host Apps
✅ Framer Pro – Build & Publish Professional Websites

ℹ️ Special promo bundle offer. No warranty.
⚡ Limited Stock – Grab the Combo Before It''s Gone!',
  3999,
  5399,
  'Combos',
  ARRAY['Combos', 'Development', 'Design'],
  '/railway-framer-combo.jpg',
  true,
  true,
  'limited',
  true,
  false,
  '{"require_email": true, "require_password": false}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  image_url = EXCLUDED.image_url;
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

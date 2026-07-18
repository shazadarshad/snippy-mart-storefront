-- =====================================================
-- RESELLER API AUTO-DELIVERY
-- Prepaid panel integration: map products → place orders
-- via external reseller API, store delivered credentials
-- =====================================================

-- Settings (single row). API key is only read by edge functions (service role).
CREATE TABLE IF NOT EXISTS public.reseller_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  api_key TEXT,
  base_url TEXT NOT NULL DEFAULT 'https://eismrrkygprctnwxmkbw.supabase.co/functions/v1/reseller-api',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_deliver_on_processing BOOLEAN NOT NULL DEFAULT true,
  auto_complete_on_success BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.reseller_settings (id, is_enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Map local catalog products to reseller product UUIDs
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reseller_product_id TEXT;

COMMENT ON COLUMN public.products.reseller_product_id IS
  'External reseller API product UUID. When set and reseller is enabled, auto-delivery uses this ID.';

-- Delivery log (one row per order line / external_order_id)
CREATE TABLE IF NOT EXISTS public.reseller_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID,
  product_name TEXT,
  reseller_product_id TEXT NOT NULL,
  external_order_id TEXT NOT NULL,
  vendor_order_id TEXT,
  delivered_data TEXT,
  amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed')),
  error_message TEXT,
  idempotent_replay BOOLEAN DEFAULT false,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reseller_deliveries_external_order_id_key UNIQUE (external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_deliveries_order_id
  ON public.reseller_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_reseller_deliveries_status
  ON public.reseller_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_products_reseller_product_id
  ON public.products(reseller_product_id)
  WHERE reseller_product_id IS NOT NULL;

-- RLS
ALTER TABLE public.reseller_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage reseller_settings" ON public.reseller_settings;
CREATE POLICY "Admins manage reseller_settings"
  ON public.reseller_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage reseller_deliveries" ON public.reseller_deliveries;
CREATE POLICY "Admins manage reseller_deliveries"
  ON public.reseller_deliveries
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public track: anyone with order UUID can fetch delivery payloads
-- (same trust model as order tracking by order number / id)
CREATE OR REPLACE FUNCTION public.get_order_reseller_deliveries(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  product_name TEXT,
  vendor_order_id TEXT,
  delivered_data TEXT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.product_name,
    d.vendor_order_id,
    d.delivered_data,
    d.amount,
    d.status,
    d.created_at
  FROM public.reseller_deliveries d
  WHERE d.order_id = p_order_id
    AND d.status = 'delivered'
    AND d.delivered_data IS NOT NULL
  ORDER BY d.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_reseller_deliveries(UUID) TO anon, authenticated;

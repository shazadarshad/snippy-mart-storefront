-- Add variant fields to order_items
ALTER TABLE public.order_items
ADD COLUMN variant_id UUID REFERENCES public.product_pricing_plan_variants(id) ON DELETE SET NULL,
ADD COLUMN variant_name TEXT;

-- Comment for clarity
COMMENT ON COLUMN public.order_items.variant_name IS 'Name of the selected sub-plan/variant (e.g. "Shared", "Private") at time of purchase';

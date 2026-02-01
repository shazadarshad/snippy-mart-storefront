-- Add toggle field to enable/disable variant pricing grid for products

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS use_variant_pricing BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.products.use_variant_pricing IS 
'If true, show pricing grid with variants under each plan. If false, use simple plan selection flow.';

-- Add slug field to products for shareable URLs

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Generate slugs for existing products (convert name to slug format)
UPDATE public.products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

COMMENT ON COLUMN public.products.slug IS 
'URL-friendly slug for product (e.g., "freepik-premium")';

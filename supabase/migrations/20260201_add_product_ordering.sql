-- Add display_order and categories (array) to products table

-- Add display_order column for manual sorting
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Change category to categories array to support multiple categories
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Copy existing category to categories array (migration helper)
UPDATE public.products 
SET categories = ARRAY[category]
WHERE categories = '{}' AND category IS NOT NULL AND category != '';

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING GIN(categories);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order DESC);

-- Add helpful comments
COMMENT ON COLUMN public.products.display_order IS 
'Manual sort order for products. Lower numbers appear first. Use negative numbers to pin to top.';

COMMENT ON COLUMN public.products.categories IS 
'Array of category names this product belongs to. Supports multiple categories.';

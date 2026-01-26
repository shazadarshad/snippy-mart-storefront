-- Add manual_fulfillment column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS manual_fulfillment BOOLEAN DEFAULT true;

-- Update existing Cursor AI product to false if it exists (example)
-- UPDATE public.products SET manual_fulfillment = false WHERE name ILIKE '%Cursor AI%';

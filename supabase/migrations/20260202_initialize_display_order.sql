-- Initialize all products with sequential display_order
-- This ensures every product has a unique order value

DO $$
DECLARE
  product_record RECORD;
  counter INTEGER := 0;
BEGIN
  -- Get all products ordered by created_at (newest first)
  FOR product_record IN 
    SELECT id 
    FROM public.products 
    ORDER BY 
      COALESCE(display_order, 999999),
      created_at DESC
  LOOP
    -- Update each product with sequential order
    UPDATE public.products 
    SET display_order = counter 
    WHERE id = product_record.id;
    
    counter := counter + 1;
  END LOOP;
END $$;

-- Make display_order NOT NULL now that all have values
ALTER TABLE public.products 
ALTER COLUMN display_order SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.products.display_order IS 
'Sequential order number for products. Lower numbers appear first. Always has a value.';

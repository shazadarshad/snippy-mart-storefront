-- Add requirements configuration to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

-- Add customer credentials storage to order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS customer_credentials JSONB DEFAULT '{}'::jsonb;

-- Update RLS to allow users to insert credentials (already likely covered by existing policies but good to ensure)
-- Usually order_items are inserted by service_role or authenticated user. 
-- If the order creation happens via Edge Function (create-order), it usually uses service_role key, so RLS isn't an issue there.

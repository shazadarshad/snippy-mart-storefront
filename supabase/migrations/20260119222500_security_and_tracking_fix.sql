-- Allow public tracking of orders
-- This is necessary for the TrackOrder page to function for visitors
DROP POLICY IF EXISTS "Anyone can track an order" ON public.orders;
CREATE POLICY "Anyone can track an order" 
ON public.orders 
FOR SELECT 
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view order items for tracking" ON public.order_items;
CREATE POLICY "Anyone can view order items for tracking" 
ON public.order_items 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure order statuses are updated in the database as well
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'on_hold', 'cancelled', 'refunded'));

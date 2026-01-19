-- Add new order statuses to the check constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'on_hold', 'cancelled', 'refunded'));

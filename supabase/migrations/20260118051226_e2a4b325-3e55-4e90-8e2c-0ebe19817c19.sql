-- Remove test/sample orders created during development
-- (Safe filter: only deletes orders whose order_number starts with 'TEST-')
DELETE FROM public.order_items
WHERE order_id IN (
  SELECT id FROM public.orders WHERE order_number LIKE 'TEST-%'
);

DELETE FROM public.orders
WHERE order_number LIKE 'TEST-%';

-- Optional live stock count from reseller API (null = unknown)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reseller_stock INTEGER;

COMMENT ON COLUMN public.products.reseller_stock IS
  'Available units from reseller API when known; stock_status still used for storefront filters';

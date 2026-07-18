-- Smart tier pricing options for reseller margin
ALTER TABLE public.reseller_settings
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'smart',
  ADD COLUMN IF NOT EXISTS min_profit_lkr NUMERIC NOT NULL DEFAULT 200;

-- Keep existing markup_percent for fixed mode (default lower than old 80)
UPDATE public.reseller_settings
SET markup_percent = 50
WHERE markup_percent IS NULL OR markup_percent = 80;

COMMENT ON COLUMN public.reseller_settings.pricing_mode IS
  'smart = tiered markup by cost band; fixed = single markup_percent for all';
COMMENT ON COLUMN public.reseller_settings.min_profit_lkr IS
  'Minimum LKR profit floor applied after markup calculation';

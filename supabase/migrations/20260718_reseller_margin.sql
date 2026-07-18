-- Customer margin on reseller API products + store cost separately
ALTER TABLE public.reseller_settings
  ADD COLUMN IF NOT EXISTS usd_to_lkr NUMERIC NOT NULL DEFAULT 360,
  ADD COLUMN IF NOT EXISTS markup_percent NUMERIC NOT NULL DEFAULT 80;

COMMENT ON COLUMN public.reseller_settings.usd_to_lkr IS
  'API USD to cost LKR rate (e.g. 360). Prepaid panel still charges USD.';
COMMENT ON COLUMN public.reseller_settings.markup_percent IS
  'Customer sell = cost_lkr * (1 + markup/100). e.g. 80 percent: cost 500 shows 900.';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reseller_cost_usd NUMERIC;

COMMENT ON COLUMN public.products.reseller_cost_usd IS
  'What the seller panel charges (USD). Customer price is products.price in LKR (with margin).';

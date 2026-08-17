-- Card checkout URLs hosted on snippymart.com/payment/{order_number}

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS card_checkout_url text,
  ADD COLUMN IF NOT EXISTS card_link_created_at timestamptz;

COMMENT ON COLUMN public.orders.card_checkout_url IS
  'External card processor URL (PayHere / Stripe / Genie). Public page /payment/{order_number} opens this.';
COMMENT ON COLUMN public.orders.card_link_created_at IS
  'When admin saved the hosted card payment page link.';

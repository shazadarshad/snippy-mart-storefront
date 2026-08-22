-- Customer tapped "I've paid" on /payment/{order} (no screenshot required)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS card_marked_paid_at timestamptz;

COMMENT ON COLUMN public.orders.card_marked_paid_at IS
  'When the customer tapped I''ve paid on the hosted card page. Admin still verifies the processor.';

CREATE INDEX IF NOT EXISTS idx_orders_card_inbox
  ON public.orders (payment_method, status, card_marked_paid_at)
  WHERE payment_method = 'card';

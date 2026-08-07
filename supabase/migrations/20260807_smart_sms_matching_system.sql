-- Smart AI SMS Matching System Schema & Functions

CREATE TABLE IF NOT EXISTS public.bank_sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL,
  body text NOT NULL,
  amount numeric(10,2) NOT NULL,
  reference_number text,
  received_at timestamptz NOT NULL DEFAULT now(),
  claimed_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bank_sms_logs_amount_idx ON public.bank_sms_logs (amount);
CREATE INDEX IF NOT EXISTS bank_sms_logs_claimed_order_id_idx ON public.bank_sms_logs (claimed_order_id);
CREATE INDEX IF NOT EXISTS bank_sms_logs_received_at_idx ON public.bank_sms_logs (received_at);

ALTER TABLE public.bank_sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read unclaimed SMS" ON public.bank_sms_logs;
CREATE POLICY "Public read unclaimed SMS"
  ON public.bank_sms_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manage bank sms" ON public.bank_sms_logs;
CREATE POLICY "Service role manage bank sms"
  ON public.bank_sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RPC Function: Smart Match Pending Orders with Unclaimed Bank SMS
CREATE OR REPLACE FUNCTION public.match_and_auto_approve_orders(p_max_threshold numeric DEFAULT 700.00)
RETURNS TABLE (
  approved_order_id uuid,
  order_number text,
  matched_amount numeric,
  time_delta_seconds integer
) AS $$
DECLARE
  rec RECORD;
  best_sms RECORD;
  match_count integer;
BEGIN
  FOR rec IN 
    SELECT o.id, o.order_number, o.total_amount, o.created_at, o.notes
    FROM public.orders o
    WHERE o.status = 'pending'
      AND o.total_amount < p_max_threshold
      AND o.created_at >= (now() - interval '45 minutes')
    ORDER BY o.created_at ASC
  LOOP
    -- Find unclaimed bank SMS matching exact amount within 30 minutes before or after order placement
    SELECT count(*) INTO match_count
    FROM public.bank_sms_logs s
    WHERE s.claimed_order_id IS NULL
      AND s.amount = rec.total_amount
      AND s.received_at >= (rec.created_at - interval '30 minutes')
      AND s.received_at <= (rec.created_at + interval '30 minutes');

    -- If matches exist, pick candidate with smallest time difference
    IF match_count > 0 THEN
      SELECT s.id, s.amount, s.received_at, s.reference_number,
             EXTRACT(EPOCH FROM abs(s.received_at - rec.created_at))::integer AS delta
      INTO best_sms
      FROM public.bank_sms_logs s
      WHERE s.claimed_order_id IS NULL
        AND s.amount = rec.total_amount
        AND s.received_at >= (rec.created_at - interval '30 minutes')
        AND s.received_at <= (rec.created_at + interval '30 minutes')
      ORDER BY abs(EXTRACT(EPOCH FROM (s.received_at - rec.created_at))) ASC
      LIMIT 1;

      IF best_sms.id IS NOT NULL THEN
        -- Claim SMS
        UPDATE public.bank_sms_logs
        SET claimed_order_id = rec.id,
            claimed_at = now()
        WHERE id = best_sms.id;

        -- Shift Order Status to Payment Confirmed ('processing')
        UPDATE public.orders
        SET status = 'processing',
            notes = coalesce(rec.notes || ' | ', '') || '⚡ Smart AI Auto-Approved via DF-Alert SMS (LKR ' || best_sms.amount || ')',
            updated_at = now()
        WHERE id = rec.id;

        approved_order_id := rec.id;
        order_number := rec.order_number;
        matched_amount := best_sms.amount;
        time_delta_seconds := best_sms.delta;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AFFILIATE PROGRAM (MVP)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'disabled')),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 7
    CHECK (commission_percent >= 0 AND commission_percent <= 50),
  notes TEXT,
  payout_details TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_code_lower
  ON public.affiliates (lower(code));

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT,
  order_total NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_commissions_order_unique UNIQUE (order_id)
);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'paid', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate
  ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status
  ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate
  ON public.affiliate_payouts(affiliate_id);

-- Orders: store which affiliate referred the buyer
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON public.orders(affiliate_id);

-- RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage affiliates" ON public.affiliates;
CREATE POLICY "Admins manage affiliates"
  ON public.affiliates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage affiliate_commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins manage affiliate_commissions"
  ON public.affiliate_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage affiliate_payouts" ON public.affiliate_payouts;
CREATE POLICY "Admins manage affiliate_payouts"
  ON public.affiliate_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public: apply as affiliate
CREATE OR REPLACE FUNCTION public.apply_affiliate(
  p_name TEXT,
  p_whatsapp TEXT,
  p_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_id UUID;
  v_base TEXT;
  v_try INT := 0;
BEGIN
  IF length(trim(coalesce(p_name, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name is required');
  END IF;
  IF length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) < 9 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Valid WhatsApp number is required');
  END IF;

  v_base := upper(regexp_replace(coalesce(nullif(trim(p_code), ''), left(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'), 8)), '[^A-Z0-9]', '', 'g'));
  IF length(v_base) < 3 THEN
    v_base := 'SM' || floor(random() * 9000 + 1000)::text;
  END IF;
  v_base := left(v_base, 12);
  v_code := v_base;

  WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE lower(code) = lower(v_code)) LOOP
    v_try := v_try + 1;
    v_code := left(v_base, 8) || v_try::text;
    IF v_try > 20 THEN
      v_code := 'SM' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.affiliates (code, name, whatsapp, email, notes, status, commission_percent)
  VALUES (
    v_code,
    trim(p_name),
    trim(p_whatsapp),
    nullif(trim(p_email), ''),
    nullif(trim(p_notes), ''),
    'pending',
    7
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_id,
    'code', v_code,
    'status', 'pending',
    'message', 'Application received. We will review and activate your code soon.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_affiliate(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Public: affiliate dashboard by code + whatsapp (simple auth for MVP)
CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard(
  p_code TEXT,
  p_whatsapp TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aff public.affiliates%ROWTYPE;
  v_digits TEXT;
  v_aff_digits TEXT;
  v_pending NUMERIC;
  v_approved NUMERIC;
  v_paid NUMERIC;
  v_comms JSONB;
  v_payouts JSONB;
BEGIN
  v_digits := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  IF length(trim(coalesce(p_code, ''))) < 2 OR length(v_digits) < 9 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Code and WhatsApp required');
  END IF;

  SELECT * INTO v_aff
  FROM public.affiliates
  WHERE lower(code) = lower(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Affiliate not found');
  END IF;

  v_aff_digits := regexp_replace(v_aff.whatsapp, '\D', '', 'g');
  -- Match last 9 digits (local numbers)
  IF right(v_aff_digits, 9) <> right(v_digits, 9) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'WhatsApp does not match this affiliate code');
  END IF;

  SELECT coalesce(sum(commission_amount), 0) INTO v_pending
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'pending';

  SELECT coalesce(sum(commission_amount), 0) INTO v_approved
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'approved';

  SELECT coalesce(sum(commission_amount), 0) INTO v_paid
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'paid';

  SELECT coalesce(jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC), '[]'::jsonb)
  INTO v_comms
  FROM (
    SELECT id, order_number, order_total, commission_percent, commission_amount, status, created_at
    FROM public.affiliate_commissions
    WHERE affiliate_id = v_aff.id
    ORDER BY created_at DESC
    LIMIT 50
  ) c;

  SELECT coalesce(jsonb_agg(row_to_json(p) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO v_payouts
  FROM (
    SELECT id, amount, method, note, status, created_at, paid_at
    FROM public.affiliate_payouts
    WHERE affiliate_id = v_aff.id
    ORDER BY created_at DESC
    LIMIT 20
  ) p;

  RETURN jsonb_build_object(
    'ok', true,
    'affiliate', jsonb_build_object(
      'id', v_aff.id,
      'code', v_aff.code,
      'name', v_aff.name,
      'status', v_aff.status,
      'commission_percent', v_aff.commission_percent,
      'whatsapp', v_aff.whatsapp,
      'email', v_aff.email,
      'payout_details', v_aff.payout_details
    ),
    'totals', jsonb_build_object(
      'pending', v_pending,
      'approved', v_approved,
      'paid', v_paid,
      'available', v_approved
    ),
    'commissions', v_comms,
    'payouts', v_payouts,
    'link', 'https://snippymart.com/?ref=' || v_aff.code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_affiliate_payout(
  p_code TEXT,
  p_whatsapp TEXT,
  p_amount NUMERIC,
  p_method TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aff public.affiliates%ROWTYPE;
  v_digits TEXT;
  v_aff_digits TEXT;
  v_available NUMERIC;
  v_id UUID;
BEGIN
  v_digits := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  SELECT * INTO v_aff FROM public.affiliates WHERE lower(code) = lower(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Affiliate not found');
  END IF;
  IF v_aff.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Affiliate is not active yet');
  END IF;
  v_aff_digits := regexp_replace(v_aff.whatsapp, '\D', '', 'g');
  IF right(v_aff_digits, 9) <> right(v_digits, 9) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'WhatsApp does not match');
  END IF;

  SELECT coalesce(sum(commission_amount), 0) INTO v_available
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'approved';

  IF p_amount IS NULL OR p_amount < 2000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Minimum payout is Rs. 2000');
  END IF;
  IF p_amount > v_available THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount exceeds available balance (Rs. ' || v_available::text || ')');
  END IF;

  INSERT INTO public.affiliate_payouts (affiliate_id, amount, method, note, status)
  VALUES (v_aff.id, p_amount, nullif(trim(p_method), ''), nullif(trim(p_note), ''), 'requested')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'message', 'Payout requested. We will process soon.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated;

-- Create / update commission when order completes
CREATE OR REPLACE FUNCTION public.sync_affiliate_commission_for_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_aff public.affiliates%ROWTYPE;
  v_amount NUMERIC;
  v_order_digits TEXT;
  v_aff_digits TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Cancel commission on refund / cancel after it existed
  IF v_order.status IN ('refunded', 'cancelled') THEN
    UPDATE public.affiliate_commissions
    SET status = 'cancelled', updated_at = now()
    WHERE order_id = p_order_id AND status IN ('pending', 'approved');
    RETURN;
  END IF;

  IF v_order.status <> 'completed' THEN
    RETURN;
  END IF;

  IF v_order.affiliate_id IS NULL AND (v_order.affiliate_code IS NULL OR trim(v_order.affiliate_code) = '') THEN
    RETURN;
  END IF;

  IF v_order.affiliate_id IS NOT NULL THEN
    SELECT * INTO v_aff FROM public.affiliates WHERE id = v_order.affiliate_id;
  ELSE
    SELECT * INTO v_aff FROM public.affiliates WHERE lower(code) = lower(trim(v_order.affiliate_code)) LIMIT 1;
  END IF;

  IF NOT FOUND OR v_aff.status <> 'active' THEN
    RETURN;
  END IF;

  -- Block self-referral (same WhatsApp)
  v_order_digits := right(regexp_replace(coalesce(v_order.customer_whatsapp, ''), '\D', '', 'g'), 9);
  v_aff_digits := right(regexp_replace(coalesce(v_aff.whatsapp, ''), '\D', '', 'g'), 9);
  IF length(v_order_digits) >= 9 AND v_order_digits = v_aff_digits THEN
    RETURN;
  END IF;

  v_amount := round((coalesce(v_order.total_amount, 0) * coalesce(v_aff.commission_percent, 7) / 100.0)::numeric, 2);
  IF v_amount <= 0 THEN RETURN; END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id, order_id, order_number, order_total,
    commission_percent, commission_amount, status
  ) VALUES (
    v_aff.id,
    v_order.id,
    v_order.order_number,
    v_order.total_amount,
    v_aff.commission_percent,
    v_amount,
    'approved'
  )
  ON CONFLICT (order_id) DO UPDATE SET
    status = CASE
      WHEN public.affiliate_commissions.status = 'paid' THEN 'paid'
      WHEN public.affiliate_commissions.status = 'cancelled' THEN 'approved'
      ELSE 'approved'
    END,
    commission_amount = EXCLUDED.commission_amount,
    commission_percent = EXCLUDED.commission_percent,
    order_total = EXCLUDED.order_total,
    updated_at = now();

  -- Keep code on order for reporting
  UPDATE public.orders
  SET affiliate_id = v_aff.id, affiliate_code = v_aff.code
  WHERE id = v_order.id AND (affiliate_id IS NULL OR affiliate_code IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_orders_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.affiliate_id IS DISTINCT FROM OLD.affiliate_id
    OR NEW.affiliate_code IS DISTINCT FROM OLD.affiliate_code
  ) THEN
    PERFORM public.sync_affiliate_commission_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_affiliate_commission ON public.orders;
CREATE TRIGGER orders_affiliate_commission
  AFTER UPDATE OF status, affiliate_id, affiliate_code ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_orders_affiliate_commission();

-- Admin helper: mark payout paid and flip commissions
CREATE OR REPLACE FUNCTION public.admin_mark_affiliate_payout_paid(p_payout_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay public.affiliate_payouts%ROWTYPE;
  v_left NUMERIC;
  r RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Admin only');
  END IF;

  SELECT * INTO v_pay FROM public.affiliate_payouts WHERE id = p_payout_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payout not found');
  END IF;
  IF v_pay.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Already paid');
  END IF;

  v_left := v_pay.amount;
  FOR r IN
    SELECT id, commission_amount
    FROM public.affiliate_commissions
    WHERE affiliate_id = v_pay.affiliate_id AND status = 'approved'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_left <= 0;
    UPDATE public.affiliate_commissions
    SET status = 'paid', updated_at = now()
    WHERE id = r.id;
    v_left := v_left - r.commission_amount;
  END LOOP;

  UPDATE public.affiliate_payouts
  SET status = 'paid', paid_at = now()
  WHERE id = p_payout_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mark_affiliate_payout_paid(UUID) TO authenticated;

COMMENT ON TABLE public.affiliates IS 'Affiliate partners for Snippy Mart referral program';

-- =====================================================
-- AFFILIATE FRAUD / SECURITY GUARDS
-- For open group promotion: hold commissions, caps, unique WA
-- =====================================================

-- Settings (single row)
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 7,
  min_payout_lkr NUMERIC NOT NULL DEFAULT 2000,
  -- Commission stays pending this many days after order completes (refund window)
  hold_days INTEGER NOT NULL DEFAULT 5,
  -- Max approved+pending commissions per affiliate per calendar day (LKR)
  max_commission_per_day_lkr NUMERIC NOT NULL DEFAULT 15000,
  -- Max commission-earning completed orders per affiliate per day
  max_orders_per_day INTEGER NOT NULL DEFAULT 8,
  -- Min days since affiliate approved before first payout
  min_account_age_days INTEGER NOT NULL DEFAULT 3,
  -- Min order total to earn commission
  min_order_total_lkr NUMERIC NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.affiliate_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage affiliate_settings" ON public.affiliate_settings;
CREATE POLICY "Admins manage affiliate_settings"
  ON public.affiliate_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fraud flags on affiliates
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS whatsapp_digits TEXT;
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS fraud_notes TEXT;
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS first_payout_done BOOLEAN NOT NULL DEFAULT false;

-- Backfill digits
UPDATE public.affiliates
SET whatsapp_digits = right(regexp_replace(whatsapp, '\D', '', 'g'), 12)
WHERE whatsapp_digits IS NULL OR whatsapp_digits = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_whatsapp_digits_unique
  ON public.affiliates (whatsapp_digits)
  WHERE whatsapp_digits IS NOT NULL AND length(whatsapp_digits) >= 9
    AND status IN ('pending', 'active');

ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ;
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS fraud_flag TEXT;

-- Normalize + dedupe helpers
CREATE OR REPLACE FUNCTION public.aff_wa_digits(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 12);
$$;

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
  v_digits TEXT;
  v_rate NUMERIC;
BEGIN
  IF length(trim(coalesce(p_name, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name is required');
  END IF;

  v_digits := public.aff_wa_digits(p_whatsapp);
  IF length(v_digits) < 9 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Valid WhatsApp number is required');
  END IF;

  -- One application per WhatsApp (pending/active)
  IF EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE whatsapp_digits = v_digits
      AND status IN ('pending', 'active')
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'This WhatsApp already has an affiliate application. Open Dashboard with your code + WhatsApp.'
    );
  END IF;

  -- Rate-limit: max 5 applications per hour globally from same WA pattern (disabled re-apply spam)
  IF EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE whatsapp_digits = v_digits
      AND created_at > now() - interval '24 hours'
      AND status IN ('rejected', 'disabled')
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Please wait 24 hours before applying again with this number.'
    );
  END IF;

  SELECT default_commission_percent INTO v_rate FROM public.affiliate_settings WHERE id = 1;
  IF v_rate IS NULL THEN v_rate := 7; END IF;

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

  INSERT INTO public.affiliates (
    code, name, whatsapp, whatsapp_digits, email, notes, status, commission_percent
  ) VALUES (
    v_code,
    trim(p_name),
    trim(p_whatsapp),
    v_digits,
    nullif(trim(p_email), ''),
    nullif(trim(p_notes), ''),
    'pending',
    v_rate
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_id,
    'code', v_code,
    'status', 'pending',
    'message', 'Application received. We review every application before activation (usually within 24–48h).'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_affiliate_commission_for_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_aff public.affiliates%ROWTYPE;
  v_settings public.affiliate_settings%ROWTYPE;
  v_amount NUMERIC;
  v_order_digits TEXT;
  v_aff_digits TEXT;
  v_day_total NUMERIC;
  v_day_orders INT;
  v_hold TIMESTAMPTZ;
  v_status TEXT;
  v_flag TEXT;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO v_settings FROM public.affiliate_settings WHERE id = 1;
  IF NOT FOUND THEN
    v_settings.hold_days := 5;
    v_settings.max_commission_per_day_lkr := 15000;
    v_settings.max_orders_per_day := 8;
    v_settings.min_order_total_lkr := 500;
    v_settings.default_commission_percent := 7;
  END IF;

  IF v_order.status IN ('refunded', 'cancelled') THEN
    UPDATE public.affiliate_commissions
    SET status = 'cancelled', updated_at = now(), fraud_flag = coalesce(fraud_flag, 'order_' || v_order.status)
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

  -- Self-referral
  v_order_digits := public.aff_wa_digits(v_order.customer_whatsapp);
  v_aff_digits := coalesce(nullif(v_aff.whatsapp_digits, ''), public.aff_wa_digits(v_aff.whatsapp));
  IF length(v_order_digits) >= 9 AND right(v_order_digits, 9) = right(v_aff_digits, 9) THEN
    UPDATE public.affiliates
    SET fraud_score = fraud_score + 5,
        fraud_notes = left(coalesce(fraud_notes, '') || E'\nSelf-ref attempt order ' || v_order.order_number, 2000),
        updated_at = now()
    WHERE id = v_aff.id;
    RETURN;
  END IF;

  -- Min order total
  IF coalesce(v_order.total_amount, 0) < coalesce(v_settings.min_order_total_lkr, 500) THEN
    RETURN;
  END IF;

  v_amount := round(
    (coalesce(v_order.total_amount, 0) * coalesce(v_aff.commission_percent, v_settings.default_commission_percent, 7) / 100.0)::numeric,
    2
  );
  IF v_amount <= 0 THEN RETURN; END IF;

  -- Daily caps (pending + approved + paid today)
  SELECT coalesce(sum(commission_amount), 0), count(*)::int
  INTO v_day_total, v_day_orders
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id
    AND status IN ('pending', 'approved', 'paid')
    AND created_at::date = now()::date;

  v_flag := NULL;
  IF v_day_orders >= coalesce(v_settings.max_orders_per_day, 8) THEN
    v_flag := 'daily_order_cap';
    UPDATE public.affiliates
    SET fraud_score = fraud_score + 2,
        fraud_notes = left(coalesce(fraud_notes, '') || E'\nDaily order cap hit ' || now()::date::text, 2000),
        updated_at = now()
    WHERE id = v_aff.id;
    RETURN;
  END IF;

  IF v_day_total + v_amount > coalesce(v_settings.max_commission_per_day_lkr, 15000) THEN
    v_flag := 'daily_amount_cap';
    UPDATE public.affiliates
    SET fraud_score = fraud_score + 2,
        fraud_notes = left(coalesce(fraud_notes, '') || E'\nDaily amount cap hit ' || now()::date::text, 2000),
        updated_at = now()
    WHERE id = v_aff.id;
    RETURN;
  END IF;

  -- Hold period: commission pending until hold_until
  v_hold := now() + make_interval(days => greatest(coalesce(v_settings.hold_days, 5), 0));
  IF coalesce(v_settings.hold_days, 5) <= 0 THEN
    v_status := 'approved';
    v_hold := NULL;
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.affiliate_commissions (
    affiliate_id, order_id, order_number, order_total,
    commission_percent, commission_amount, status, hold_until, fraud_flag
  ) VALUES (
    v_aff.id,
    v_order.id,
    v_order.order_number,
    v_order.total_amount,
    v_aff.commission_percent,
    v_amount,
    v_status,
    v_hold,
    v_flag
  )
  ON CONFLICT (order_id) DO UPDATE SET
    status = CASE
      WHEN public.affiliate_commissions.status = 'paid' THEN 'paid'
      WHEN public.affiliate_commissions.status = 'cancelled' THEN EXCLUDED.status
      ELSE EXCLUDED.status
    END,
    commission_amount = EXCLUDED.commission_amount,
    commission_percent = EXCLUDED.commission_percent,
    order_total = EXCLUDED.order_total,
    hold_until = COALESCE(public.affiliate_commissions.hold_until, EXCLUDED.hold_until),
    updated_at = now();

  UPDATE public.orders
  SET affiliate_id = v_aff.id, affiliate_code = v_aff.code
  WHERE id = v_order.id AND (affiliate_id IS NULL OR affiliate_code IS NULL);
END;
$$;

-- Release held commissions after hold window (call from dashboard/payout or cron-like on request)
CREATE OR REPLACE FUNCTION public.release_held_affiliate_commissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE public.affiliate_commissions
  SET status = 'approved', updated_at = now()
  WHERE status = 'pending'
    AND hold_until IS NOT NULL
    AND hold_until <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_held_affiliate_commissions() TO anon, authenticated, service_role;

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
  v_held NUMERIC;
  v_comms JSONB;
  v_payouts JSONB;
  v_min_payout NUMERIC;
  v_hold_days INT;
BEGIN
  -- Release matured holds on each dashboard open
  PERFORM public.release_held_affiliate_commissions();

  v_digits := public.aff_wa_digits(p_whatsapp);
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

  v_aff_digits := coalesce(nullif(v_aff.whatsapp_digits, ''), public.aff_wa_digits(v_aff.whatsapp));
  IF right(v_aff_digits, 9) <> right(v_digits, 9) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'WhatsApp does not match this affiliate code');
  END IF;

  SELECT coalesce(sum(commission_amount), 0) INTO v_pending
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'pending';

  SELECT coalesce(sum(commission_amount), 0) INTO v_held
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'pending' AND hold_until IS NOT NULL AND hold_until > now();

  SELECT coalesce(sum(commission_amount), 0) INTO v_approved
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'approved';

  SELECT coalesce(sum(commission_amount), 0) INTO v_paid
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'paid';

  SELECT min_payout_lkr, hold_days INTO v_min_payout, v_hold_days
  FROM public.affiliate_settings WHERE id = 1;
  IF v_min_payout IS NULL THEN v_min_payout := 2000; END IF;
  IF v_hold_days IS NULL THEN v_hold_days := 5; END IF;

  SELECT coalesce(jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC), '[]'::jsonb)
  INTO v_comms
  FROM (
    SELECT id, order_number, order_total, commission_percent, commission_amount, status, created_at, hold_until, fraud_flag
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
      'payout_details', v_aff.payout_details,
      'first_payout_done', v_aff.first_payout_done,
      'approved_at', v_aff.approved_at
    ),
    'totals', jsonb_build_object(
      'pending', v_pending,
      'held', v_held,
      'approved', v_approved,
      'paid', v_paid,
      'available', v_approved
    ),
    'rules', jsonb_build_object(
      'min_payout', v_min_payout,
      'hold_days', v_hold_days
    ),
    'commissions', v_comms,
    'payouts', v_payouts,
    'link', 'https://snippymart.com/?ref=' || v_aff.code
  );
END;
$$;

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
  v_settings public.affiliate_settings%ROWTYPE;
  v_open INT;
  v_age_days INT;
BEGIN
  PERFORM public.release_held_affiliate_commissions();

  v_digits := public.aff_wa_digits(p_whatsapp);
  SELECT * INTO v_aff FROM public.affiliates WHERE lower(code) = lower(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Affiliate not found');
  END IF;
  IF v_aff.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Affiliate is not active yet');
  END IF;
  IF coalesce(v_aff.fraud_score, 0) >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Account under review. Contact support on WhatsApp.');
  END IF;

  v_aff_digits := coalesce(nullif(v_aff.whatsapp_digits, ''), public.aff_wa_digits(v_aff.whatsapp));
  IF right(v_aff_digits, 9) <> right(v_digits, 9) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'WhatsApp does not match');
  END IF;

  SELECT * INTO v_settings FROM public.affiliate_settings WHERE id = 1;

  -- Account age
  v_age_days := EXTRACT(DAY FROM (now() - coalesce(v_aff.approved_at, v_aff.created_at)))::int;
  IF v_age_days < coalesce(v_settings.min_account_age_days, 3) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Payouts unlock ' || coalesce(v_settings.min_account_age_days, 3)::text ||
               ' days after activation. Days so far: ' || v_age_days::text
    );
  END IF;

  -- Only one open request
  SELECT count(*)::int INTO v_open
  FROM public.affiliate_payouts
  WHERE affiliate_id = v_aff.id AND status = 'requested';
  IF v_open > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You already have a payout request pending review.');
  END IF;

  SELECT coalesce(sum(commission_amount), 0) INTO v_available
  FROM public.affiliate_commissions
  WHERE affiliate_id = v_aff.id AND status = 'approved';

  IF p_amount IS NULL OR p_amount < coalesce(v_settings.min_payout_lkr, 2000) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Minimum payout is Rs. ' || coalesce(v_settings.min_payout_lkr, 2000)::text
    );
  END IF;
  IF p_amount > v_available THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Amount exceeds available balance (Rs. ' || v_available::text || '). Held commissions release after the hold period.');
  END IF;

  INSERT INTO public.affiliate_payouts (affiliate_id, amount, method, note, status)
  VALUES (
    v_aff.id,
    p_amount,
    nullif(trim(p_method), ''),
    CASE
      WHEN NOT coalesce(v_aff.first_payout_done, false) THEN
        trim(coalesce(p_note, '') || ' [FIRST PAYOUT — verify manually]')
      ELSE nullif(trim(p_note), '')
    END,
    'requested'
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_id,
    'message', CASE
      WHEN NOT coalesce(v_aff.first_payout_done, false) THEN
        'First payout requested — we verify manually (usually 1–3 days).'
      ELSE 'Payout requested. We will process soon.'
    END
  );
END;
$$;

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

  PERFORM public.release_held_affiliate_commissions();

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

  UPDATE public.affiliates
  SET first_payout_done = true, updated_at = now()
  WHERE id = v_pay.affiliate_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

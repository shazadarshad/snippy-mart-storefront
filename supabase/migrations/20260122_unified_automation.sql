-- =====================================================
-- UNIFIED AUTOMATION SETUP (REFINED)
-- Sets up Inventory, Auto-Fulfillment, and Email Parser
-- =====================================================

-- 0. Prepare Orders Table
-- Add payment_status if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 1. Inventory Accounts Table
CREATE TABLE IF NOT EXISTS public.inventory_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'netflix', 'prime', 'spotify', etc.
    rules_template TEXT, 
    region TEXT DEFAULT 'Global',
    duration_months INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 1,
    current_users INTEGER DEFAULT 0,
    expiry_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'expired', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Account Assignments Table
CREATE TABLE IF NOT EXISTS public.account_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.inventory_accounts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE(order_id)
);

-- 3. Account Verification Codes Table
CREATE TABLE IF NOT EXISTS public.account_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.inventory_accounts(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 minutes')
);

-- 4. Automation Settings Table
CREATE TABLE IF NOT EXISTS public.automation_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default Settings
INSERT INTO public.automation_settings (key, value, description)
VALUES 
('fulfillment_enabled', 'true'::jsonb, 'Master switch for auto-assignment upon payment'),
('code_extraction_enabled', 'true'::jsonb, 'Enable/disable automated email verification code extraction')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- Enable RLS
ALTER TABLE public.inventory_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- 5. Security Policies (Fixed for current schema)

-- Admin helper for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Inventory policies
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_accounts;
CREATE POLICY "Admins can manage inventory" ON public.inventory_accounts FOR ALL TO authenticated USING (public.is_admin());

-- Assignment policies
DROP POLICY IF EXISTS "Admins can see all assignments" ON public.account_assignments;
CREATE POLICY "Admins can see all assignments" ON public.account_assignments FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can see their own assignment" ON public.account_assignments;
CREATE POLICY "Users can see their own assignment" ON public.account_assignments
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = account_assignments.order_id 
        -- Matches based on order_id in tracking logic
    )
);

-- Code policies
DROP POLICY IF EXISTS "Admins can see all codes" ON public.account_verification_codes;
CREATE POLICY "Admins can see all codes" ON public.account_verification_codes FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can see codes for their assigned account" ON public.account_verification_codes;
CREATE POLICY "Users can see codes for their assigned account" ON public.account_verification_codes
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.account_assignments aa
        WHERE aa.account_id = account_verification_codes.account_id
    )
);

-- 6. Trigger Logic: Auto-Assignment
CREATE OR REPLACE FUNCTION public.fn_auto_assign_account()
RETURNS TRIGGER AS $$
DECLARE
    v_account_id UUID;
    v_category TEXT;
BEGIN
    -- Only trigger when payment_status changes to 'paid'
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')) THEN
        
        -- Get category from first item
        SELECT p.category INTO v_category
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = NEW.id
        LIMIT 1;

        -- Find active account with capacity
        SELECT id INTO v_account_id
        FROM public.inventory_accounts
        WHERE LOWER(service_type) = LOWER(v_category)
        AND status = 'active'
        AND current_users < max_users
        ORDER BY current_users ASC
        LIMIT 1;

        IF v_account_id IS NOT NULL THEN
            INSERT INTO public.account_assignments (order_id, account_id, assigned_at)
            VALUES (NEW.id, v_account_id, now())
            ON CONFLICT (order_id) DO NOTHING;

            UPDATE public.inventory_accounts
            SET current_users = current_users + 1,
                status = CASE WHEN current_users + 1 >= max_users THEN 'full' ELSE 'active' END
            WHERE id = v_account_id;

            -- Auto-deliver
            NEW.status := 'delivered';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_assign_on_paid ON public.orders;
CREATE TRIGGER tr_auto_assign_on_paid
    BEFORE UPDATE OF payment_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_auto_assign_account();

-- 7. Email Parser Logic
CREATE OR REPLACE FUNCTION public.fn_process_inbound_email(p_to_email TEXT, p_body TEXT)
RETURNS JSONB AS $$
DECLARE
    v_account_id UUID;
    v_code TEXT;
BEGIN
    v_code := (SELECT (regexp_matches(p_body, '\b(\d{4,8})\b', 'g'))[1] LIMIT 1);
    IF v_code IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

    SELECT id INTO v_account_id FROM public.inventory_accounts WHERE email = p_to_email LIMIT 1;
    IF v_account_id IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

    INSERT INTO public.account_verification_codes (account_id, code) VALUES (v_account_id, v_code);
    RETURN jsonb_build_object('success', true, 'code', v_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_verification_codes;

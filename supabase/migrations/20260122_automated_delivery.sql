-- =====================================================
-- AUTOMATED ACCOUNT DELIVERY & FULFILLMENT SYSTEM
-- Handles inventory, auto-assignment, and verification codes
-- =====================================================

-- 1. Inventory Accounts Table
CREATE TABLE IF NOT EXISTS public.inventory_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'netflix', 'prime', 'spotify', etc.
    rules_template TEXT, -- Markdown or formatted rules
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
    UNIQUE(order_id) -- One order per assignment
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

-- RLS Policies - Inventory
CREATE POLICY "Admins can manage inventory"
    ON public.inventory_accounts
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies - Assignments
CREATE POLICY "Admins can see all assignments"
    ON public.account_assignments
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can see their own assignment"
    ON public.account_assignments
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o 
        WHERE o.id = account_assignments.order_id 
        AND (o.id::text = current_setting('request.jwt.claims', true)::jsonb->>'order_id' OR auth.uid() = o.user_id)
    ));

-- RLS Policies - Verification Codes
CREATE POLICY "Admins can see all codes"
    ON public.account_verification_codes
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can see codes for their assigned account"
    ON public.account_verification_codes
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.account_assignments aa
        JOIN public.orders o ON o.id = aa.order_id
        WHERE aa.account_id = account_verification_codes.account_id
        AND (o.id::text = current_setting('request.jwt.claims', true)::jsonb->>'order_id' OR auth.uid() = o.user_id)
    ));

-- Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_verification_codes;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Automation tables created successfully!';
END $$;

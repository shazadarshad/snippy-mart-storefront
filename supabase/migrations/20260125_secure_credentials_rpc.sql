-- Securely fetch credentials for a specific order (BYPASSES RLS)
CREATE OR REPLACE FUNCTION public.get_order_credentials(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment RECORD;
    v_account RECORD;
BEGIN
    -- 1. Find the assignment
    SELECT * INTO v_assignment
    FROM public.account_assignments
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Find the inventory account
    SELECT * INTO v_account
    FROM public.inventory_accounts
    WHERE id = v_assignment.account_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 3. Return the sanitized data
    RETURN jsonb_build_object(
        'email', v_account.email,
        'password', v_account.password,
        'service_type', v_account.service_type,
        'rules_template', v_account.rules_template,
        'region', v_account.region,
        'duration_months', v_account.duration_months,
        'assigned_at', v_assignment.assigned_at
    );
END;
$$;

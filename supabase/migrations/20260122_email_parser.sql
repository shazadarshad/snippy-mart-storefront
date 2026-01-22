-- =====================================================
-- EMAIL PARSER & CODE EXTRACTION ENGINE
-- Extracts 4-8 digit codes from raw email/webhook data
-- =====================================================

-- Function to process inbound email data
CREATE OR REPLACE FUNCTION public.fn_process_inbound_email(
    p_to_email TEXT,
    p_body_text TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_account_id UUID;
    v_extracted_code TEXT;
    v_result JSONB;
BEGIN
    -- 1. Regex to find 4-8 digit code (common for Netflix, Prime, etc)
    -- Look for digits that are preceded by 'code' or 'is: ' and are 4-8 chars long
    v_extracted_code := (
        SELECT (regexp_matches(p_body_text, '\b(\d{4,8})\b', 'g'))[1] 
        LIMIT 1
    );

    IF v_extracted_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No code found in body');
    END IF;

    -- 2. Find the inventory account associated with this email
    SELECT id INTO v_account_id
    FROM public.inventory_accounts
    WHERE email = p_to_email
    AND status IN ('active', 'full')
    LIMIT 1;

    IF v_account_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account email not found in inventory');
    END IF;

    -- 3. Check if automation is globally enabled
    IF NOT (SELECT (value->>0)::boolean FROM public.automation_settings WHERE key = 'code_extraction_enabled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Automation is currently disabled');
    END IF;

    -- 4. Insert the code (triggers Realtime for customers)
    INSERT INTO public.account_verification_codes (account_id, code)
    VALUES (v_account_id, v_extracted_code)
    RETURNING jsonb_build_object('success', true, 'code', v_extracted_code, 'account_id', v_account_id) INTO v_result;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple test script (comment out for production)
/*
SELECT public.fn_process_inbound_email(
    'money2116969@hotmail.com',
    'Your Prime Video verification code is: 847291. Do not share this code.'
);
*/

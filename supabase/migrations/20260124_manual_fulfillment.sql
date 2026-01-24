-- Disable Auto Assignment Trigger
DROP TRIGGER IF EXISTS tr_auto_assign_on_paid ON public.orders;

-- RPC for Manual Assignment
CREATE OR REPLACE FUNCTION public.admin_manual_assign_account(
    p_order_id UUID,
    p_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_status TEXT;
    v_current_users INT;
    v_max_users INT;
    v_assignment_id UUID;
BEGIN
    -- Check if already assigned
    IF EXISTS (SELECT 1 FROM public.account_assignments WHERE order_id = p_order_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order is already assigned');
    END IF;

    -- Check account availability
    SELECT status, current_users, max_users
    INTO v_account_status, v_current_users, v_max_users
    FROM public.inventory_accounts
    WHERE id = p_account_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Account not found');
    END IF;

    -- Allow assignment if status is active. We might also allow 'full' if the admin forces it? 
    -- For now, strict check.
    IF v_current_users >= v_max_users THEN
         RETURN jsonb_build_object('success', false, 'message', 'Account is full');
    END IF;

    -- Assign
    INSERT INTO public.account_assignments (order_id, account_id, assigned_at)
    VALUES (p_order_id, p_account_id, now())
    RETURNING id INTO v_assignment_id;

    -- Update inventory stats
    UPDATE public.inventory_accounts
    SET current_users = current_users + 1,
        status = CASE WHEN current_users + 1 >= max_users THEN 'full' ELSE status END
    WHERE id = p_account_id;

    -- Update Order Status to completed automatically
    UPDATE public.orders
    SET status = 'completed'
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

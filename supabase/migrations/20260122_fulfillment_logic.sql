-- =====================================================
-- AUTO-FULFILLMENT ENGINE
-- Automatically assigns an account when an order is paid
-- =====================================================

-- Function to assign an account to an order
CREATE OR REPLACE FUNCTION public.fn_auto_assign_account()
RETURNS TRIGGER AS $$
DECLARE
    v_account_id UUID;
    v_service_type TEXT;
BEGIN
    -- Only trigger when payment_status changes to 'paid'
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')) THEN
        
        -- 1. Determine the service type from order items (simplified: check first item)
        -- In a real app, you might loop through items. Here we assume one subscription per order.
        SELECT 
            p.category INTO v_service_type
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = NEW.id
        LIMIT 1;

        -- 2. Find an active account with capacity
        SELECT id INTO v_account_id
        FROM public.inventory_accounts
        WHERE LOWER(service_type) = LOWER(v_service_type)
        AND status = 'active'
        AND current_users < max_users
        ORDER BY current_users ASC -- Balance the load
        LIMIT 1;

        -- 3. If account found, assign it
        IF v_account_id IS NOT NULL THEN
            INSERT INTO public.account_assignments (order_id, account_id, assigned_at)
            VALUES (NEW.id, v_account_id, now())
            ON CONFLICT (order_id) DO NOTHING;

            -- 4. Increment user count on account
            UPDATE public.inventory_accounts
            SET current_users = current_users + 1,
                status = CASE WHEN current_users + 1 >= max_users THEN 'full' ELSE 'active' END
            WHERE id = v_account_id;

            -- 5. Mark order as 'processing' or 'delivered' automatically
            NEW.status := 'delivered';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on orders table
DROP TRIGGER IF EXISTS tr_auto_assign_on_paid ON public.orders;
CREATE TRIGGER tr_auto_assign_on_paid
    BEFORE UPDATE OF payment_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_auto_assign_account();

-- Function to handle assignment cleanup when order is cancelled
CREATE OR REPLACE FUNCTION public.fn_cleanup_account_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        -- Decrement user count
        UPDATE public.inventory_accounts
        SET current_users = GREATEST(0, current_users - 1),
            status = 'active'
        WHERE id = (SELECT account_id FROM public.account_assignments WHERE order_id = NEW.id);

        -- Remove assignment (or mark as inactive)
        DELETE FROM public.account_assignments WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cleanup
DROP TRIGGER IF EXISTS tr_cleanup_assignment ON public.orders;
CREATE TRIGGER tr_cleanup_assignment
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_cleanup_account_assignment();

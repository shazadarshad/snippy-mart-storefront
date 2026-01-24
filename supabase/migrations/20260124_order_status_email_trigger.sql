-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOMATIC EMAIL NOTIFICATIONS ON ORDER STATUS CHANGE
-- This migration sets up a database trigger to automatically send emails
-- when order status changes (processing, shipped, completed, rejected)
-- ═══════════════════════════════════════════════════════════════════════════

-- Create a function to call the Edge Function via HTTP
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  request_id BIGINT;
BEGIN
  -- Only trigger for status changes (not for new orders, those use create-order function)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Build the payload
    payload := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );

    -- Call the Edge Function using pg_net (Supabase's HTTP extension)
    -- Note: This requires the pg_net extension to be enabled
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/order-status-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := payload::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Order status change notification sent for order %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS on_order_status_change ON orders;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO service_role;

COMMENT ON FUNCTION notify_order_status_change() IS 
'Automatically sends email notifications when order status changes. 
Triggers the order-status-change Edge Function which selects and sends 
the appropriate email template (order_delivered, status_update, payment_rejected).';

COMMENT ON TRIGGER on_order_status_change ON orders IS 
'Sends automatic email notifications when order status changes';

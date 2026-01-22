-- =====================================================
-- EMAIL SYSTEM INTEGRATION - Complete SQL Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. EMAIL SETTINGS TABLE
-- Stores SMTP configuration for sending emails
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host TEXT NOT NULL DEFAULT '',
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_user TEXT NOT NULL DEFAULT '',
    smtp_password TEXT NOT NULL DEFAULT '', -- Will be encrypted in app
    smtp_secure BOOLEAN DEFAULT true, -- true = TLS/SSL
    from_email TEXT NOT NULL DEFAULT '',
    from_name TEXT DEFAULT 'Snippy Mart',
    reply_to_email TEXT,
    is_configured BOOLEAN DEFAULT false,
    last_test_at TIMESTAMPTZ,
    last_test_success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only allow one settings row (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton ON public.email_settings ((true));

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access email settings
CREATE POLICY "Only admins can view email settings"
    ON public.email_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can insert email settings"
    ON public.email_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update email settings"
    ON public.email_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 2. EMAIL TEMPLATES TABLE
-- Stores customizable email templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL, -- 'order_confirmation', 'product_delivery', etc.
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT, -- Plain text fallback
    description TEXT,
    variables JSONB DEFAULT '[]'::jsonb, -- Available variables for this template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Only admins can view email templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can insert email templates"
    ON public.email_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update email templates"
    ON public.email_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can delete email templates"
    ON public.email_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. EMAIL LOG TABLE
-- Tracks all sent emails for debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    template_key TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view logs
CREATE POLICY "Only admins can view email logs"
    ON public.email_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

-- Allow service role to insert logs (from Edge Functions)
CREATE POLICY "Service role can insert email logs"
    ON public.email_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- 4. ADD CUSTOMER EMAIL TO ORDERS TABLE
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN customer_email TEXT;
    END IF;
END $$;

-- =====================================================
-- 5. INSERT DEFAULT EMAIL TEMPLATES
-- =====================================================
INSERT INTO public.email_templates (template_key, name, subject, html_content, description, variables)
VALUES 
(
    'order_confirmation',
    'Order Confirmation',
    'Your Snippy Mart Order #{{order_id}} is Confirmed! 🎉',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="color: #00b8d4; font-size: 28px; margin: 0 0 10px;">✨ Snippy Mart</h1>
                            <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">Order Confirmed!</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi <strong style="color: #ffffff;">{{customer_name}}</strong>,
                            </p>
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Thank you for your order! We''ve received your payment and are processing your subscription.
                            </p>
                            
                            <!-- Order Box -->
                            <div style="background: rgba(0,184,212,0.1); border: 1px solid rgba(0,184,212,0.3); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                                <p style="color: #00b8d4; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Order ID</p>
                                <p style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0 0 20px; font-family: monospace;">{{order_id}}</p>
                                
                                <p style="color: #00b8d4; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Total Amount</p>
                                <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">{{total}}</p>
                            </div>
                            
                            <!-- Items -->
                            <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 16px;">Order Items:</p>
                            {{items}}
                            
                            <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                Your subscription details will be delivered via WhatsApp and email once processed. This usually takes 5-30 minutes during business hours.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="color: #666; font-size: 12px; margin: 0 0 10px;">
                                Questions? Contact us on WhatsApp
                            </p>
                            <a href="https://wa.me/94787767869" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                💬 WhatsApp Support
                            </a>
                            <p style="color: #444; font-size: 11px; margin: 20px 0 0;">
                                © 2026 Snippy Mart. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
    'Sent when a new order is placed',
    '["customer_name", "order_id", "total", "items"]'::jsonb
),
(
    'product_delivery',
    'Product Delivery',
    'Your {{product_name}} Subscription is Ready! 🚀',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Delivery</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="color: #00b8d4; font-size: 28px; margin: 0 0 10px;">✨ Snippy Mart</h1>
                            <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">Your Subscription is Ready!</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi <strong style="color: #ffffff;">{{customer_name}}</strong>,
                            </p>
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Great news! Your <strong style="color: #00b8d4;">{{product_name}}</strong> subscription has been activated. Here are your login details:
                            </p>
                            
                            <!-- Credentials Box -->
                            <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                                <p style="color: #22c55e; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">🔐 Your Login Credentials</p>
                                <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; font-family: monospace;">
                                    {{credentials}}
                                </div>
                            </div>
                            
                            <!-- Expiry -->
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 30px;">
                                <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
                                    ⏰ <strong style="color: #ffffff;">Valid Until:</strong> {{expiry_date}}
                                </p>
                            </div>
                            
                            <p style="color: #ef4444; font-size: 13px; line-height: 1.6; margin: 0; padding: 16px; background: rgba(239,68,68,0.1); border-radius: 12px;">
                                ⚠️ <strong>Important:</strong> Do not share these credentials. Sharing may result in account termination without refund.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="color: #666; font-size: 12px; margin: 0 0 10px;">
                                Need help? We''re here 24/7
                            </p>
                            <a href="https://wa.me/94787767869" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                💬 WhatsApp Support
                            </a>
                            <p style="color: #444; font-size: 11px; margin: 20px 0 0;">
                                © 2026 Snippy Mart. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
    'Sent when order is marked as completed with credentials',
    '["customer_name", "product_name", "credentials", "expiry_date"]'::jsonb
),
(
    'order_status_update',
    'Order Status Update',
    'Update on Your Order #{{order_id}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <tr>
                        <td style="padding: 40px; text-align: center;">
                            <h1 style="color: #00b8d4; font-size: 24px; margin: 0 0 20px;">✨ Snippy Mart</h1>
                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 30px;">
                                Your order status has been updated
                            </p>
                            
                            <div style="background: rgba(0,184,212,0.1); border: 1px solid rgba(0,184,212,0.3); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
                                <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px;">ORDER ID</p>
                                <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 16px; font-family: monospace;">{{order_id}}</p>
                                <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px;">NEW STATUS</p>
                                <p style="color: #00b8d4; font-size: 20px; font-weight: bold; margin: 0;">{{status}}</p>
                            </div>
                            
                            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 30px;">{{message}}</p>
                            
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: #00b8d4; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                                Track Your Order
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
    'Sent when order status changes',
    '["order_id", "status", "message"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;

-- =====================================================
-- 6. INSERT DEFAULT EMAIL SETTINGS (empty, to be configured)
-- =====================================================
INSERT INTO public.email_settings (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_configured)
VALUES ('', 587, '', '', '', 'Snippy Mart', false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.email_settings TO authenticated;
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Email System Migration Complete!';
    RAISE NOTICE '   - email_settings table created';
    RAISE NOTICE '   - email_templates table created with 3 default templates';
    RAISE NOTICE '   - email_logs table created';
    RAISE NOTICE '   - customer_email column added to orders';
END $$;

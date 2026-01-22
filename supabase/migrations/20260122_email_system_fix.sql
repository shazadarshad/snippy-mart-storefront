-- =====================================================
-- EMAIL SYSTEM - FIX MIGRATION
-- Run this AFTER the first migration failed
-- This drops existing policies and recreates them correctly
-- Also updates email templates to better versions
-- =====================================================

-- Drop existing policies first (they had wrong table reference)
DROP POLICY IF EXISTS "Only admins can view email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Only admins can insert email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Only admins can update email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Only admins can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Only admins can insert email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Only admins can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Only admins can delete email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Only admins can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow insert for email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- =====================================================
-- RECREATE POLICIES WITH CORRECT TABLE (user_roles)
-- =====================================================

-- Email Settings Policies
CREATE POLICY "Only admins can view email settings"
    ON public.email_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can insert email settings"
    ON public.email_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update email settings"
    ON public.email_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Email Templates Policies
CREATE POLICY "Only admins can view email templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can insert email templates"
    ON public.email_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update email templates"
    ON public.email_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete email templates"
    ON public.email_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Email Logs Policies
CREATE POLICY "Only admins can view email logs"
    ON public.email_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Allow insert for email logs"
    ON public.email_logs FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- =====================================================
-- UPDATE EMAIL TEMPLATES TO ENHANCED VERSIONS
-- =====================================================
UPDATE public.email_templates 
SET 
    subject = '✅ Order Confirmed! Your Snippy Mart Order #{{order_id}}',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Snippy Mart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Segoe UI'', ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(0,184,212,0.1) 0%, rgba(139,92,246,0.1) 100%);">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="80" height="80" style="border-radius: 20px; margin-bottom: 16px;">
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Mart</span>
                            </h1>
                            <p style="color: #a0a0a0; font-size: 14px; margin: 8px 0 0;">Premium Digital Subscriptions</p>
                        </td>
                    </tr>
                    
                    <!-- Success Banner -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 16px; padding: 24px; text-align: center; margin-top: 20px;">
                                <p style="color: #ffffff; font-size: 32px; margin: 0 0 8px;">🎉</p>
                                <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Order Confirmed!</h2>
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">Thank you for your purchase</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 0;">
                            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0;">
                                Hi <strong style="color: #ffffff;">{{customer_name}}</strong> 👋
                            </p>
                            <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 16px 0 0;">
                                Amazing choice! Your order has been successfully received and is now being processed. We''ll have your subscription ready in no time!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Order Details Box -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <div style="background: rgba(0,184,212,0.08); border: 1px solid rgba(0,184,212,0.25); border-radius: 20px; padding: 28px; position: relative; overflow: hidden;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                            <p style="color: #00b8d4; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px; font-weight: 600;">Order Number</p>
                                            <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 1px;">{{order_id}}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 20px;">
                                            <p style="color: #00b8d4; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px; font-weight: 600;">Total Amount</p>
                                            <p style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 0;">{{total}}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Order Items -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 16px;">📦 Your Items</p>
                            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
                                {{items}}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- What Happens Next -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 24px;">
                                <p style="color: #a78bfa; font-size: 14px; font-weight: 700; margin: 0 0 12px;">⚡ What Happens Next?</p>
                                <ol style="color: #c0c0c0; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>We verify your payment (usually instant)</li>
                                    <li>Your subscription is activated within 5-30 minutes</li>
                                    <li>Login details sent via WhatsApp & Email</li>
                                </ol>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA Buttons -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding-right: 8px; width: 50%;">
                                        <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: block; background: linear-gradient(135deg, #00b8d4, #0891b2); color: #ffffff; padding: 16px 24px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center;">
                                            🔍 Track Order
                                        </a>
                                    </td>
                                    <td style="padding-left: 8px; width: 50%;">
                                        <a href="https://wa.me/94787767869" style="display: block; background: #25D366; color: #ffffff; padding: 16px 24px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center;">
                                            💬 WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="color: #888; font-size: 13px; margin: 0 0 16px;">Need help? We''re here 24/7</p>
                                        <table style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 Website</a>
                                                </td>
                                                <td style="padding: 0 12px; border-left: 1px solid #333;">
                                                    <a href="https://wa.me/94787767869" style="color: #25D366; text-decoration: none; font-size: 13px; font-weight: 600;">💬 WhatsApp</a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="color: #555; font-size: 11px; margin: 24px 0 0;">
                                            © 2026 Snippy Mart. All rights reserved.<br>
                                            Premium Digital Subscriptions at Unbeatable Prices
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'order_confirmation';

UPDATE public.email_templates 
SET 
    subject = '🚀 Your {{product_name}} is Ready! - Snippy Mart',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Delivery - Snippy Mart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Segoe UI'', ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%);">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="80" height="80" style="border-radius: 20px; margin-bottom: 16px;">
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Mart</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Success Banner -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 16px; padding: 24px; text-align: center; margin-top: 20px;">
                                <p style="color: #ffffff; font-size: 40px; margin: 0 0 8px;">🚀</p>
                                <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Your Subscription is Ready!</h2>
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">{{product_name}}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 0;">
                            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0;">
                                Hi <strong style="color: #ffffff;">{{customer_name}}</strong> 👋
                            </p>
                            <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 16px 0 0;">
                                Great news! Your <strong style="color: #00b8d4;">{{product_name}}</strong> subscription has been activated.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credentials Box -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.15)); border: 2px solid rgba(34,197,94,0.4); border-radius: 20px; padding: 28px; position: relative;">
                                <div style="position: absolute; top: 12px; right: 12px; background: #22c55e; color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 20px; font-weight: 700;">ACTIVE</div>
                                <p style="color: #22c55e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">🔐 Login Credentials</p>
                                <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; font-family: monospace;">
                                    {{credentials}}
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Validity -->
                    <tr>
                        <td style="padding: 0 40px 20px;">
                            <div style="background: rgba(0,184,212,0.08); border: 1px solid rgba(0,184,212,0.25); border-radius: 14px; padding: 18px 24px;">
                                <p style="color: #e0e0e0; font-size: 14px; margin: 0;">
                                    ⏰ <strong style="color: #ffffff;">Valid Until:</strong> <span style="color: #00b8d4; font-weight: 600;">{{expiry_date}}</span>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Warning -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 14px; padding: 18px 24px;">
                                <p style="color: #fca5a5; font-size: 13px; line-height: 1.6; margin: 0;">
                                    ⚠️ <strong>Important:</strong> Do not share these credentials.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <a href="https://wa.me/94787767869" style="display: block; background: #25D366; color: #ffffff; padding: 18px 24px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center;">
                                💬 Need Help? WhatsApp Us
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="text-align: center;">
                                        <table style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 Website</a>
                                                </td>
                                                <td style="padding: 0 12px; border-left: 1px solid #333;">
                                                    <a href="https://wa.me/94787767869" style="color: #25D366; text-decoration: none; font-size: 13px; font-weight: 600;">💬 WhatsApp</a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="color: #555; font-size: 11px; margin: 24px 0 0;">
                                            © 2026 Snippy Mart. All rights reserved. ❤️
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'product_delivery';

UPDATE public.email_templates 
SET 
    subject = '📊 Order Update: #{{order_id}} - Snippy Mart',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update - Snippy Mart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: ''Segoe UI'', ''Inter'', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="64" height="64" style="border-radius: 16px; margin-bottom: 12px;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Mart</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Status Update -->
                    <tr>
                        <td style="padding: 20px 40px 30px; text-align: center;">
                            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 20px;">Order status has been updated</p>
                            
                            <div style="background: rgba(0,184,212,0.08); border: 1px solid rgba(0,184,212,0.25); border-radius: 20px; padding: 28px;">
                                <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Order ID</p>
                                <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 24px; font-family: monospace;">{{order_id}}</p>
                                <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">New Status</p>
                                <p style="color: #00b8d4; font-size: 24px; font-weight: 800; margin: 0;">{{status}}</p>
                            </div>
                            
                            <p style="color: #c0c0c0; font-size: 14px; line-height: 1.7; margin: 24px 0 0;">{{message}}</p>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding-right: 8px; width: 50%;">
                                        <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: block; background: linear-gradient(135deg, #00b8d4, #0891b2); color: #ffffff; padding: 16px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center;">
                                            🔍 Track Order
                                        </a>
                                    </td>
                                    <td style="padding-left: 8px; width: 50%;">
                                        <a href="https://wa.me/94787767869" style="display: block; background: #25D366; color: #ffffff; padding: 16px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center;">
                                            💬 WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
                            <a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 snippymart.com</a>
                            <p style="color: #555; font-size: 11px; margin: 16px 0 0;">© 2026 Snippy Mart. All rights reserved.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'order_status_update';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Email System Fix Complete!';
    RAISE NOTICE '   - Policies recreated with correct user_roles table';
    RAISE NOTICE '   - Email templates updated to enhanced versions with logo';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SNIPPY MART - PREMIUM EMAIL TEMPLATES v3.0
-- Dark Glassmorphism Theme • Modern Design • Mobile Responsive
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ORDER CONFIRMATION (Green Success Theme)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_confirmation', 
    'Order Confirmation', 
    '✅ Order Confirmed - Snippy Mart #{{order_id}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; min-height: 100vh;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
        <tr>
            <td align="center" style="padding: 40px 15px;">
                <!-- Main Container with Glassmorphism -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 35px 40px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px;">
                                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 24px;">🛒</span>
                                        </div>
                                    </td>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Snippy <span style="color: #10b981;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Success Badge -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 20px 40px; display: inline-block;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding-right: 12px;">
                                            <span style="font-size: 32px;">✅</span>
                                        </td>
                                        <td>
                                            <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Order Confirmed!</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="margin: 0; color: #e2e8f0; font-size: 16px; line-height: 26px;">
                                Hey <strong style="color: #ffffff;">{{customer_name}}</strong>! 👋<br><br>
                                Thank you for your purchase. We''ve received your order and our team is preparing your subscription. You''ll receive your login details shortly!
                            </p>
                        </td>
                    </tr>

                    <!-- Order Details Card -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(15, 23, 42, 0.6); border-radius: 16px; padding: 25px; border: 1px solid rgba(255,255,255,0.08);">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                            <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">📦 Order Number</p>
                                            <p style="margin: 0; color: #10b981; font-size: 18px; font-weight: 700; font-family: monospace;">#{{order_id}}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                            <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">🛍️ Items Purchased</p>
                                            <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 24px;">{{items}}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">💰 Total Amount</p>
                                                        <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: 800;">{{total}}</p>
                                                    </td>
                                                    <td align="right">
                                                        <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">💳 Payment</p>
                                                        <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">Verified ✓</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 20px;">
                                            <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">⏱️ Status</p>
                                            <span style="display: inline-block; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">Processing</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
                                🔍 Track Your Order
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255,255,255,0.08);">
                            <!-- Social Icons -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://snippymart.com" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">🌐</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; width: 40px; height: 40px; background: rgba(37, 211, 102, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">💬</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(228, 64, 95, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">📸</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://facebook.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(24, 119, 242, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">👤</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px; color: #64748b; font-size: 12px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #475569; font-size: 11px;">© 2026 All rights reserved</p>
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
</html>',
    'Sent immediately after customer places an order.',
    '["customer_name", "order_id", "total", "items"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, html_content = EXCLUDED.html_content, variables = EXCLUDED.variables;


-- 2. ORDER DELIVERED (Credentials + Access)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_delivered', 
    'Order Delivered', 
    '🚀 Your {{product_name}} is Ready! - Snippy Mart',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Ready</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
        <tr>
            <td align="center" style="padding: 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 35px 40px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px;">
                                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px;"></div>
                                    </td>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Snippy <span style="color: #a78bfa;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Success Badge -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 16px; padding: 20px 40px;">
                                <p style="margin: 0; color: #ffffff; font-size: 32px;">🚀</p>
                                <p style="margin: 10px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">Access Ready!</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="margin: 0; color: #e2e8f0; font-size: 16px; line-height: 26px;">
                                Hey <strong style="color: #ffffff;">{{customer_name}}</strong>! 🎉<br><br>
                                Great news! Your <strong style="color: #a78bfa;">{{product_name}}</strong> subscription is now active. Here are your login credentials:
                            </p>
                        </td>
                    </tr>

                    <!-- Credentials Box -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%); border: 2px solid #8b5cf6; border-radius: 16px; padding: 25px;">
                                <p style="margin: 0 0 15px; color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">🔐 Login Credentials</p>
                                <div style="color: #ffffff; font-size: 15px; font-family: ''Courier New'', monospace; line-height: 2;">
                                    {{credentials}}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Usage Rules -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; border-radius: 8px; padding: 20px;">
                                <p style="margin: 0 0 10px; color: #fbbf24; font-size: 13px; font-weight: 700;">⚠️ Important Guidelines</p>
                                <p style="margin: 0; color: #fcd34d; font-size: 14px; line-height: 22px; white-space: pre-wrap;">{{message}}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);">
                                🔑 Get Verification Code
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 8px;"><a href="https://snippymart.com" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">🌐</a></td>
                                                <td style="padding: 0 8px;"><a href="https://wa.me/94787767869" style="display: inline-block; width: 40px; height: 40px; background: rgba(37, 211, 102, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">💬</a></td>
                                                <td style="padding: 0 8px;"><a href="https://instagram.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(228, 64, 95, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">📸</a></td>
                                                <td style="padding: 0 8px;"><a href="https://facebook.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(24, 119, 242, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">👤</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px; color: #64748b; font-size: 12px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #475569; font-size: 11px;">© 2026 All rights reserved</p>
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
</html>',
    'Sent when order is completed with credentials.',
    '["customer_name", "order_id", "product_name", "credentials", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, html_content = EXCLUDED.html_content, variables = EXCLUDED.variables;


-- 3. PAYMENT REJECTED (Red Urgent Theme)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'payment_rejected', 
    'Payment Rejected', 
    '⚠️ Payment Issue - Order #{{order_id}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Issue</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
        <tr>
            <td align="center" style="padding: 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 35px 40px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px;">
                                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px;"></div>
                                    </td>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Snippy <span style="color: #f87171;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Alert Badge -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; padding: 20px 40px;">
                                <p style="margin: 0; color: #ffffff; font-size: 40px;">⚠️</p>
                                <p style="margin: 10px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">Payment Issue</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="margin: 0; color: #e2e8f0; font-size: 16px; line-height: 26px;">
                                Hello <strong style="color: #ffffff;">{{customer_name}}</strong>,<br><br>
                                We were unable to verify your payment for order <strong style="color: #f87171;">#{{order_id}}</strong>. Your order has been cancelled.
                            </p>
                        </td>
                    </tr>

                    <!-- Reason Box -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px;">
                                <p style="margin: 0 0 10px; color: #f87171; font-size: 13px; font-weight: 700;">❌ Reason for Rejection</p>
                                <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 22px;">{{message}}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Help Text -->
                    <tr>
                        <td style="padding: 0 40px 20px;">
                            <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 24px;">
                                If you believe this is an error, please contact our support team with your payment receipt.
                            </p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="https://wa.me/94787767869" style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);">
                                💬 Contact Support
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 8px;"><a href="https://snippymart.com" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">🌐</a></td>
                                                <td style="padding: 0 8px;"><a href="https://wa.me/94787767869" style="display: inline-block; width: 40px; height: 40px; background: rgba(37, 211, 102, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">💬</a></td>
                                                <td style="padding: 0 8px;"><a href="https://instagram.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(228, 64, 95, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">📸</a></td>
                                                <td style="padding: 0 8px;"><a href="https://facebook.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(24, 119, 242, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">👤</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px; color: #64748b; font-size: 12px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #475569; font-size: 11px;">© 2026 All rights reserved</p>
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
</html>',
    'Sent when payment verification fails.',
    '["customer_name", "order_id", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, html_content = EXCLUDED.html_content, variables = EXCLUDED.variables;


-- 4. ORDER STATUS UPDATE (Blue Info Theme)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_status_update', 
    'Order Status Update', 
    '📦 Order Update - #{{order_id}} is now {{status}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Update</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
        <tr>
            <td align="center" style="padding: 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 35px 40px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px;">
                                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px;"></div>
                                    </td>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Snippy <span style="color: #60a5fa;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Status Badge -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; padding: 20px 40px;">
                                <p style="margin: 0; color: #ffffff; font-size: 32px;">📦</p>
                                <p style="margin: 10px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">Status Update</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Message -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="margin: 0; color: #e2e8f0; font-size: 16px; line-height: 26px;">
                                Hey <strong style="color: #ffffff;">{{customer_name}}</strong>! 👋<br><br>
                                We have an update on your order <strong style="color: #60a5fa;">#{{order_id}}</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Status Card -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <div style="background: rgba(15, 23, 42, 0.6); border-radius: 16px; padding: 25px; border: 1px solid rgba(255,255,255,0.08);">
                                <p style="margin: 0 0 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">📊 New Status</p>
                                <p style="margin: 0 0 20px; color: #60a5fa; font-size: 26px; font-weight: 800; text-transform: capitalize;">{{status}}</p>
                                <p style="margin: 0; color: #cbd5e1; font-size: 15px; line-height: 24px;">{{message}}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);">
                                🔍 View Full Details
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 8px;"><a href="https://snippymart.com" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">🌐</a></td>
                                                <td style="padding: 0 8px;"><a href="https://wa.me/94787767869" style="display: inline-block; width: 40px; height: 40px; background: rgba(37, 211, 102, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">💬</a></td>
                                                <td style="padding: 0 8px;"><a href="https://instagram.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(228, 64, 95, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">📸</a></td>
                                                <td style="padding: 0 8px;"><a href="https://facebook.com/snippymart" style="display: inline-block; width: 40px; height: 40px; background: rgba(24, 119, 242, 0.2); border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none; font-size: 18px;">👤</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px; color: #64748b; font-size: 12px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #475569; font-size: 11px;">© 2026 All rights reserved</p>
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
</html>',
    'Sent when order status changes.',
    '["customer_name", "order_id", "status", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, html_content = EXCLUDED.html_content, variables = EXCLUDED.variables;

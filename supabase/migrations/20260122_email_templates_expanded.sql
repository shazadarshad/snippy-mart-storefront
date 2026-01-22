-- Premium Email Templates for Snippy Mart - FINAL VERSION
-- Features: Darker cyan branding, logo header, social footer, copyright notice

-- 1. Order Confirmation
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_confirmation', 
    'Order Confirmation', 
    'Your Snippy Mart Order #{{order_id}} is Confirmed!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);">
                            <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">SnippyMart</h1>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Order Confirmation</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 700;">Hello {{customer_name}},</h2>
                            <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 24px;">Thank you for your order! We have received your payment and our team is now preparing your subscription.</p>
                            
                            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="padding-bottom: 15px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Order Number</td>
                                        <td align="right" style="padding-bottom: 15px; color: #1e293b; font-size: 14px; font-weight: bold;">#{{order_id}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 15px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Details</td>
                                        <td align="right" style="padding-bottom: 15px; color: #1e293b; font-size: 14px;">{{items}}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #e2e8f0;">
                                        <td style="padding-top: 15px; color: #1e293b; font-size: 16px; font-weight: bold;">Total Amount</td>
                                        <td align="right" style="padding-top: 15px; color: #0891b2; font-size: 22px; font-weight: 800;">{{total}}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="text-align: center;">
                                <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 18px 36px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px;">Track Your Order</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Social Footer -->
                    <tr>
                        <td style="padding: 30px 40px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; font-weight: 600;">Connect with us</p>
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">WhatsApp</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; background-color: #E4405F; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">Instagram</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SnippyMart. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 11px;">Premium Digital Subscriptions</p>
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
SET 
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables;

-- 2. Order Delivered (with credentials)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_delivered', 
    'Order Delivered', 
    '🚀 Your {{product_name}} is Ready!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Delivered</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdfa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdfa;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(8,145,178,0.15);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);">
                            <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 32px; font-weight: 800;">SnippyMart</h1>
                            <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 700;">🚀 Access Ready!</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 25px; color: #334155; font-size: 16px; line-height: 24px;">Hello {{customer_name}},<br><br>Great news! Your <strong>{{product_name}}</strong> subscription is now active. Find your login details below:</p>
                            
                            <div style="background-color: #ffffff; border: 2px solid #0891b2; border-radius: 16px; padding: 30px; margin: 30px 0;">
                                <div style="color: #1e293b; font-size: 16px; font-family: monospace; line-height: 1.8;">
                                    {{credentials}}
                                </div>
                            </div>

                            <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 35px;">
                                <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: bold; text-transform: uppercase;">📕 Usage Guidelines</p>
                                <div style="color: #78350f; font-size: 14px; line-height: 22px; white-space: pre-wrap;">{{message}}</div>
                            </div>

                            <div style="text-align: center;">
                                <p style="color: #64748b; font-size: 14px; margin-bottom: 15px;">Need a verification code? Get it instantly:</p>
                                <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 16px;">Live Verification Hub</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Social Footer -->
                    <tr>
                        <td style="padding: 30px 40px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; font-weight: 600;">Connect with us</p>
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">WhatsApp</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; background-color: #E4405F; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">Instagram</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SnippyMart. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 11px;">Premium Digital Subscriptions</p>
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
    'Sent when an order is completed. Includes login credentials.',
    '["customer_name", "order_id", "product_name", "credentials", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET 
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables;

-- 3. Payment Rejected
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'payment_rejected', 
    'Payment Rejected', 
    '⚠️ Order #{{order_id}} - Payment Issue',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Rejected</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff1f2; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff1f2;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(225,29,72,0.1);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px; background-color: #fff1f2;">
                            <h1 style="margin: 0 0 8px; color: #64748b; font-size: 28px; font-weight: 800;">SnippyMart</h1>
                            <div style="margin: 15px 0;">
                                <span style="font-size: 50px;">⚠️</span>
                            </div>
                            <h2 style="margin: 10px 0 0; color: #be123c; font-size: 22px; font-weight: 800;">Payment Not Verified</h2>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 25px; color: #334155; font-size: 16px; line-height: 24px;">Hello {{customer_name}},<br><br>We were unable to verify your payment for order <strong>#{{order_id}}</strong>. Your order has been cancelled.</p>
                            
                            <div style="background-color: #fff1f2; border-left: 5px solid #e11d48; border-radius: 8px; padding: 25px; margin: 30px 0;">
                                <p style="margin: 0 0 5px; color: #9f1239; font-size: 13px; font-weight: bold; text-transform: uppercase;">Reason:</p>
                                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 22px;">{{message}}</p>
                            </div>

                            <p style="color: #64748b; font-size: 14px; margin-bottom: 25px;">If you believe this is an error, please contact our support team immediately with your payment proof.</p>
                            
                            <div style="text-align: center;">
                                <a href="https://wa.me/94787767869" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 18px 40px; border-radius: 14px; font-weight: bold; text-decoration: none; font-size: 16px;">Contact Support</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Social Footer -->
                    <tr>
                        <td style="padding: 30px 40px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; font-weight: 600;">Connect with us</p>
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">WhatsApp</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; background-color: #E4405F; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">Instagram</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SnippyMart. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 11px;">Premium Digital Subscriptions</p>
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
    'Sent when an order is cancelled or payment verification fails.',
    '["customer_name", "order_id", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET 
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables;

-- 4. Order Status Update
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_status_update', 
    'Order Status Update', 
    'Update: Order #{{order_id}} - {{status}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);">
                            <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 32px; font-weight: 800;">SnippyMart</h1>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Status Update</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 700;">Hello {{customer_name}},</h2>
                            <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 24px;">We have an update regarding your order <strong>#{{order_id}}</strong>.</p>
                            
                            <div style="background-color: #f1f5f9; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">New Status</p>
                                <p style="margin: 5px 0 20px; color: #0891b2; font-size: 20px; font-weight: 800; text-transform: capitalize;">{{status}}</p>
                                <p style="margin: 0; font-size: 15px; color: #334155; line-height: 24px;">{{message}}</p>
                            </div>

                            <div style="text-align: center;">
                                <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 18px 36px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px;">View Live Tracking</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Social Footer -->
                    <tr>
                        <td style="padding: 30px 40px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; font-weight: 600;">Connect with us</p>
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">WhatsApp</a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; background-color: #E4405F; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">Instagram</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 SnippyMart. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 11px;">Premium Digital Subscriptions</p>
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
    'Sent when an order status changes.',
    '["customer_name", "order_id", "status", "message"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET 
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables;

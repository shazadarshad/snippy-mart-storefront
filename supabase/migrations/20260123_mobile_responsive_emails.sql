-- ═══════════════════════════════════════════════════════════════════════════
-- SNIPPY MART - PREMIUM EMAIL TEMPLATES v4.0
-- 100% Mobile Responsive • Card Payment Support • Currency-Aware
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ORDER CONFIRMATION (Green Success Theme)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_confirmation', 
    'Order Confirmation', 
    '✅ Order Confirmed - Snippy Mart #{{order_id}}',
    '<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Order Confirmed</title>
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <!-- Main Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 10px;">
                                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; text-align: center; line-height: 40px;">
                                            <span style="font-size: 20px;">🛒</span>
                                        </div>
                                    </td>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Snippy <span style="color: #10b981;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Success Badge -->
                    <tr>
                        <td align="center" style="padding: 0 20px 25px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 15px 30px;">
                                <tr>
                                    <td style="padding-right: 10px;">
                                        <span style="font-size: 28px;">✅</span>
                                    </td>
                                    <td>
                                        <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Order Confirmed!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 24px;">
                                Hey <strong style="color: #ffffff;">{{customer_name}}</strong>! 👋<br><br>
                                Thank you for your purchase. We''ve received your order and our team is preparing your subscription. You''ll receive your login details shortly!
                            </p>
                        </td>
                    </tr>

                    <!-- Order Details Card -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                                <tr>
                                    <td style="padding: 20px;">
                                        <!-- Order Number -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 5px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">📦 Order Number</p>
                                                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: 700; font-family: monospace;">#{{order_id}}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Items -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 5px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">🛍️ Items Purchased</p>
                                                    <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 22px;">{{items}}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Total & Payment -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                                            <tr>
                                                <td width="50%" style="vertical-align: top;">
                                                    <p style="margin: 0 0 5px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">💰 Total Amount</p>
                                                    <p style="margin: 0; color: #10b981; font-size: 20px; font-weight: 800;">{{total}}</p>
                                                </td>
                                                <td width="50%" style="text-align: right; vertical-align: top;">
                                                    <p style="margin: 0 0 5px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">💳 Payment</p>
                                                    <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">{{payment_method}}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Status -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 5px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">⏱️ Status</p>
                                                    <span style="display: inline-block; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Processing</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 20px 30px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px;">
                                🔍 Track Your Order
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 20px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255,255,255,0.08);">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://snippymart.com" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none; font-size: 16px;">🌐</a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://wa.me/94787767869" style="display: inline-block; width: 36px; height: 36px; background: rgba(37, 211, 102, 0.2); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none; font-size: 16px;">💬</a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://instagram.com/snippymart" style="display: inline-block; width: 36px; height: 36px; background: rgba(228, 64, 95, 0.2); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none; font-size: 16px;">📸</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px; color: #94a3b8; font-size: 11px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #64748b; font-size: 10px;">© 2026 All rights reserved</p>
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
    '["customer_name", "order_id", "total", "items", "payment_method"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, html_content = EXCLUDED.html_content, variables = EXCLUDED.variables;

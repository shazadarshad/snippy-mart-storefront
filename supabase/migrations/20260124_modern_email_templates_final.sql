-- ═══════════════════════════════════════════════════════════════════════════
-- SNIPPY MART - REACT EMAIL TEMPLATES (Pre-rendered HTML)
-- Modern Lucide Icons • Glassmorphism • 100% Mobile Responsive
-- Ready to deploy - No build step required!
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ORDER CONFIRMATION (Green Theme)
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_confirmation', 
    'Order Confirmation', 
    '✅ Order Confirmed - Snippy Mart #{{order_id}}',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
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
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05); overflow: hidden;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 32px 24px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; text-align: center; line-height: 48px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: 12px;">
                                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                                <line x1="3" y1="6" x2="21" y2="6"/>
                                                <path d="M16 10a4 4 0 0 1-8 0"/>
                                            </svg>
                                        </div>
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Snippy <span style="color: #10b981;">Mart</span></h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Success Badge -->
                    <tr>
                        <td align="center" style="padding: 0 24px 28px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 15px 30px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                            <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Order Confirmed!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 0 24px 28px;">
                            <p style="margin: 0 0 12px; color: #e2e8f0; font-size: 16px; line-height: 24px;">
                                Hey <strong style="color: #ffffff;">{{customer_name}}</strong>! 👋
                            </p>
                            <p style="margin: 0; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                                Thank you for your purchase. We''ve received your order and our team is preparing your subscription. You''ll receive your login details shortly!
                            </p>
                        </td>
                    </tr>

                    <!-- Order Details Card -->
                    <tr>
                        <td style="padding: 0 24px 28px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(15, 23, 42, 0.6); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);">
                                <tr>
                                    <td style="padding: 24px;">
                                        
                                        <!-- Order Number -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                                            <tr>
                                                <td style="width: 20px; padding-right: 10px; vertical-align: top;">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                                                    </svg>
                                                </td>
                                                <td>
                                                    <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Order Number</p>
                                                    <p style="margin: 0; color: #10b981; font-size: 17px; font-weight: 700; font-family: monospace;">#{{order_id}}</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Items -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                                            <tr>
                                                <td style="width: 20px; padding-right: 10px; vertical-align: top;">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <circle cx="9" cy="21" r="1"/>
                                                        <circle cx="20" cy="21" r="1"/>
                                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                                    </svg>
                                                </td>
                                                <td>
                                                    <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Items Purchased</p>
                                                    <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 22px;">{{items}}</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Total & Payment -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                                            <tr>
                                                <td width="50%" style="vertical-align: top;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="width: 20px; padding-right: 10px; vertical-align: top;">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <line x1="12" y1="1" x2="12" y2="23"/>
                                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                                </svg>
                                                            </td>
                                                            <td>
                                                                <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total Amount</p>
                                                                <p style="margin: 0; color: #10b981; font-size: 22px; font-weight: 800;">{{total}}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%" style="vertical-align: top; text-align: right;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right">
                                                        <tr>
                                                            <td style="width: 20px; padding-right: 10px; vertical-align: top;">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                                                </svg>
                                                            </td>
                                                            <td>
                                                                <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment</p>
                                                                <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">{{payment_method}}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Status -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="width: 20px; padding-right: 10px; vertical-align: top;">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12 6 12 12 16 14"/>
                                                    </svg>
                                                </td>
                                                <td>
                                                    <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</p>
                                                    <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.3);">Processing</span>
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
                        <td align="center" style="padding: 0 24px 32px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 36px; border-radius: 14px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding-right: 8px; vertical-align: middle;">Track Your Order</td>
                                        <td style="vertical-align: middle;">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                                <polyline points="12 5 19 12 12 19"/>
                                            </svg>
                                        </td>
                                    </tr>
                                </table>
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 28px 24px; background: rgba(15, 23, 42, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.08);">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 15px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://snippymart.com" style="display: inline-block; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none; font-size: 16px;">🌐</a>
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
                                        <p style="margin: 0 0 6px; color: #94a3b8; font-size: 12px;">Snippy Mart • Premium Digital Subscriptions</p>
                                        <p style="margin: 0; color: #64748b; font-size: 11px;">© 2026 All rights reserved</p>
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
    'Sent immediately after customer places an order. Modern design with Lucide-style icons and glassmorphism.',
    '["customer_name", "order_id", "total", "items", "payment_method"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, 
    html_content = EXCLUDED.html_content, 
    variables = EXCLUDED.variables,
    description = EXCLUDED.description;

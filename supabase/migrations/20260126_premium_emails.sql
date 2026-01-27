-- =====================================================
-- PREMIUM RESPONSIVE EMAIL TEMPLATES (GLASSMORPHISM)
-- Optimized for Mobile & Modern Email Clients
-- =====================================================

-- 1. ORDER CONFIRMATION
UPDATE public.email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 15px !important; }
            .header { padding: 30px 20px !important; }
            .content { padding: 25px 20px !important; }
            .footer { padding: 25px 20px !important; }
            .order-box { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            .buttons { flex-direction: column !important; }
            .button { display: block !important; margin: 5px 0 !important; width: auto !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: ''Inter'', ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050508;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: linear-gradient(180deg, #0f0f1a 0%, #050508 100%); border-radius: 32px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 50px 40px; background: radial-gradient(circle at top, rgba(0,184,212,0.1) 0%, transparent 70%);">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="70" height="70" style="border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 24px 0 8px; letter-spacing: -1px;">
                                Snippy<span style="color: #00b8d4;">Mart</span>
                            </h1>
                            <p style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Premium Digital Subscriptions</p>
                        </td>
                    </tr>
                    
                    <!-- Success State -->
                    <tr>
                        <td align="center" style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.1)); border: 1px solid rgba(34,197,94,0.2); border-radius: 20px; padding: 30px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
                                <h2 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800;">Order Confirmed!</h2>
                                <p style="color: #22c55e; font-size: 14px; margin: 8px 0 0; font-weight: 600;">We''ve received your payment details</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">Hi <strong style="color: #ffffff;">{{customer_name}}</strong> 👋</p>
                            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 16px 0 0;">
                                Your order is being processed by our system. You will receive your credentials shortly via WhatsApp and Email.
                            </p>
                            
                            <!-- Order Info (Glassmorphism effect) -->
                            <div style="margin-top: 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 28px; position: relative; overflow: hidden;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                            <p style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin: 0 0 6px;">Order Identification</p>
                                            <p style="color: #00b8d4; font-size: 20px; font-weight: 800; margin: 0; font-family: ''Courier New'', monospace;">#{{order_id}}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin: 0 0 6px;">Total Investment</p>
                                            <p style="color: #ffffff; font-size: 32px; font-weight: 900; margin: 0;">{{total}}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Items -->
                            <div style="margin-top: 32px;">
                                <p style="color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">📦</span> Your Access
                                </p>
                                <div style="background: rgba(255,255,255,0.02); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">{{items}}</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <table class="buttons" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="48%">
                                        <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: block; background: #00b8d4; color: #ffffff; text-decoration: none; padding: 18px; border-radius: 16px; font-weight: 800; font-size: 14px; text-align: center; box-shadow: 0 10px 20px rgba(0,184,212,0.2);">🔍 TRACK STATUS</a>
                                    </td>
                                    <td width="4%">&nbsp;</td>
                                    <td width="48%">
                                        <a href="https://wa.me/94787767869" style="display: block; background: rgba(37,211,102,0.1); color: #25d366; text-decoration: none; padding: 18px; border-radius: 16px; border: 1px solid #25d366; font-weight: 800; font-size: 14px; text-align: center;">💬 WHATSAPP</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px; background: rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.05);">
                            <p style="color: #475569; font-size: 11px; line-height: 1.6; margin: 0;">
                                SECURE DIGITAL DELIVERY SYSTEM v2.0<br>
                                © 2026 SNIPPY MART. ALL RIGHTS RESERVED.<br><br>
                                <a href="https://snippymart.com" style="color: #64748b; text-decoration: none;">Privacy Policy</a> • <a href="https://snippymart.com" style="color: #64748b; text-decoration: none;">Terms of Service</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'order_confirmation';

-- 2. PRODUCT DELIVERY
UPDATE public.email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Ready</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 15px !important; }
            .header { padding: 30px 20px !important; }
            .content { padding: 25px 20px !important; }
            .credentials-box { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: ''Inter'', ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050508;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: linear-gradient(180deg, #10101a 0%, #050508 100%); border-radius: 32px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 50px 40px; background: radial-gradient(circle at top, rgba(168,85,247,0.1) 0%, transparent 70%);">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="70" height="70" style="border-radius: 20px;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 24px 0 8px; letter-spacing: -1px;">
                                Snippy<span style="color: #a855f7;">Mart</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Ready State -->
                    <tr>
                        <td align="center" style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(168,85,247,0.2); border-radius: 20px; padding: 30px; text-align: center;">
                                <div style="font-size: 40px; margin-bottom: 12px;">🚀</div>
                                <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">Your Access is Ready!</h2>
                                <p style="color: #a855f7; font-size: 14px; margin: 8px 0 0; font-weight: 600; text-transform: uppercase;">{{product_name}}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 40px 40px 0;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">Hi <strong style="color: #ffffff;">{{customer_name}}</strong>👋</p>
                            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 16px 0 0;">
                                Success! Your premium access has been activated. Please keep these credentials secure and do not share them.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credentials -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <div style="background: rgba(0,0,0,0.4); border: 2px solid rgba(168,85,247,0.4); border-radius: 24px; padding: 32px; position: relative;">
                                <div style="position: absolute; top: -14px; right: 24px; background: #a855f7; color: #ffffff; font-size: 10px; font-weight: 900; padding: 6px 16px; border-radius: 12px; letter-spacing: 1px;">ACTIVE ACCOUNT</div>
                                
                                <p style="color: #a855f7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px; opacity: 0.8;">🔐 Secure Credentials</p>
                                
                                <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 24px; font-family: ''Courier New'', monospace; color: #ffffff; border: 1px solid rgba(255,255,255,0.05);">
                                    {{credentials}}
                                </div>
                                
                                <p style="color: #64748b; font-size: 11px; margin: 16px 0 0; font-weight: 600;">⏰ Valid Until: <span style="color: #ffffff;">{{expiry_date}}</span></p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <a href="https://wa.me/94787767869" style="display: block; background: #25d366; color: #ffffff; text-decoration: none; padding: 20px; border-radius: 16px; font-weight: 800; font-size: 15px; text-align: center;">💬 NEED HELP? CONTACT US</a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px; background: rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.05);">
                            <p style="color: #475569; font-size: 10px; line-height: 1.6; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                                INSTANT FULFILLMENT SYSTEM<br>
                                © 2026 SNIPPY MART. PREMIER DIGITAL SOLUTIONS.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'product_delivery';

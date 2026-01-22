-- =====================================================
-- ULTRA PREMIUM EMAIL TEMPLATES
-- Glassmorphism, Premium Fonts, Premium Emojis
-- Fully Responsive Desktop + Mobile
-- Run this to update all templates
-- =====================================================

UPDATE public.email_templates 
SET 
    subject = '✨ Order Confirmed! Your Snippy Mart Order #{{order_id}}',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Order Confirmation - Snippy Mart</title>
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse;}
        .fallback-font {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
        @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap'');
        
        * { box-sizing: border-box; }
        
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%);
            font-family: ''Inter'', ''Segoe UI'', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        .glass-card {
            background: linear-gradient(145deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 22, 42, 0.85) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 28px;
        }
        
        .glass-inner {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
        }
        
        .gradient-text {
            background: linear-gradient(135deg, #00b8d4, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .glow-button {
            box-shadow: 0 0 30px rgba(0, 184, 212, 0.3), 0 10px 40px -10px rgba(0, 184, 212, 0.5);
        }
        
        @media only screen and (max-width: 600px) {
            .container { padding: 20px 16px !important; }
            .main-card { border-radius: 20px !important; }
            .content-padding { padding: 24px 20px !important; }
            .header-padding { padding: 32px 20px 16px !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
            .mobile-stack td { display: block !important; width: 100% !important; padding: 6px 0 !important; }
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
            .mobile-text-sm { font-size: 13px !important; }
            .mobile-text-lg { font-size: 18px !important; }
            .order-id { font-size: 16px !important; }
            .total-amount { font-size: 28px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%); min-height: 100vh;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" class="container" style="padding: 48px 24px;">
                <table role="presentation" class="main-card glass-card" style="max-width: 620px; width: 100%; background: linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 22, 42, 0.9) 100%); border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255,255,255,0.1) inset;">
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- HEADER WITH LOGO -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="header-padding" style="padding: 48px 40px 24px; text-align: center; background: linear-gradient(135deg, rgba(0,184,212,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.05) 100%); position: relative;">
                            <!-- Decorative glow -->
                            <div style="position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: radial-gradient(circle, rgba(0,184,212,0.15) 0%, transparent 70%); pointer-events: none;"></div>
                            
                            <!-- Logo -->
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="88" height="88" style="border-radius: 24px; margin-bottom: 20px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);">
                            
                            <!-- Brand Name -->
                            <h1 style="font-family: ''Space Grotesk'', ''Inter'', sans-serif; color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Mart</span>
                            </h1>
                            <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 8px 0 0; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Premium Digital Subscriptions</p>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- SUCCESS BANNER -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%); border-radius: 20px; padding: 32px; text-align: center; margin-top: 24px; box-shadow: 0 20px 40px -15px rgba(34, 197, 94, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;">
                                <p style="color: #ffffff; font-size: 48px; margin: 0 0 12px; line-height: 1;">🎊</p>
                                <h2 style="font-family: ''Space Grotesk'', sans-serif; color: #ffffff; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.3px;">Order Confirmed!</h2>
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0; font-weight: 500;">Your purchase was successful ✓</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- GREETING -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 32px 40px 0;">
                            <p style="color: #e8e8e8; font-size: 17px; line-height: 1.6; margin: 0; font-weight: 500;">
                                Hey <strong style="color: #ffffff; font-weight: 700;">{{customer_name}}</strong> 👋
                            </p>
                            <p style="color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.8; margin: 16px 0 0;">
                                Excellent choice! Your order has been received and is being processed. We''ll have your subscription ready faster than you can say "streaming" 🚀
                            </p>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- ORDER DETAILS - GLASSMORPHISM BOX -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 32px 40px;">
                            <div class="glass-inner" style="background: linear-gradient(145deg, rgba(0,184,212,0.08), rgba(139,92,246,0.05)); border: 1px solid rgba(0,184,212,0.2); border-radius: 24px; padding: 32px; position: relative; overflow: hidden;">
                                <!-- Decorative gradient orb -->
                                <div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(0,184,212,0.2) 0%, transparent 70%);"></div>
                                
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                            <p style="color: #00b8d4; font-size: 10px; text-transform: uppercase; letter-spacing: 2.5px; margin: 0 0 8px; font-weight: 700;">📋 Order Number</p>
                                            <p class="order-id" style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; font-family: ''Space Grotesk'', monospace; letter-spacing: 0.5px;">{{order_id}}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p style="color: #00b8d4; font-size: 10px; text-transform: uppercase; letter-spacing: 2.5px; margin: 0 0 8px; font-weight: 700;">💰 Total Amount</p>
                                            <p class="total-amount" style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 0; font-family: ''Space Grotesk'', sans-serif;">{{total}}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- ORDER STATUS TRACKER - PREMIUM -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <p style="color: #ffffff; font-size: 15px; font-weight: 700; margin: 0 0 20px; display: flex; align-items: center;">
                                <span style="margin-right: 8px;">📍</span> Order Status
                            </p>
                            <div class="glass-inner" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px;">
                                <table style="width: 100%;" class="mobile-stack">
                                    <tr>
                                        <!-- Step 1: Confirmed ✓ -->
                                        <td style="text-align: center; width: 30%;" class="mobile-center">
                                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e, #10b981); border-radius: 50%; margin: 0 auto 10px; box-shadow: 0 8px 24px -6px rgba(34,197,94,0.5); display: flex; align-items: center; justify-content: center;">
                                                <span style="color: #fff; font-size: 18px;">✓</span>
                                            </div>
                                            <p style="color: #22c55e; font-size: 11px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">CONFIRMED</p>
                                            <p style="color: rgba(255,255,255,0.4); font-size: 10px; margin: 4px 0 0;">Just now</p>
                                        </td>
                                        <!-- Connector -->
                                        <td style="width: 20%; padding-top: 20px;" class="mobile-hide">
                                            <div style="height: 4px; background: linear-gradient(90deg, #22c55e 0%, #444 100%); border-radius: 2px;"></div>
                                        </td>
                                        <!-- Step 2: Processing -->
                                        <td style="text-align: center; width: 30%;" class="mobile-center">
                                            <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
                                                <span style="color: rgba(255,255,255,0.4); font-size: 16px;">⏳</span>
                                            </div>
                                            <p style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; margin: 0;">PROCESSING</p>
                                            <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 4px 0 0;">1-24 hrs</p>
                                        </td>
                                        <!-- Connector -->
                                        <td style="width: 20%; padding-top: 20px;" class="mobile-hide">
                                            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;"></div>
                                        </td>
                                        <!-- Step 3: Delivered -->
                                        <td style="text-align: center; width: 30%;" class="mobile-center">
                                            <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
                                                <span style="color: rgba(255,255,255,0.4); font-size: 16px;">📬</span>
                                            </div>
                                            <p style="color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; margin: 0;">DELIVERED</p>
                                            <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 4px 0 0;">Coming soon</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- ORDER ITEMS -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <p style="color: #ffffff; font-size: 15px; font-weight: 700; margin: 0 0 16px;">
                                <span style="margin-right: 8px;">🛒</span> Your Items
                            </p>
                            <div class="glass-inner" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden;">
                                {{items}}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- WHAT HAPPENS NEXT - TIMELINE -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <div style="background: linear-gradient(145deg, rgba(139,92,246,0.08), rgba(236,72,153,0.05)); border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; padding: 28px;">
                                <p style="color: #a78bfa; font-size: 14px; font-weight: 700; margin: 0 0 20px; letter-spacing: 0.3px;">
                                    ⚡ What Happens Next?
                                </p>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #22c55e, #10b981); border-radius: 8px; text-align: center; line-height: 28px; font-size: 12px; color: #fff; font-weight: 700;">1</div>
                                        </td>
                                        <td style="padding: 10px 0; color: #d0d0d0; font-size: 14px; line-height: 1.6;">
                                            Payment verification <span style="color: #22c55e; font-weight: 600;">• Instant</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #00b8d4, #0891b2); border-radius: 8px; text-align: center; line-height: 28px; font-size: 12px; color: #fff; font-weight: 700;">2</div>
                                        </td>
                                        <td style="padding: 10px 0; color: #d0d0d0; font-size: 14px; line-height: 1.6;">
                                            Subscription activation <span style="color: #00b8d4; font-weight: 600;">• 1-24 hours</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #8b5cf6, #a855f7); border-radius: 8px; text-align: center; line-height: 28px; font-size: 12px; color: #fff; font-weight: 700;">3</div>
                                        </td>
                                        <td style="padding: 10px 0; color: #d0d0d0; font-size: 14px; line-height: 1.6;">
                                            Credentials via <span style="color: #25D366; font-weight: 600;">WhatsApp</span> + <span style="color: #00b8d4; font-weight: 600;">Email</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- TRACK ORDER - PREMIUM CTA -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 20px;">
                            <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: block; background: linear-gradient(135deg, #00b8d4 0%, #0891b2 50%, #0e7490 100%); color: #ffffff; padding: 22px 28px; border-radius: 18px; text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 0 40px rgba(0,184,212,0.3), 0 15px 35px -10px rgba(0,184,212,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset; font-family: ''Space Grotesk'', sans-serif; letter-spacing: 0.3px;">
                                🔍 Track Your Order Live
                            </a>
                            <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 14px 0 0;">
                                Order ID auto-filled • Real-time updates
                            </p>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- WHATSAPP SUPPORT -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <a href="https://wa.me/94787767869" style="display: block; background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; padding: 18px 24px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center; box-shadow: 0 10px 30px -8px rgba(37,211,102,0.4);">
                                💬 Chat with Us on WhatsApp
                            </a>
                        </td>
                    </tr>
                    
                    <!-- ═══════════════════════════════════════════ -->
                    <!-- FOOTER -->
                    <!-- ═══════════════════════════════════════════ -->
                    <tr>
                        <td style="padding: 32px 40px; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%); border-top: 1px solid rgba(255,255,255,0.06);">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="text-align: center;">
                                        <!-- Quick Links -->
                                        <table style="margin: 0 auto;" class="mobile-stack">
                                            <tr>
                                                <td style="padding: 0 20px;">
                                                    <a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 Website</a>
                                                </td>
                                                <td style="padding: 0 20px; border-left: 1px solid rgba(255,255,255,0.1);" class="mobile-hide">
                                                    <a href="https://wa.me/94787767869" style="color: #25D366; text-decoration: none; font-size: 13px; font-weight: 600;">💬 WhatsApp</a>
                                                </td>
                                                <td style="padding: 0 20px; border-left: 1px solid rgba(255,255,255,0.1);" class="mobile-hide">
                                                    <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="color: #a78bfa; text-decoration: none; font-size: 13px; font-weight: 600;">📍 Track</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Copyright -->
                                        <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 28px 0 0; line-height: 1.6;">
                                            © 2026 Snippy Mart. All rights reserved.<br>
                                            <span style="color: rgba(255,255,255,0.2);">Premium Digital Subscriptions</span> 💜
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

-- =====================================================
-- PRODUCT DELIVERY - ULTRA PREMIUM
-- =====================================================
UPDATE public.email_templates 
SET 
    subject = '🚀 Your {{product_name}} is Ready! - Snippy Mart',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>Product Delivery - Snippy Mart</title>
    <style>
        @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap'');
        body { margin: 0; padding: 0; background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%); font-family: ''Inter'', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { padding: 20px 16px !important; }
            .content-padding { padding: 24px 20px !important; }
        }
    </style>
</head>
<body>
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" class="container" style="padding: 48px 24px;">
                <table role="presentation" style="max-width: 620px; width: 100%; background: linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 22, 42, 0.9) 100%); border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 48px 40px 24px; text-align: center; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.08) 100%);">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="88" height="88" style="border-radius: 24px; margin-bottom: 20px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);">
                            <h1 style="font-family: ''Space Grotesk'', sans-serif; color: #ffffff; font-size: 32px; margin: 0; font-weight: 700;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Mart</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Success Banner -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, #22c55e, #10b981); border-radius: 20px; padding: 32px; text-align: center; margin-top: 24px; box-shadow: 0 20px 40px -15px rgba(34, 197, 94, 0.4);">
                                <p style="color: #ffffff; font-size: 48px; margin: 0 0 12px;">🎉</p>
                                <h2 style="font-family: ''Space Grotesk'', sans-serif; color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Subscription Activated!</h2>
                                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0;">{{product_name}}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td class="content-padding" style="padding: 32px 40px 0;">
                            <p style="color: #e8e8e8; font-size: 17px; margin: 0;">Hey <strong style="color: #ffffff;">{{customer_name}}</strong> 🎊</p>
                            <p style="color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.8; margin: 16px 0 0;">
                                Your <strong style="color: #00b8d4;">{{product_name}}</strong> is now live! Here are your login credentials:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credentials Box -->
                    <tr>
                        <td class="content-padding" style="padding: 32px 40px;">
                            <div style="background: linear-gradient(145deg, rgba(34,197,94,0.1), rgba(16,185,129,0.08)); border: 2px solid rgba(34,197,94,0.3); border-radius: 24px; padding: 32px; position: relative;">
                                <div style="position: absolute; top: 16px; right: 16px; background: linear-gradient(135deg, #22c55e, #10b981); color: #fff; font-size: 10px; padding: 6px 14px; border-radius: 20px; font-weight: 700; letter-spacing: 0.5px;">✓ ACTIVE</div>
                                
                                <p style="color: #22c55e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px;">🔐 Login Credentials</p>
                                
                                <div style="background: rgba(0,0,0,0.4); border-radius: 16px; padding: 24px; font-family: ''Space Grotesk'', monospace;">
                                    {{credentials}}
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Validity -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 20px;">
                            <div style="background: rgba(0,184,212,0.08); border: 1px solid rgba(0,184,212,0.2); border-radius: 16px; padding: 20px 24px;">
                                <p style="color: #e0e0e0; font-size: 14px; margin: 0;">
                                    ⏰ <strong style="color: #ffffff;">Valid Until:</strong> <span style="color: #00b8d4; font-weight: 700;">{{expiry_date}}</span>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Warning -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 16px; padding: 20px 24px;">
                                <p style="color: #fca5a5; font-size: 13px; margin: 0;">
                                    ⚠️ <strong>Important:</strong> Do not share credentials. Sharing = account termination.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- WhatsApp CTA -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <a href="https://wa.me/94787767869" style="display: block; background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; padding: 20px 24px; border-radius: 18px; text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 15px 35px -10px rgba(37,211,102,0.4); font-family: ''Space Grotesk'', sans-serif;">
                                💬 Need Help? WhatsApp Us
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                            <table style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 16px;"><a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 Website</a></td>
                                    <td style="padding: 0 16px; border-left: 1px solid rgba(255,255,255,0.1);"><a href="https://wa.me/94787767869" style="color: #25D366; text-decoration: none; font-size: 13px; font-weight: 600;">💬 WhatsApp</a></td>
                                </tr>
                            </table>
                            <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 24px 0 0;">© 2026 Snippy Mart 💜</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
WHERE template_key = 'product_delivery';

-- =====================================================
-- ORDER STATUS UPDATE - ULTRA PREMIUM
-- =====================================================
UPDATE public.email_templates 
SET 
    subject = '📊 Order Update: #{{order_id}} - Snippy Mart',
    html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>Order Update - Snippy Mart</title>
    <style>
        @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap'');
        body { margin: 0; padding: 0; background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%); font-family: ''Inter'', sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { padding: 20px 16px !important; }
            .content-padding { padding: 24px 20px !important; }
            .mobile-stack td { display: block !important; width: 100% !important; padding: 8px 0 !important; }
        }
    </style>
</head>
<body>
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" class="container" style="padding: 48px 24px;">
                <table role="presentation" style="max-width: 580px; width: 100%; background: linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 22, 42, 0.9) 100%); border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <img src="https://snippymart.com/android-chrome-192x192.png" alt="Snippy Mart" width="72" height="72" style="border-radius: 20px; margin-bottom: 16px; box-shadow: 0 15px 30px -8px rgba(0,0,0,0.5);">
                            <h1 style="font-family: ''Space Grotesk'', sans-serif; color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                                Snippy<span style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Mart</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Status Update -->
                    <tr>
                        <td class="content-padding" style="padding: 20px 40px 32px; text-align: center;">
                            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 24px;">Your order status has been updated ✨</p>
                            
                            <div style="background: linear-gradient(145deg, rgba(0,184,212,0.1), rgba(139,92,246,0.08)); border: 1px solid rgba(0,184,212,0.2); border-radius: 24px; padding: 32px;">
                                <p style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px;">📋 Order ID</p>
                                <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 28px; font-family: ''Space Grotesk'', monospace;">{{order_id}}</p>
                                
                                <p style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px;">🔄 New Status</p>
                                <p style="background: linear-gradient(135deg, #00b8d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; font-weight: 800; margin: 0; font-family: ''Space Grotesk'', sans-serif;">{{status}}</p>
                            </div>
                            
                            <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.7; margin: 28px 0 0;">{{message}}</p>
                        </td>
                    </tr>
                    
                    <!-- CTA Buttons -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px 32px;">
                            <table style="width: 100%;" class="mobile-stack">
                                <tr>
                                    <td style="padding-right: 8px; width: 50%;">
                                        <a href="https://snippymart.com/track-order?orderId={{order_id}}" style="display: block; background: linear-gradient(135deg, #00b8d4, #0891b2); color: #ffffff; padding: 18px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 10px 25px -8px rgba(0,184,212,0.4);">
                                            🔍 Track Order
                                        </a>
                                    </td>
                                    <td style="padding-left: 8px; width: 50%;">
                                        <a href="https://wa.me/94787767869" style="display: block; background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; padding: 18px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 10px 25px -8px rgba(37,211,102,0.4);">
                                            💬 WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 28px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                            <a href="https://snippymart.com" style="color: #00b8d4; text-decoration: none; font-size: 13px; font-weight: 600;">🌐 snippymart.com</a>
                            <p style="color: rgba(255,255,255,0.25); font-size: 11px; margin: 20px 0 0;">© 2026 Snippy Mart 💜</p>
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
    RAISE NOTICE '✨ ULTRA PREMIUM Email Templates Applied!';
    RAISE NOTICE '   - Google Fonts (Inter + Space Grotesk)';
    RAISE NOTICE '   - Glassmorphism effects';
    RAISE NOTICE '   - Premium emojis';
    RAISE NOTICE '   - Fully responsive (mobile + desktop)';
    RAISE NOTICE '   - Visual order status tracker';
END $$;

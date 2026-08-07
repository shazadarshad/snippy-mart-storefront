-- Railway Hobby + Framer Pro Combo (12 Months) Product Migration

INSERT INTO public.products (
  name,
  slug,
  description,
  price,
  old_price,
  category,
  categories,
  image_url,
  is_active,
  is_featured,
  stock_status,
  manual_fulfillment,
  use_variant_pricing,
  requirements
)
SELECT
  '🔥 Railway Hobby + Framer Pro Combo (12 Months)',
  'railway-hobby-framer-pro-12-months-combo',
  E'🔥 **COMBO OFFER – LIMITED TIME!** 🔥\n\nGet 12 months access to both **Railway Hobby** and **Framer Pro** at an exclusive discounted price!\n\n---\n\n### 📦 What\'s Included:\n* 🚂 **Railway Hobby (12 Months)** — Deploy & host your web apps, microservices, databases & APIs effortlessly.\n* 🎨 **Framer Pro (12 Months)** — Build, design & publish high-performance interactive websites with custom domain support.\n\n---\n\n### ✨ Key Highlights & Features:\n* ✅ **Full 12 Months Access** for both premium plans.\n* ✅ **Activated on Your New Accounts** (Fresh & Private credentials).\n* ✅ **Perfect for Developers, Designers & Freelancers**.\n* ⚡ **Limited Stock** — Grab this combo before it\'s gone!\n\n---\n\n> ℹ️ *Note: Special promo bundle offer. No warranty.*',
  3999,
  5399,
  'Combos',
  ARRAY['Combos', 'Development', 'Design'],
  '/railway-framer-combo.jpg',
  true,
  true,
  'limited',
  true,
  false,
  '{"require_email": true, "require_password": false}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE slug = 'railway-hobby-framer-pro-12-months-combo' OR name ILIKE '%Railway Hobby + Framer Pro%'
);

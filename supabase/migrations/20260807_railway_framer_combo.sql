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
  '🔥 COMBO OFFER – LIMITED TIME! 🔥\n\n🚂 Railway Hobby – 12 Months\n🎨 Framer Pro – 12 Months\n\n💰 Combo Price: Only LKR 3,999 (Previously LKR 5,399)\n\n✨ Perfect for Developers & Designers\n✅ 12 Months Access for Both Plans\n✅ Activated on Your New Accounts\n✅ Railway Hobby – Deploy & Host Apps\n✅ Framer Pro – Build & Publish Professional Websites\n\nℹ️ Special promo bundle offer. No warranty.\n⚡ Limited Stock – Grab the Combo Before It\'s Gone!',
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

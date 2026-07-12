-- Google AI Pro – 18 Months product + warranty pricing plans

INSERT INTO public.products (
  name,
  description,
  price,
  old_price,
  category,
  image_url,
  is_active,
  is_featured,
  stock_status,
  manual_fulfillment,
  use_variant_pricing,
  requirements
)
SELECT
  'Google AI Pro – 18 Months ✨',
  E'GOOGLE AI PRO — 18 Months access\n\n✅ Redeem link provided\n✅ Can be activated on your own account\n\n⚡ Very limited slots — secure yours now.\n\nChoose your warranty at checkout:\n• 1 Month Warranty — LKR 999\n• Full Warranty — LKR 3,999',
  999,
  3999,
  'AI',
  '/placeholder.svg',
  true,
  true,
  'limited',
  true,
  false,
  '{"require_email": true, "require_password": false}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE name ILIKE 'Google AI Pro%18%'
);

-- Pricing plans (only if product exists and plans not already added)
INSERT INTO public.product_pricing_plans (product_id, name, duration, price, old_price, is_default)
SELECT p.id, '1 Month Warranty', '1 month warranty', 999, NULL, true
FROM public.products p
WHERE p.name ILIKE 'Google AI Pro%18%'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_pricing_plans pp
    WHERE pp.product_id = p.id AND pp.name = '1 Month Warranty'
  );

INSERT INTO public.product_pricing_plans (product_id, name, duration, price, old_price, is_default)
SELECT p.id, 'Full Warranty', 'Full warranty period', 3999, NULL, false
FROM public.products p
WHERE p.name ILIKE 'Google AI Pro%18%'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_pricing_plans pp
    WHERE pp.product_id = p.id AND pp.name = 'Full Warranty'
  );

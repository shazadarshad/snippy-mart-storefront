/**
 * Add / update Magnific (Freepik) Credits product:
 *   Plans    = credit packs                                      (Select credits)
 *   Variants = warranty 24 hours / 7 / 15 / 30 days              (Select warranty)
 *
 * Catalog is LKR. Prices are the live storefront list (already xx99).
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI1MDQ4MCwiZXhwIjoyMTAzODI2NDgwfQ.o0V69mCQAt_grTEaLLgIcPvAlCH4fyOZBExVDC7Gm6I';
const base = 'https://aioyoxnjukfibsogegdb.supabase.co';
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const SLUG = 'freepik-credits';

/** Warranty keys match WARRANTIES.key. Amounts are LKR. */
const CREDIT_PACKS = [
  { name: '50K Credits', lkr: { h24: 1499, d7: 8499, d15: 11999, d30: 15499 } },
  { name: '100K Credits', lkr: { h24: 2299, d7: 9199, d15: 12799, d30: 16299 } },
  { name: '200K Credits', lkr: { h24: 3599, d7: 10499, d15: 13999, d30: 17499 } },
  { name: '300K Credits', lkr: { h24: 4799, d7: 11699, d15: 15199, d30: 18699 } },
  { name: '400K Credits', lkr: { h24: 6199, d7: 12999, d15: 16499, d30: 19999 } },
  { name: '500K Credits', lkr: { h24: 7199, d7: 13999, d15: 17499, d30: 20999 } },
  { name: '600K Credits', lkr: { h24: 8699, d7: 15499, d15: 18999, d30: 22499 } },
  { name: '1M Credits', lkr: { h24: 13999, d7: 20999, d15: 24499, d30: 27999 } },
  { name: '2M Credits', lkr: { h24: 17999, d7: 24499, d15: 27999, d30: 31499 } },
  { name: '3M Credits', lkr: { h24: 19999, d7: 26499, d15: 29999, d30: 33499 } },
  { name: '4M Credits', lkr: { h24: 23999, d7: 30499, d15: 33999, d30: 37499 } },
];

const WARRANTIES = [
  { key: 'h24', name: '24 Hours Warranty', duration: '24 hours' },
  { key: 'd7', name: '7 Day Warranty', duration: '7 days' },
  { key: 'd15', name: '15 Day Warranty', duration: '15 days' },
  { key: 'd30', name: '30 Day Warranty', duration: '30 days' },
];

const STARTING_PRICE = CREDIT_PACKS[0].lkr.h24;

const description = `**Magnific (Freepik) Credits**

Original **Magnific (Freepik)** credits for AI image generation, video generation, upscaling, and editing.

**This is NOT a downloader, original Freepik credits provided through custom extension.**

How it works:
• Choose your credit pack, then warranty
• Credits are provided via our custom extension

What you can do with Magnific (Freepik):
• Generate AI videos from text or images
• Upscale images up to 10K with real generated detail
• Generate AI images, product shots, and campaign visuals
• Enhance portraits, landscapes, and illustrations
• Edit, resize, and keep characters / brand consistent
• Style transfer and creative detail enhancement

Credit packs:
• 50K
• 100K
• 200K
• 300K
• 400K
• 500K
• 600K
• 1M
• 2M
• 3M
• 4M

Warranty:
• 24 Hours
• 7 Days
• 15 Days
• 30 Days

What's included:
• Original Magnific (Freepik) credits — not a downloader
• Delivered through our custom extension
• Support during your selected warranty window`;

if (process.argv.includes('--reseed-prices')) {
  const existing = await rest(`/rest/v1/products?slug=eq.${SLUG}&select=id`);
  const productId = existing?.[0]?.id;
  if (!productId) throw new Error('Freepik product not found');

  await rest(`/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    body: {
      description,
      price: STARTING_PRICE,
      requirements: { require_email: false, require_password: false, require_username: false },
      updated_at: new Date().toISOString(),
    },
  });
  await rest(`/rest/v1/product_pricing_plans?product_id=eq.${productId}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' },
  });
  const plansPayload = CREDIT_PACKS.map((pack, i) => ({
    product_id: productId,
    name: pack.name,
    duration: '',
    price: pack.lkr.h24,
    old_price: null,
    is_default: i === 0,
  }));
  const createdPlans = await rest('/rest/v1/product_pricing_plans', {
    method: 'POST',
    body: plansPayload,
  });
  const variantsPayload = [];
  for (const plan of createdPlans) {
    const pack = CREDIT_PACKS.find((p) => p.name === plan.name);
    for (const warranty of WARRANTIES) {
      variantsPayload.push({
        plan_id: plan.id,
        name: warranty.name,
        price: pack.lkr[warranty.key],
        old_price: null,
        is_active: true,
        stock_status: 'in_stock',
      });
    }
  }
  const createdVariants = await rest('/rest/v1/product_pricing_plan_variants', {
    method: 'POST',
    body: variantsPayload,
  });
  console.log(
    'Plans:',
    createdPlans.map((p) => `${p.name} = LKR ${p.price}`).join(' | '),
  );
  console.log(`Variants: ${createdVariants.length}`);
  process.exit(0);
}

if (process.argv.includes('--desc-only')) {
  const patchRes = await fetch(`${base}/rest/v1/products?slug=eq.${SLUG}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      description,
      name: 'Magnific (Freepik) Credits',
      updated_at: new Date().toISOString(),
    }),
  });
  const patchText = await patchRes.text();
  if (!patchRes.ok) throw new Error(`Description update failed: ${patchRes.status} ${patchText}`);
  console.log('Description updated.');
  process.exit(0);
}

async function rest(path, { method = 'GET', body, extraHeaders } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...headers, ...extraHeaders },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const existing = await rest(`/rest/v1/products?slug=eq.${SLUG}&select=id,name,slug`);
const productId = existing?.[0]?.id || randomUUID();

const svgPath = join(__dirname, 'brand-v2-freepik.svg');
const svgBytes = readFileSync(svgPath);
const storagePath = `brand-v2/freepik-credits-${productId.slice(0, 8)}.svg`;

const uploadRes = await fetch(`${base}/storage/v1/object/product-images/${storagePath}`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'image/svg+xml',
    'x-upsert': 'true',
  },
  body: svgBytes,
});
if (!uploadRes.ok) {
  throw new Error(`Upload failed ${uploadRes.status}: ${await uploadRes.text()}`);
}
const imageUrl = `${base}/storage/v1/object/public/product-images/${storagePath}?v=${Date.now()}`;
console.log('Image uploaded:', imageUrl);

const product = {
  id: productId,
  name: 'Magnific (Freepik) Credits',
  slug: SLUG,
  description,
  price: STARTING_PRICE,
  old_price: null,
  category: 'Design',
  categories: ['Design', 'AI'],
  image_url: imageUrl,
  is_active: true,
  is_featured: true,
  stock_status: 'in_stock',
  display_order: 0,
  use_variant_pricing: true,
  manual_fulfillment: true,
  requirements: {
    require_email: false,
    require_password: false,
    require_username: false,
  },
  updated_at: new Date().toISOString(),
};

if (existing?.[0]?.id) {
  const { id, ...patch } = product;
  await rest(`/rest/v1/products?id=eq.${productId}`, { method: 'PATCH', body: patch });
  console.log('Product updated:', productId);
} else {
  await rest('/rest/v1/products', { method: 'POST', body: product });
  console.log('Product created:', productId);
}

await rest(`/rest/v1/product_pricing_plans?product_id=eq.${productId}`, {
  method: 'DELETE',
  extraHeaders: { Prefer: 'return=minimal' },
});
console.log('Old plans cleared');

const plansPayload = CREDIT_PACKS.map((pack, i) => ({
  product_id: productId,
  name: pack.name,
  duration: 'Magnific credits',
  price: pack.lkr.h24,
  old_price: null,
  is_default: i === 0,
}));

const createdPlans = await rest('/rest/v1/product_pricing_plans', {
  method: 'POST',
  body: plansPayload,
});

const variantsPayload = [];
for (const plan of createdPlans) {
  const pack = CREDIT_PACKS.find((p) => p.name === plan.name);
  for (const warranty of WARRANTIES) {
    variantsPayload.push({
      plan_id: plan.id,
      name: warranty.name,
      price: pack.lkr[warranty.key],
      old_price: null,
      is_active: true,
      stock_status: 'in_stock',
    });
  }
}

const createdVariants = await rest('/rest/v1/product_pricing_plan_variants', {
  method: 'POST',
  body: variantsPayload,
});

console.log(
  'Plans:',
  createdPlans.map((p) => `${p.name} = LKR ${p.price}`).join(' | '),
);
console.log(`Variants: ${createdVariants.length}`);
console.log(`Live: https://snippymart.com/product/${SLUG}`);
console.log('Done.');

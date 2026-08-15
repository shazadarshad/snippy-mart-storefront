/**
 * Add / update Magnific (Freepik) Credits product:
 *   Plans    = warranty duration 2 / 7 / 15 / 30 days  (Select Duration)
 *   Variants = credit packs                            (Select Package)
 *
 * Catalog is LKR. 1 USD = 370 LKR so USD display stays exact.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZmZ6ZnVrbHp6Y25mbnVidHp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY5NDU2MCwiZXhwIjoyMDg0MjcwNTYwfQ.1puMnXamnjVIk8PM5gbJourUfatAeuaoFkDdFajlpn0';
const base = 'https://vuffzfuklzzcnfnubtzx.supabase.co';
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

/** Exact USD list → LKR, then charm UP to xx99 so we never sell under the USD floor. */
function charmLkr(usd) {
  const n = Math.ceil(Number(usd) * 370);
  if (n <= 99) return 99;
  if (n % 100 === 99) return n;
  const bucket = Math.floor(n / 100);
  const candidate = bucket * 100 + 99;
  return candidate >= n ? candidate : (bucket + 1) * 100 + 99;
}

const LKR = (usd) => charmLkr(usd);
const SLUG = 'freepik-credits';

const CREDIT_PACKS = [
  { name: '50K Credits', usd: { 2: 3, 7: 8, 15: 13, 30: 23 } },
  { name: '100K Credits', usd: { 2: 6, 7: 11, 15: 16, 30: 26 } },
  { name: '200K Credits', usd: { 2: 8, 7: 13, 15: 18, 30: 28 } },
  { name: '600K Credits', usd: { 2: 12, 7: 17, 15: 22, 30: 32 } },
  { name: '1M Credits', usd: { 2: 20, 7: 25, 15: 30, 30: 40 } },
  { name: '2M Credits', usd: { 2: 30, 7: 35, 15: 40, 30: 50 } },
  { name: '4M Credits', usd: { 2: 50, 7: 55, 15: 60, 30: 70 } },
];

const WARRANTIES = [
  { days: 2, name: '2 Day Warranty', duration: '2 days' },
  { days: 7, name: '7 Day Warranty', duration: '7 days' },
  { days: 15, name: '15 Day Warranty', duration: '15 days' },
  { days: 30, name: '30 Day Warranty', duration: '30 days' },
];

const description = `**Magnific (Freepik) Credits**

Original **Magnific (Freepik)** credits for AI image generation, video generation, upscaling, and editing.

**This is NOT a downloader, original Freepik credits provided through custom extension.**

How it works:
• Choose your credit pack and warranty
• Credits are provided via our custom extension
• Use them on your Magnific (Freepik) account

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
• 600K
• 1M
• 2M
• 4M

Warranty:
• 2 Days
• 7 Days
• 15 Days
• 30 Days

What's included:
• Original Magnific (Freepik) credits — not a downloader
• Delivered through our custom extension
• Support during your selected warranty window

Enter your Magnific (Freepik) account email at checkout so we can deliver.`;

if (process.argv.includes('--reseed-prices')) {
  const existing = await rest(`/rest/v1/products?slug=eq.${SLUG}&select=id`);
  const productId = existing?.[0]?.id;
  if (!productId) throw new Error('Freepik product not found');

  await rest(`/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    body: { price: LKR(3), updated_at: new Date().toISOString() },
  });
  await rest(`/rest/v1/product_pricing_plans?product_id=eq.${productId}`, {
    method: 'DELETE',
    extraHeaders: { Prefer: 'return=minimal' },
  });
  const plansPayload = WARRANTIES.map((w, i) => ({
    product_id: productId,
    name: w.name,
    duration: w.duration,
    price: LKR(CREDIT_PACKS[0].usd[w.days]),
    old_price: null,
    is_default: i === 0,
  }));
  const createdPlans = await rest('/rest/v1/product_pricing_plans', {
    method: 'POST',
    body: plansPayload,
  });
  const variantsPayload = [];
  for (const plan of createdPlans) {
    const warranty = WARRANTIES.find((w) => w.name === plan.name);
    for (const pack of CREDIT_PACKS) {
      variantsPayload.push({
        plan_id: plan.id,
        name: pack.name,
        price: LKR(pack.usd[warranty.days]),
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
  price: LKR(3),
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
    require_email: true,
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

const plansPayload = WARRANTIES.map((w, i) => ({
  product_id: productId,
  name: w.name,
  duration: w.duration,
  price: LKR(CREDIT_PACKS[0].usd[w.days]),
  old_price: null,
  is_default: i === 0,
}));

const createdPlans = await rest('/rest/v1/product_pricing_plans', {
  method: 'POST',
  body: plansPayload,
});

const variantsPayload = [];
for (const plan of createdPlans) {
  const warranty = WARRANTIES.find((w) => w.name === plan.name);
  for (const pack of CREDIT_PACKS) {
    variantsPayload.push({
      plan_id: plan.id,
      name: pack.name,
      price: LKR(pack.usd[warranty.days]),
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

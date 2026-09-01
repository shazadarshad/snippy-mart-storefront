/**
 * Rename Higgsfield product + attach Starter / Plus pricing plans (variants)
 */
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

const PRODUCT_ID = '08a11d6d-3378-4396-8ed4-f5c45c7a61bc';

const description = `**Higgsfield 1 Month**
AI video creation with a private account.

Choose your plan below.

**What's included (all plans)**
✅ Private account provided
✅ Create AI videos with Higgsfield
✅ 20-day warranty

**Plans**
• **Starter** — 280 credits · LKR 2,999 (official LKR 6,500)
• **Plus** — 1,010 credits · LKR 8,999 (official LKR 16,000)

Perfect for AI video creators, marketers, content creators, and social media agencies.

Order now: snippymart.com`;

// 1) Update product
const productPatch = {
  name: 'Higgsfield 1 Month',
  slug: 'higgsfield-1-month',
  description,
  price: 2999,
  old_price: 6500,
  use_variant_pricing: false,
  is_active: true,
  is_featured: true,
  category: 'AI',
  categories: ['AI'],
  stock_status: 'in_stock',
  requirements: {
    require_email: false,
    require_password: false,
    require_username: false,
  },
  manual_fulfillment: true,
  updated_at: new Date().toISOString(),
};

const upd = await fetch(`${base}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(productPatch),
});
const updText = await upd.text();
if (!upd.ok) throw new Error(`Product update failed: ${upd.status} ${updText}`);
console.log('Product updated:', JSON.parse(updText)[0]?.name);

// 2) Remove existing plans for this product (clean re-seed)
const del = await fetch(
  `${base}/rest/v1/product_pricing_plans?product_id=eq.${PRODUCT_ID}`,
  { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } },
);
if (!del.ok) {
  const t = await del.text();
  throw new Error(`Delete plans failed: ${del.status} ${t}`);
}
console.log('Old plans cleared');

// 3) Insert Starter + Plus as selectable plans (shown as "Select Plan")
const plans = [
  {
    product_id: PRODUCT_ID,
    name: 'Starter Plan',
    duration: '280 credits · 20-day warranty',
    price: 2999,
    old_price: 6500,
    is_default: true,
  },
  {
    product_id: PRODUCT_ID,
    name: 'Plus Plan',
    duration: '1,010 credits · 20-day warranty',
    price: 8999,
    old_price: 16000,
    is_default: false,
  },
];

const ins = await fetch(`${base}/rest/v1/product_pricing_plans`, {
  method: 'POST',
  headers,
  body: JSON.stringify(plans),
});
const insText = await ins.text();
if (!ins.ok) throw new Error(`Insert plans failed: ${ins.status} ${insText}`);
const created = JSON.parse(insText);
console.log(
  'Plans:',
  created.map((p) => `${p.name} = ${p.price} (was ${p.old_price})`).join(' | '),
);

// 4) Refresh brand image copy to "Higgsfield 1 Month"
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg-hf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0A0C"/>
      <stop offset="55%" stop-color="#12121A"/>
      <stop offset="100%" stop-color="#1A1030"/>
    </linearGradient>
    <radialGradient id="glow-hf" cx="50%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#C8FF3D" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="#A855F7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0A0A0C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring-hf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C8FF3D"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
    <linearGradient id="play-hf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4FF5C"/>
      <stop offset="100%" stop-color="#9AE600"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg-hf)"/>
  <rect width="800" height="800" fill="url(#glow-hf)"/>
  <circle cx="120" cy="140" r="90" fill="#C8FF3D" fill-opacity="0.04"/>
  <circle cx="700" cy="620" r="120" fill="#A855F7" fill-opacity="0.07"/>
  <g transform="translate(400, 290)">
    <circle r="118" fill="#FFFFFF" fill-opacity="0.05"/>
    <circle r="102" fill="none" stroke="url(#ring-hf)" stroke-opacity="0.75" stroke-width="2.5"/>
    <circle r="88" fill="#FFFFFF" fill-opacity="0.04"/>
    <g>
      <rect x="-52" y="-38" width="104" height="76" rx="16" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="2"/>
      <rect x="-52" y="-38" width="104" height="22" rx="16" fill="url(#play-hf)" fill-opacity="0.95"/>
      <rect x="-52" y="-16" width="104" height="8" fill="#0A0A0C" fill-opacity="0.25"/>
      <path d="M-8 -2 L22 16 L-8 34 Z" fill="url(#play-hf)"/>
      <circle cx="46" cy="-48" r="5" fill="#C8FF3D"/>
      <circle cx="-50" cy="48" r="3.5" fill="#A855F7"/>
      <circle cx="54" cy="40" r="3" fill="#C8FF3D" fill-opacity="0.7"/>
    </g>
  </g>
  <text x="400" y="500" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="42" font-weight="700" letter-spacing="-0.6">Higgsfield</text>
  <text x="400" y="548" text-anchor="middle" fill="#C8FF3D" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="-0.2">1 Month</text>
  <text x="400" y="592" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.72" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600">Starter · Plus</text>
  <text x="400" y="730" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.38" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="16" font-weight="600" letter-spacing="4">SNIPPY MART</text>
</svg>`;

const storagePath = `brand-v2/higgsfield-1-month-${PRODUCT_ID.slice(0, 8)}.svg`;
const uploadRes = await fetch(
  `${base}/storage/v1/object/product-images/${storagePath}`,
  {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'image/svg+xml',
      'x-upsert': 'true',
    },
    body: svg,
  },
);
if (!uploadRes.ok) {
  throw new Error(`Image upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
}
const imageUrl = `${base}/storage/v1/object/public/product-images/${storagePath}?v=${Date.now()}`;
const imgPatch = await fetch(`${base}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ image_url: imageUrl }),
});
if (!imgPatch.ok) throw new Error(`Image URL patch failed: ${await imgPatch.text()}`);
console.log('Image updated:', imageUrl);

// Verify
const check = await fetch(
  `${base}/rest/v1/products?id=eq.${PRODUCT_ID}&select=name,slug,price,old_price,use_variant_pricing,image_url`,
  { headers },
);
const plansCheck = await fetch(
  `${base}/rest/v1/product_pricing_plans?product_id=eq.${PRODUCT_ID}&select=name,duration,price,old_price,is_default&order=price.asc`,
  { headers },
);
console.log('\nProduct:', await check.json());
console.log('Plans:', await plansCheck.json());
console.log('\nDone.');

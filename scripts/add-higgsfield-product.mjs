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

const description = `**Higgsfield Starter Plan – 1 Month**
Only **LKR 2,999**
Official price: LKR 6,500

✨ **Includes 280 Credits**

**What's included**
✅ Private account provided
✅ Create AI videos with Higgsfield
✅ 280 monthly credits included
✅ 20-day warranty

Perfect for AI video creators, marketers, content creators, and social media agencies.

Order now: snippymart.com`;

const productId = randomUUID();
const slug = 'higgsfield-starter-plan-1-month';
const svgPath = join(__dirname, 'brand-v2-higgsfield.svg');
const svgBytes = readFileSync(svgPath);
const storagePath = `brand-v2/higgsfield-starter-plan-1-month-${productId.slice(0, 8)}.svg`;

// Upload brand image
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
    body: svgBytes,
  },
);
if (!uploadRes.ok) {
  throw new Error(`Upload failed ${uploadRes.status}: ${await uploadRes.text()}`);
}
const imageUrl = `${base}/storage/v1/object/public/product-images/${storagePath}?v=${Date.now()}`;
console.log('Image uploaded:', imageUrl);

// display_order 0 places it at the top of the catalog with other featured items
const product = {
  id: productId,
  name: 'Higgsfield Starter Plan – 1 Month',
  slug,
  description,
  price: 2999,
  old_price: 6500,
  category: 'AI',
  categories: ['AI'],
  image_url: imageUrl,
  is_active: true,
  is_featured: true,
  stock_status: 'in_stock',
  display_order: 0,
  requirements: {
    require_email: false,
    require_password: false,
    require_username: false,
  },
  manual_fulfillment: true,
};

const insertRes = await fetch(`${base}/rest/v1/products`, {
  method: 'POST',
  headers,
  body: JSON.stringify(product),
});
const insertText = await insertRes.text();
if (!insertRes.ok) {
  throw new Error(`Insert failed ${insertRes.status}: ${insertText}`);
}
const created = JSON.parse(insertText);
console.log('Product created:');
console.log(JSON.stringify(created[0] || created, null, 2));
console.log('\nDone — live on storefront.');

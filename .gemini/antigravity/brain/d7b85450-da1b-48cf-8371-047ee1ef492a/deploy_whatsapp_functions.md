# Deploy WhatsApp Supabase Edge Functions

## ✅ Fixed: Using Supabase Edge Functions (Not Next.js API)

Your project is **Vite + React**, not Next.js. So `/api/*` routes don't work.

I've created **Supabase Edge Functions** instead (Deno-based).

---

## 📂 Created Functions

1. **`whatsapp-products`** - Get product menu
2. **`whatsapp-product-flow`** - Get product flow by ID
3. **`whatsapp-log`** - Log WhatsApp events

Location: `supabase/functions/`

---

## 🚀 Deploy Functions to Supabase

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
cd "d:\snippy mart sk\snippy-mart-storefront"
supabase link --project-ref vuffzfuklzzcnfnubtzx
```

### Step 4: Deploy Functions

```bash
supabase functions deploy whatsapp-products
supabase functions deploy whatsapp-product-flow
supabase functions deploy whatsapp-log
```

Or deploy all at once:

```bash
supabase functions deploy
```

---

## 🔗 Function URLs

After deployment, your functions will be available at:

```
https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-products
https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-product-flow?id=cursor-pro
https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-log
```

---

## 🧪 Test Functions

### 1. Get Products Menu

```bash
curl https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-products
```

Expected:
```json
[
  {
    "id": "cursor-pro",
    "menuTitle": "🖥️ Cursor Pro"
  }
]
```

### 2. Get Product Flow

```bash
curl "https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-product-flow?id=cursor-pro"
```

Expected:
```json
{
  "productId": "cursor-pro",
  "flowSteps": [...],
  "orderUrl": "https://snippymart.com/product/cursor-pro",
  "showOrderLink": true
}
```

### 3. Log Event

```bash
curl -X POST https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-log \
  -H "Content-Type: application/json" \
  -d '{"phone":"9477123456","event":"PRODUCT_VIEW","productId":"cursor-pro"}'
```

Expected:
```json
{
  "success": true
}
```

---

## 🤖 Update Your WhatsApp Bot

Change the API base URL in your Railway bot:

```javascript
// OLD (won't work)
const API_BASE = 'https://snippymart.com/api/public/whatsapp';

// NEW (use this)
const API_BASE = 'https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1';

// Get products
const response = await fetch(`${API_BASE}/whatsapp-products`);

// Get product flow
const response = await fetch(`${API_BASE}/whatsapp-product-flow?id=${productId}`);

// Log event
await fetch(`${API_BASE}/whatsapp-log`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, event, productId }),
});
```

---

## 📝 Prerequisites

Before testing functions:

1. **Run Migration** (if not done):
   ```sql
   -- In Supabase Dashboard → SQL Editor
   -- Run: supabase/migrations/20260204_whatsapp_automation.sql
   ```

2. **Enable a Product** in admin panel:
   - Go to `/admin/whatsapp/products`
   - Toggle a product ON
   - Configure its flow

---

## 🐛 Troubleshooting

### "Command not found: supabase"
**Fix:** Install Supabase CLI:
```bash
npm install -g supabase
```

### "Project not linked"
**Fix:** Link your project:
```bash
supabase link --project-ref vuffzfuklzzcnfnubtzx
```

### Functions return 404
**Fix:** Make sure functions are deployed:
```bash
supabase functions list
```

### CORS errors
**Fix:** Functions already have CORS headers. If still getting errors, check your bot's request headers.

---

## ✅ Quick Deploy (One Command)

```bash
cd "d:\snippy mart sk\snippy-mart-storefront"
supabase functions deploy
```

This deploys all functions at once!

---

## 📊 Monitor Functions

View logs in real-time:

```bash
supabase functions logs whatsapp-products
supabase functions logs whatsapp-product-flow
supabase functions logs whatsapp-log
```

Or in Supabase Dashboard → Edge Functions

---

**After deployment, test with:**

```bash
curl https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/whatsapp-products
```

Should return JSON (not 404)! 🚀

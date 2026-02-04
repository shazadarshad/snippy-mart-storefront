# Public WhatsApp API Endpoints - Testing Guide

## ✅ Created Endpoints

All endpoints are under `/api/public/whatsapp/*` and require **NO AUTHENTICATION**.

---

## 📍 Endpoint 1: Get Product Menu

### URL:
```
GET https://snippymart.com/api/public/whatsapp/products
```

### Purpose:
Returns list of WhatsApp-enabled products for bot menu.

### Response:
```json
[
  {
    "id": "cursor-pro",
    "menuTitle": "🖥️ Cursor Pro"
  },
  {
    "id": "chatgpt-plus",
    "menuTitle": "🤖 ChatGPT Plus"
  }
]
```

### Test with cURL:
```bash
curl https://snippymart.com/api/public/whatsapp/products
```

### Test in Browser:
Just open: `https://snippymart.com/api/public/whatsapp/products`

**Expected:** JSON array (NOT HTML page)

---

## 📍 Endpoint 2: Get Product Flow

### URL:
```
GET https://snippymart.com/api/public/whatsapp/products/[productId]
```

### Purpose:
Returns conversation flow for a specific product.

### Response:
```json
{
  "productId": "cursor-pro",
  "flowSteps": [
    {
      "title": "What is Cursor?",
      "message": "Cursor is an AI-powered code editor for developers.",
      "delayMs": 1500
    },
    {
      "title": "How activation works",
      "message": "We activate on your own account. No password required.",
      "delayMs": 2000
    }
  ],
  "orderUrl": "https://snippymart.com/product/cursor-pro",
  "showOrderLink": true
}
```

### Test with cURL:
```bash
curl https://snippymart.com/api/public/whatsapp/products/cursor-pro
```

### Test in Browser:
Open: `https://snippymart.com/api/public/whatsapp/products/cursor-pro`

**Expected:** JSON object with flow steps (NOT HTML page)

### If Product Not Enabled:
```json
{
  "error": "Product not found or not enabled for WhatsApp"
}
```

Status: `404`

---

## 📍 Endpoint 3: Log Interaction

### URL:
```
POST https://snippymart.com/api/public/whatsapp/log
```

### Purpose:
Log WhatsApp bot interactions for analytics.

### Request Body:
```json
{
  "phone": "94776512486",
  "event": "PRODUCT_VIEW",
  "productId": "cursor-pro",
  "message": "cursor"
}
```

### Valid Events:
- `PRODUCT_VIEW`
- `ORDER_CLICK`
- `ESCALATION`
- `FALLBACK`
- `MENU_REQUEST`

### Response:
```json
{
  "success": true
}
```

### Test with cURL:
```bash
curl -X POST https://snippymart.com/api/public/whatsapp/log \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "94776512486",
    "event": "PRODUCT_VIEW",
    "productId": "cursor-pro",
    "message": "cursor"
  }'
```

**Expected:** `{"success": true}`

---

## 🧪 Complete Test Flow

### 1. Get Menu
```bash
curl https://snippymart.com/api/public/whatsapp/products
```

Copy a product ID from the response (e.g., `cursor-pro`)

### 2. Get Product Flow
```bash
curl https://snippymart.com/api/public/whatsapp/products/cursor-pro
```

### 3. Log the View
```bash
curl -X POST https://snippymart.com/api/public/whatsapp/log \
  -H "Content-Type: application/json" \
  -d '{"phone":"9477123456","event":"PRODUCT_VIEW","productId":"cursor-pro"}'
```

### 4. Check Analytics
Login to admin panel → `/admin/whatsapp/analytics`

You should see the logged event in the table!

---

## 🤖 Bot Integration Example

Your Railway WhatsApp bot can now call these APIs:

```javascript
const API_BASE = 'https://snippymart.com/api/public/whatsapp';

// Get product menu
async function getProductMenu() {
  const response = await fetch(`${API_BASE}/products`);
  return response.json();
}

// Get product flow
async function getProductFlow(productId) {
  const response = await fetch(`${API_BASE}/products/${productId}`);
  if (!response.ok) {
    throw new Error('Product not found');
  }
  return response.json();
}

// Log event
async function logEvent(phone, event, productId, message) {
  await fetch(`${API_BASE}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, event, productId, message }),
  });
}

// Example: Handle user asking for "cursor"
async function handleUserMessage(phone, message) {
  // Get menu
  const menu = await getProductMenu();
  
  // Find matching product (simple keyword match)
  const product = menu.find(p => 
    message.toLowerCase().includes(p.id.toLowerCase())
  );
  
  if (product) {
    // Log the view
    await logEvent(phone, 'PRODUCT_VIEW', product.id, message);
    
    // Get flow
    const flow = await getProductFlow(product.id);
    
    // Send messages step by step
    for (const step of flow.flowSteps) {
      await sendWhatsAppMessage(phone, `*${step.title}*\n\n${step.message}`);
      await sleep(step.delayMs);
    }
    
    // Send order link if enabled
    if (flow.showOrderLink) {
      await sendWhatsAppMessage(phone, `👉 Order: ${flow.orderUrl}`);
      await logEvent(phone, 'ORDER_CLICK', product.id);
    }
  } else {
    // User didn't match any product - show menu
    await logEvent(phone, 'MENU_REQUEST', null, message);
    // ... send menu list
  }
}
```

---

## 🔒 Security Features

✅ **No Authentication Required**
- Public endpoints accessible to anyone
- Bot doesn't need cookies or sessions

✅ **JSON Only**
- Never returns HTML
- Never redirects
- Always returns proper status codes

✅ **Data Safety**
- Only exposes enabled products
- No admin data leaked
- No pricing in menu (only in full product page)
- Phone numbers sanitized

✅ **RLS Protected**
- Database RLS policies control access
- Only `enabled = true` products returned
- Logs insertable by anyone (for tracking)

---

## ⚠️ Important Notes

### Before Testing:

1. **Run Migration First!**
   ```sql
   -- In Supabase SQL Editor:
   -- Run: supabase/migrations/20260204_whatsapp_automation.sql
   ```

2. **Enable a Product**
   - Go to `/admin/whatsapp/products`
   - Toggle a product ON
   - Configure its flow
   - Save

3. **Then Test APIs**
   - The enabled product should appear in menu
   - Flow should be fetchable
   - Logs should save

---

## 🐛 Troubleshooting

### "Products array is empty"
**Fix:** Go to admin panel and enable at least one product for WhatsApp

### "Product not found" (404)
**Fix:** Either product doesn't exist, or it's disabled in admin panel

### API returns HTML instead of JSON
**Fix:** This shouldn't happen with these endpoints. They explicitly return JSON only. If it does, check:
- Are you hitting the right URL? (`/api/public/whatsapp/*`)
- Is the deployment up to date?

### Log not appearing in analytics
**Fix:** 
- Check if phone contains valid characters
- Verify event type is one of the valid ones
- Check browser console for errors

---

## ✅ Checklist

- [ ] Migration run in Supabase
- [ ] At least one product enabled for WhatsApp
- [ ] Flow configured for that product
- [ ] `GET /api/public/whatsapp/products` returns JSON
- [ ] `GET /api/public/whatsapp/products/[id]` returns JSON
- [ ] `POST /api/public/whatsapp/log` returns `{"success": true}`
- [ ] Logs appear in admin analytics
- [ ] Bot can fetch menu without authentication
- [ ] Bot can fetch flows without authentication

---

## 🎯 Next Steps

Once all tests pass:

1. **Update Railway Bot**
   - Change API base URL to `https://snippymart.com/api/public/whatsapp`
   - Remove any auth logic
   - Implement flow-based responses

2. **Test with Real WhatsApp**
   - Send message to bot
   - Verify bot fetches products
   - Verify bot sends step-by-step flow
   - Check analytics dashboard for logs

3. **Monitor**
   - Watch analytics for user engagement
   - Adjust flows based on performance
   - Add more products as needed

---

**All endpoints are LIVE and ready for your WhatsApp bot!** 🚀

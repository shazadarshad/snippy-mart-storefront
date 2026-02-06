# AI Chat Training & Knowledge Management Guide

## 🎯 **What the AI Now Knows**

Your AI assistant has been trained with comprehensive knowledge about:

### ✅ **Products**
- All active products from your database
- Pricing plans and variants (LKR only)
- Product features and descriptions
- Stock status
- Direct product page links

### ✅ **Contact Information**
- **WhatsApp**: +94-78-776-7869
- **Email**: hello@snippymart.com
- **Instagram**: @snippymartofficial
- **Website**: https://snippymart.com
- **Support Hours**: 4-6 PM & 8-10 PM (Sri Lanka Time)

### ✅ **Policies**
- **Privacy Policy**: Data collection, usage, no selling to third parties
- **Refund Policy**: No refunds after delivery, replacements provided
- **Terms of Service**: Personal use only, no reselling

### ✅ **Business Information**
- Payment methods (Bank Transfer, Binance USDT, Card)
- Delivery process (digital, within 24 hours)
- Account types (fresh, new accounts)
- Ordering process (7 steps)

### ✅ **FAQs**
- Are accounts fresh/new?
- How long does delivery take?
- What if account doesn't work?
- Can I pay with card?
- Do you offer refunds?
- How to contact support?

---

## 🔄 **How to Update AI Knowledge**

### **Option 1: Update Products (Automatic)**
The AI automatically pulls product data from your Supabase database every time someone asks a question.

**To update product info:**
1. Go to your admin panel
2. Edit product details, pricing, or features
3. Save changes
4. AI will use new data immediately (no redeployment needed!)

### **Option 2: Update Business Info (Manual)**
To update contact info, policies, or FAQs:

1. **Edit the Edge Function**:
   ```bash
   # Open the file
   supabase/functions/ai-chat/index.ts
   ```

2. **Find the section** you want to update:
   - Contact Info: Line ~128-137
   - Policies: Line ~139-156
   - FAQs: Line ~170-187
   - Store Info: Line ~120-126

3. **Make your changes**

4. **Redeploy**:
   ```bash
   supabase functions deploy ai-chat --no-verify-jwt
   ```

---

## 📝 **How to Add New Knowledge**

### **Example: Adding a New FAQ**

**Step 1**: Open `supabase/functions/ai-chat/index.ts`

**Step 2**: Find the FAQ section (around line 170)

**Step 3**: Add your new FAQ:
```typescript
knowledgeBase += `**Q: Your new question?**\n`;
knowledgeBase += `A: Your detailed answer here.\n\n`;
```

**Step 4**: Redeploy:
```bash
supabase functions deploy ai-chat --no-verify-jwt
```

### **Example: Adding New Contact Method**

**Step 1**: Find Contact Information section (line ~128)

**Step 2**: Add new contact:
```typescript
knowledgeBase += `**Facebook**: facebook.com/snippymart\n`;
```

**Step 3**: Redeploy

---

## 🧪 **Testing AI Knowledge**

### **Test Questions to Try:**

**Products:**
- "What products do you have?"
- "How much is Cursor Pro?"
- "Tell me about ChatGPT Plus"

**Contact:**
- "How do I contact support?"
- "What's your WhatsApp number?"
- "What are your support hours?"

**Policies:**
- "What's your refund policy?"
- "Do you sell my data?"
- "Can I resell accounts?"

**Ordering:**
- "How do I order?"
- "What payment methods do you accept?"
- "How long does delivery take?"

**Social Media:**
- "What's your Instagram?"
- "How can I follow you?"

---

## 🎨 **Customizing AI Personality**

### **Change Response Style**

Edit the system prompt (line ~217-270):

**Make it more casual:**
```typescript
**Tone**: Super friendly, casual, and fun. Use lots of emojis! 😎🎉
```

**Make it more formal:**
```typescript
**Tone**: Professional, formal, and business-like. Minimal emojis.
```

**Change response length:**
```typescript
6. **Concise**: Keep responses under 200 characters  // Shorter
6. **Detailed**: Provide comprehensive responses up to 600 characters  // Longer
```

### **Change AI Model**

For smarter (but more expensive) responses:
```typescript
model: "gpt-4o"  // Instead of "gpt-4o-mini"
```

For faster (but less smart) responses:
```typescript
model: "gpt-3.5-turbo"
```

---

## 💰 **Cost Management**

### **Current Setup:**
- **Model**: GPT-4o-mini
- **Cost**: ~$0.0004 per chat
- **Monthly (1000 chats)**: ~$0.40

### **To Reduce Costs:**

1. **Shorter responses**:
   ```typescript
   max_tokens: 200  // Instead of 400
   ```

2. **Less context**:
   ```typescript
   history: messages.slice(-4)  // Instead of -6
   ```

3. **Cheaper model**:
   ```typescript
   model: "gpt-3.5-turbo"
   ```

---

## 🔒 **Security Best Practices**

### **API Key Management**
✅ **Good**: Store in Supabase secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

❌ **Bad**: Hardcode in code
```typescript
const apiKey = "sk-..." // NEVER DO THIS!
```

### **Rate Limiting**
The AI is already protected by:
- OpenAI's built-in rate limits
- Supabase Edge Function limits
- No authentication needed (public endpoint)

---

## 📊 **Monitoring AI Performance**

### **Check Logs**
```bash
# View recent AI chat logs
supabase functions logs ai-chat --limit 50
```

### **What to Look For:**
- ✅ Successful responses
- ❌ Errors (OpenAI API issues)
- ⚠️ Hallucination attempts ($ signs)

---

## 🚀 **Advanced: Custom Training Data**

### **Option 1: Add Static Knowledge**
Add any custom info to the knowledge base:

```typescript
knowledgeBase += `## Special Promotions\n\n`;
knowledgeBase += `**Current Offer**: 10% off on 6-month plans!\n`;
knowledgeBase += `**Promo Code**: SAVE10\n\n`;
```

### **Option 2: Pull from Database**
Fetch additional data from Supabase:

```typescript
// Fetch testimonials
const { data: testimonials } = await supabaseClient
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .limit(5);

if (testimonials) {
    knowledgeBase += `## Customer Reviews\n\n`;
    testimonials.forEach(t => {
        knowledgeBase += `"${t.content}" - ${t.customer_name}\n`;
    });
}
```

### **Option 3: Real-time Updates**
The AI already pulls fresh product data on every request, so product updates are instant!

---

## 🎓 **Training Checklist**

Use this checklist when updating AI knowledge:

- [ ] Updated knowledge base content
- [ ] Tested locally (if possible)
- [ ] Redeployed Edge Function
- [ ] Tested with real questions
- [ ] Verified responses are accurate
- [ ] Checked for hallucinations
- [ ] Confirmed links work
- [ ] Verified pricing is in LKR

---

## 📞 **Quick Reference**

### **Deploy AI Updates**
```bash
supabase functions deploy ai-chat --no-verify-jwt
```

### **View AI Logs**
```bash
supabase functions logs ai-chat
```

### **Test AI Endpoint**
```bash
node test-ai-chat.js
```

### **Update OpenAI Key**
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## 💡 **Pro Tips**

1. **Keep knowledge base concise** - AI works better with focused info
2. **Use bullet points** - Easier for AI to parse
3. **Include examples** - Helps AI understand format
4. **Test after changes** - Always verify responses
5. **Monitor costs** - Check OpenAI usage dashboard
6. **Update regularly** - Keep product info fresh
7. **Use markdown** - Makes responses prettier

---

## 🆘 **Troubleshooting**

### **AI gives wrong info**
→ Check knowledge base content
→ Redeploy Edge Function
→ Verify database has correct data

### **AI doesn't know about new product**
→ Check product is `is_active: true` in database
→ Refresh chat (new request pulls fresh data)

### **AI uses $ instead of LKR**
→ Anti-hallucination check should catch this
→ If not, check system prompt rules

### **Responses are too long**
→ Reduce `max_tokens` in Edge Function
→ Update system prompt to be more concise

---

**You're now ready to manage and train your AI assistant!** 🎉

For any questions, refer to this guide or check the AI_CHAT_SETUP.md file.

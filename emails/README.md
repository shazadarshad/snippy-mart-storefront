# 📧 React Email Templates - Modern Email System

## 🎨 Features

### ✨ **Modern Design System**
- **Lucide-style SVG Icons** - Inline SVG icons for universal email client support
- **Glassmorphism Effects** - Backdrop blur, transparency, and layered depth
- **Gradient Backgrounds** - Smooth color transitions and modern aesthetics
- **Premium Color Palette** - Carefully curated colors for dark theme
- **100% Mobile Responsive** - Perfect on all devices and email clients

### 🛠️ **Technology Stack**
- **React Email** - Industry-standard email framework
- **TypeScript** - Type-safe email templates
- **Inline SVG** - Lucide-inspired icons embedded directly
- **Table-based Layout** - Maximum email client compatibility

---

## 🚀 Quick Start

### **1. Preview Emails in Browser**
```bash
npm run email:dev
```
Opens a preview server at `http://localhost:3001` where you can see all email templates with live reload!

### **2. Build Email Templates**
```bash
npm run email:build
```
Generates SQL migration files from React components.

### **3. Deploy to Database**
Run the generated SQL migration in Supabase SQL Editor.

---

## 📁 Project Structure

```
emails/
├── OrderConfirmation.tsx    # Order confirmation email
├── build.ts                  # Build script to generate SQL
└── README.md                 # This file

supabase/migrations/
└── 20260124_react_email_templates.sql  # Generated migration
```

---

## 🎨 Design Highlights

### **Glassmorphism Card**
```tsx
background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
backdropFilter: 'blur(10px)',
borderRadius: '20px',
boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
border: '1px solid rgba(255, 255, 255, 0.05)',
```

### **Modern Icons (Lucide-style)**
```tsx
const ShoppingBagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" 
       fill="none" stroke="currentColor" 
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
```

### **Gradient Buttons**
```tsx
background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)',
border: '1px solid rgba(255, 255, 255, 0.1)',
```

---

## 🎯 Email Components

### **OrderConfirmation.tsx**

**Props:**
```typescript
interface OrderConfirmationEmailProps {
  customerName: string;    // Customer's name
  orderId: string;         // Order number
  total: string;           // Formatted total with currency
  items: string;           // Comma-separated items
  paymentMethod: string;   // Payment method with icon
}
```

**Features:**
- ✅ Lucide-style icons (Package, ShoppingCart, Dollar, CreditCard, Clock)
- ✅ Glassmorphism details card
- ✅ Gradient success badge
- ✅ Animated button with arrow icon
- ✅ Status badge with color coding
- ✅ Mobile-responsive layout

---

## 🎨 Color Palette

```typescript
// Primary Colors
Green Success: #10b981 → #059669
Dark Background: #1e293b → #0f172a

// Text Colors
White: #ffffff
Light Gray: #e2e8f0
Medium Gray: #cbd5e1
Muted: #94a3b8
Subtle: #64748b

// Glassmorphism
Card Background: rgba(15, 23, 42, 0.6)
Border: rgba(255, 255, 255, 0.08)
Highlight: rgba(255, 255, 255, 0.05)
```

---

## 📱 Mobile Optimization

### **Responsive Padding**
```tsx
// Desktop
padding: '32px 24px'

// Mobile (auto-adjusts)
padding: '24px 20px'
```

### **Flexible Widths**
```tsx
maxWidth: '600px',
width: '100%',
```

### **Touch-Friendly Buttons**
```tsx
padding: '16px 36px',  // Minimum 44px touch target
fontSize: '15px',
```

---

## 🔧 Customization

### **Adding New Icons**
```tsx
const YourIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" 
       fill="none" stroke="currentColor" 
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Your Lucide icon paths */}
  </svg>
);
```

### **Changing Colors**
Update the style objects at the bottom of the component:
```tsx
const successBadge = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  // Change to your brand colors
};
```

### **Adding New Templates**
1. Create `emails/YourTemplate.tsx`
2. Copy structure from `OrderConfirmation.tsx`
3. Update `emails/build.ts` to include new template
4. Run `npm run email:build`

---

## 📊 Email Client Compatibility

| Client | Support | Notes |
|--------|---------|-------|
| Gmail | ✅ | Full support |
| Outlook | ✅ | MSO conditional comments included |
| Apple Mail | ✅ | Perfect rendering |
| Yahoo | ✅ | Full support |
| Thunderbird | ✅ | Full support |
| Mobile Gmail | ✅ | Responsive layout |
| Mobile Outlook | ✅ | Touch-friendly |
| Samsung Email | ✅ | Full support |

---

## 🎯 Best Practices

### **1. Always Use Inline Styles**
```tsx
// ✅ Good
<div style={{ color: '#ffffff' }}>Text</div>

// ❌ Bad
<div className="text-white">Text</div>
```

### **2. Use Tables for Layout**
```tsx
// ✅ Good
<Row>
  <Column>Content</Column>
</Row>

// ❌ Bad
<div className="flex">Content</div>
```

### **3. Embed SVG Icons**
```tsx
// ✅ Good
const Icon = () => <svg>...</svg>

// ❌ Bad
<img src="icon.svg" />
```

### **4. Test on Real Devices**
- Send test emails to Gmail, Outlook, Apple Mail
- Check on iPhone, Android, Desktop
- Verify all icons render correctly

---

## 🚀 Deployment Workflow

```bash
# 1. Edit email template
vim emails/OrderConfirmation.tsx

# 2. Preview changes
npm run email:dev

# 3. Build SQL migration
npm run email:build

# 4. Deploy to Supabase
# Run generated SQL in Supabase SQL Editor

# 5. Test
# Send test order and check email
```

---

## 📧 Example Email Output

```
┌─────────────────────────────────────┐
│  🛒 Snippy Mart                     │  ← Logo with gradient icon
├─────────────────────────────────────┤
│  ✅ Order Confirmed!                │  ← Success badge
├─────────────────────────────────────┤
│  Hey John! 👋                       │
│  Thank you for your purchase...     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 📦 Order Number               │  │
│  │ #SNIP-2026-123456             │  │  ← Glassmorphism card
│  │                               │  │
│  │ 🛍️ Items Purchased            │  │
│  │ Netflix Premium x1            │  │
│  │                               │  │
│  │ 💰 Total: $9.99  💳 Card      │  │
│  │                               │  │
│  │ ⏱️ Status: Processing         │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Track Your Order →]               │  ← Gradient button
├─────────────────────────────────────┤
│  Snippy Mart • Premium Digital      │
│  © 2026 All rights reserved         │
└─────────────────────────────────────┘
```

---

## 🎨 Icon Library

Available Lucide-style icons:
- `ShoppingBagIcon` - Logo/branding
- `CheckCircleIcon` - Success states
- `PackageIcon` - Order/shipping
- `ShoppingCartIcon` - Items/products
- `DollarIcon` - Pricing/money
- `CreditCardIcon` - Payment
- `ClockIcon` - Time/status
- `ArrowRightIcon` - CTAs/navigation

---

## 💡 Tips & Tricks

### **Glassmorphism Effect**
```tsx
background: 'rgba(15, 23, 42, 0.6)',
backdropFilter: 'blur(10px)',  // May not work in all clients
border: '1px solid rgba(255, 255, 255, 0.08)',
boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
```

### **Gradient Text**
```tsx
<span style={{
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}>
  Gradient Text
</span>
```

### **Status Badges**
```tsx
<span style={{
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#10b981',
  padding: '6px 14px',
  borderRadius: '20px',
  border: '1px solid rgba(16, 185, 129, 0.3)',
}}>
  Processing
</span>
```

---

## 🔍 Troubleshooting

### **Icons not showing?**
- Ensure SVG is inline, not external
- Check `stroke` and `fill` attributes
- Verify `viewBox` is correct

### **Glassmorphism not working?**
- `backdrop-filter` has limited support
- Use solid fallback colors
- Test in target email clients

### **Layout broken on mobile?**
- Use `max-width` instead of fixed width
- Add responsive padding
- Test with `email:dev` preview

---

## 📚 Resources

- [React Email Docs](https://react.email)
- [Lucide Icons](https://lucide.dev)
- [Email Client Support](https://www.caniemail.com)
- [Glassmorphism Guide](https://glassmorphism.com)

---

**Built with ❤️ using React Email, TypeScript, and Lucide-style icons!**

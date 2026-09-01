import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aioyoxnjukfibsogegdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA0ODAsImV4cCI6MjEwMzgyNjQ4MH0.4XrFwZgyTQ00HSyUVlxpluKL9XFBs15hmMzOrIEtepc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const newProduct = {
  name: '🔥 Railway Hobby + Framer Pro Combo (12 Months)',
  slug: 'railway-hobby-framer-pro-12-months-combo',
  description: `🔥 **LIMITED TIME COMBO OFFER!** 🔥

Get 12 months access to both **Railway Hobby** and **Framer Pro** at an exclusive discounted price!

---

### 📦 What's Included:
* 🚂 **Railway Hobby (12 Months)** — Deploy & host your web apps, microservices, databases & APIs effortlessly.
* 🎨 **Framer Pro (12 Months)** — Build, design & publish high-performance interactive websites with custom domain support.

---

### ✨ Key Highlights & Features:
* ✅ **Full 12 Months Access** for both premium plans.
* ✅ **Activated on Your New Accounts** (Fresh & Private credentials).
* ✅ **Perfect for Developers, Designers & Freelancers**.
* ⚡ **Limited Stock** — Grab this limited-time combo before it sells out!

---

> ℹ️ *Note: This special promotional combo offer comes with no warranty.*`,
  price: 3999,
  old_price: 5399,
  category: 'Combos',
  categories: ['Combos', 'Development', 'Design'],
  image_url: '/railway-framer-combo.jpg',
  is_active: true,
  is_featured: true,
  stock_status: 'limited',
  manual_fulfillment: true,
  display_order: 1,
};

async function insertProduct() {
  console.log('Inserting combo product to Supabase...');
  
  // Check if product already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id, name')
    .eq('slug', newProduct.slug)
    .maybeSingle();

  if (existing) {
    console.log('Product already exists with ID:', existing.id, 'Updating product...');
    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update(newProduct)
      .eq('id', existing.id)
      .select();

    if (updateErr) {
      console.error('Error updating product:', updateErr);
    } else {
      console.log('Successfully updated product in Supabase:', updated);
    }
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert(newProduct)
      .select();

    if (insertErr) {
      console.error('Error inserting product:', insertErr);
    } else {
      console.log('Successfully inserted product to Supabase:', inserted);
    }
  }
}

insertProduct();

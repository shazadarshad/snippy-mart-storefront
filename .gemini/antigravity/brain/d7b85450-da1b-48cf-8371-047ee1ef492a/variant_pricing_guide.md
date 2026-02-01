# Variant Pricing System - Implementation Guide

## Overview
The Variant Pricing System allows you to create complex pricing structures like Freepik, where customers select a duration and then choose a package variant with different features/credits.

## How It Works

### Example: Freepik Product
```
Product: Freepik Premium

Duration Options:
- 1 Month
- 3 Months  
- 6 Months

Package Options (variants per duration):
- 100k credits @ $10 (for 1 month) / $25 (for 3 months) / $45 (for 6 months)
- 200k credits @ $15 (for 1 month) / $35 (for 3 months) / $60 (for 6 months)
- 300k credits @ $20 (for 1 month) / $45 (for 3 months) / $75 (for 6 months)
```

## Setup Instructions

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Run this migration file: `supabase/migrations/20260201_add_variant_pricing_toggle.sql`
3. Run this migration file: `supabase/migrations/20260201_verify_variants_table.sql`

### Step 2: Create a Product with Variant Pricing

#### In Admin Panel → Products:

1. **Create/Edit Product**
   - Fill in basic product details (name, description, image, etc.)
   - **Enable "Use Variant Pricing Grid"** toggle
   - Set base price (this won't be used if variants are set)

2. **Add Pricing Plans** (these represent durations)
   - Click "Add Pricing Plan"
   - **Plan 1:** Name: "Premium", Duration: "1 Month"
   - **Plan 2:** Name: "Business", Duration: "3 Months"
   - **Plan 3:** Name: "Enterprise", Duration: "6 Months"
   - Don't set prices on plans when using variants

3. **Add Sub-Plans (Variants) for Each Plan**
   
   **For "1 Month" Plan:**
   - Click "Add Sub-Plan" under the 1 Month plan
   - Variant 1: Name: "100k Credits", Price: 10
   - Variant 2: Name: "200k Credits", Price: 15
   - Variant 3: Name: "300k Credits", Price: 20
   
   **For "3 Months" Plan:**
   - Click "Add Sub-Plan" under the 3 Months plan
   - Variant 1: Name: "100k Credits", Price: 25
   - Variant 2: Name: "200k Credits", Price: 35
   - Variant 3: Name: "300k Credits", Price: 45
   
   **For "6 Months" Plan:**
   - Click "Add Sub-Plan" under the 6 Months plan
   - Variant 1: Name: "100k Credits", Price: 45
   - Variant 2: Name: "200k Credits", Price: 60
   - Variant 3: Name: "300k Credits", Price: 75

4. **Save Product**

### Step 3: How Customers See It

When a customer clicks on the product:

1. **Modal opens** showing product details
2. **Step 1:** Customer sees duration options:
   - [ 1 Month ]  [ 3 Months ]  [ 6 Months ]
3. **Step 2:** After selecting "1 Month", they see package options:
   - [ 100k Credits - $10 ]
   - [ 200k Credits - $15 ]
   - [ 300k Credits - $20 ]
4. Customer selects "200k Credits"
5. **Cart shows:** "Freepik Premium - 1 Month › 200k Credits - $15"

## When to Use Variant Pricing

**Use Variant Pricing When:**
- You have multiple duration options (1 month, 3 months, 6 months)
- Each duration has different package tiers (100k, 200k, 300k credits)
- Prices vary based on both duration AND package selected
- Example: Freepik, Envato, subscription services with tiered credits/features

**Don't Use Variant Pricing When:**
- Simple products with one price
- Only duration varies (use regular pricing plans)
- Products with simple variants (size, color) - use regular approach

## Database Schema

### Products Table
- `use_variant_pricing` (boolean): Toggle to enable variant pricing grid

### product_pricing_plans Table
- Represents durations/tiers (1 Month, 3 Months, etc.)

### product_pricing_plan_variants Table
- Represents packages under each plan (100k credits, 200k credits, etc.)
- Fields:
  - `plan_id`: Links to parent plan
  - `name`: Variant name (e.g., "100k Credits")
  - `price`: Price for this variant
  - `old_price`: Optional discounted price
  - `is_active`: Show/hide variant
  - `stock_status`: in_stock, limited, out_of_stock

## Order Storage

When a customer purchases:
- `order_items.plan_id`: Selected plan ID (e.g., "1 Month")
- `order_items.plan_name`: Selected plan name
- `order_items.variant_id`: Selected variant ID (e.g., "200k Credits")
- `order_items.variant_name`: Selected variant name

This ensures complete tracking of what was purchased.

## UI Flow Comparison

### Regular Product (use_variant_pricing = false):
1. Select Plan → Add to Cart
2. Cart shows: "Product Name - Plan Name"

### Variant Pricing Product (use_variant_pricing = true):
1. Select Duration → Select Package → Add to Cart
2. Cart shows: "Product Name - Duration › Package"

## Tips

1. **Naming Conventions:**
   - Plans: Use duration (1 Month, 3 Months, Annual)
   - Variants: Use descriptive features (100k Credits, Basic Plan, Pro Plan)

2. **Pricing Strategy:**
   - Lower per-unit cost for longer durations
   - Higher package = better value per credit

3. **Stock Management:**
   - Set `stock_status` on variants to show limited availability
   - Use `is_active` to hide/show variants without deleting

## Troubleshooting

**Issue: Variants not showing**
- Check if `use_variant_pricing` is enabled on the product
- Verify variants have `is_active = true`
- Ensure plan has variants attached to it

**Issue: Price not updating**
- Variant pricing takes precedence when enabled
- Check that variant has a price set

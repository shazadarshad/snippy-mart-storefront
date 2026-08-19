import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PaymentMethod = "bank_transfer" | "upi" | "binance_usdt" | "crypto_onchain" | "card";

type CreateOrderBody = {
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  total_amount: number;
  notes?: string;
  payment_method?: PaymentMethod;
  payment_proof_url?: string; // for this app we store the storage path here
  binance_id?: string;
  customer_country?: string;
  customer_email?: string;
  applied_coupon_id?: string;
  discount_amount?: number;
  affiliate_code?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    plan_name?: string;
    variant_id?: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    customer_credentials?: any;
  }>;
};

/** Resolve catalog unit price (LKR) from product → variant → plan */
function resolveCatalogUnitPrice(
  product: { price: number | string },
  item: CreateOrderBody["items"][number],
  plans: Array<{ id: string; product_id: string; name: string; price: number | string }>,
  variants: Array<{ id: string; plan_id: string; price: number | string }>,
): number {
  if (item.variant_id) {
    const v = variants.find((x) => x.id === item.variant_id);
    if (v != null && Number.isFinite(Number(v.price))) return Number(v.price);
  }
  if (item.plan_name) {
    const plan = plans.find(
      (p) => p.product_id === item.product_id && String(p.name).trim() === String(item.plan_name).trim(),
    );
    if (plan != null && Number.isFinite(Number(plan.price))) return Number(plan.price);
  }
  return Number(product.price) || 0;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const url = new URL(req.url);
  console.log(`[create-order] ${req.method} ${url.pathname}`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[create-order] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Missing Supabase env vars" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch (e) {
    console.error("[create-order] Invalid JSON body", e);
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.order_number || !body.customer_whatsapp || !Array.isArray(body.items) || body.items.length === 0) {
    console.error("[create-order] Missing required fields", {
      order_number: body.order_number,
      customer_whatsapp: body.customer_whatsapp,
      items_count: Array.isArray(body.items) ? body.items.length : null,
    });
    return json({ error: "Missing required fields" }, 400);
  }

  // Temporarily off — flip this with UPI_CHECKOUT_ENABLED in src/lib/paymentMethod.ts
  const UPI_CHECKOUT_ENABLED = false;
  if (!UPI_CHECKOUT_ENABLED && body.payment_method === "upi") {
    return json(
      { error: "UPI is temporarily unavailable. Please use bank transfer, crypto, or card." },
      400,
    );
  }

  console.log(`[create-order] Processing order ${body.order_number} items=${body.items.length}`);

  // --- Server-side price / stock trust (never trust client totals) ---
  const productIds = [
    ...new Set(
      body.items
        .map((i) => (i.product_id && String(i.product_id).length === 36 ? i.product_id : null))
        .filter(Boolean) as string[],
    ),
  ];

  if (productIds.length !== body.items.filter((i) => i.product_id).length) {
    // duplicate product lines OK; missing ids not OK
  }
  if (productIds.length === 0) {
    return json({ error: "Order items are missing product IDs. Clear cart and try again." }, 400);
  }

  const { data: dbProducts, error: productsErr } = await supabase
    .from("products")
    .select("id, name, price, stock_status, is_active, reseller_stock")
    .in("id", productIds);

  if (productsErr || !dbProducts?.length) {
    console.error("[create-order] product lookup failed", productsErr);
    return json({ error: "Could not verify product prices. Please try again." }, 400);
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  const { data: dbPlans } = await supabase
    .from("product_pricing_plans")
    .select("id, product_id, name, price")
    .in("product_id", productIds);

  const plans = dbPlans || [];
  const planIds = plans.map((p) => p.id);

  let variants: Array<{ id: string; plan_id: string; price: number | string }> = [];
  const variantIds = [
    ...new Set(body.items.map((i) => i.variant_id).filter(Boolean) as string[]),
  ];
  if (variantIds.length > 0 || planIds.length > 0) {
    let vq = supabase.from("product_pricing_plan_variants").select("id, plan_id, price");
    if (variantIds.length > 0) {
      const { data: byId } = await vq.in("id", variantIds);
      variants = byId || [];
    }
    if (variants.length === 0 && planIds.length > 0) {
      const { data: byPlan } = await supabase
        .from("product_pricing_plan_variants")
        .select("id, plan_id, price")
        .in("plan_id", planIds);
      variants = byPlan || [];
    }
  }

  type TrustedItem = {
    product_id: string | null;
    product_name: string;
    plan_name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    customer_credentials: unknown;
  };

  const trustedItems: TrustedItem[] = [];
  let subtotal = 0;

  for (const item of body.items) {
    const pid = item.product_id;
    if (!pid || !productMap.has(pid)) {
      return json(
        { error: `Unknown or removed product: ${item.product_name || "item"}. Clear cart and re-add.` },
        400,
      );
    }
    const product = productMap.get(pid)!;
    if (product.is_active === false) {
      return json({ error: `${product.name} is no longer available.` }, 400);
    }
    if (product.stock_status === "out_of_stock") {
      return json({ error: `${product.name} is out of stock.` }, 400);
    }

    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (product.reseller_stock != null && Number.isFinite(Number(product.reseller_stock))) {
      const stock = Math.floor(Number(product.reseller_stock));
      if (stock >= 0 && qty > stock) {
        return json(
          { error: `Not enough stock for ${product.name} (max ${stock}).` },
          400,
        );
      }
    }

    const catalogUnit = resolveCatalogUnitPrice(product, item, plans, variants);
    if (!Number.isFinite(catalogUnit) || catalogUnit < 0) {
      return json({ error: `Invalid catalog price for ${product.name}.` }, 400);
    }

    // Reject underpayment attempts (client unit significantly below catalog)
    const clientUnit = Number(item.unit_price);
    if (Number.isFinite(clientUnit) && clientUnit + 1 < catalogUnit) {
      console.warn("[create-order] price underpay blocked", {
        product: product.name,
        clientUnit,
        catalogUnit,
      });
      return json(
        {
          error:
            `Price for ${product.name} has changed. Please refresh the page and try again.`,
        },
        400,
      );
    }

    const unit = catalogUnit;
    const lineTotal = Math.round(unit * qty * 100) / 100;
    subtotal += lineTotal;

    trustedItems.push({
      product_id: pid,
      product_name: item.product_name || product.name,
      plan_name: item.plan_name ?? null,
      quantity: qty,
      unit_price: unit,
      total_price: lineTotal,
      customer_credentials: item.customer_credentials ?? null,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Recompute coupon discount server-side
  let trustedDiscount = 0;
  let trustedCouponId: string | null = body.applied_coupon_id || null;
  if (trustedCouponId) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, type, value, min_order_amount, max_discount, is_active, expires_at, usage_limit, used_count")
      .eq("id", trustedCouponId)
      .maybeSingle();

    if (
      !coupon ||
      !coupon.is_active ||
      (coupon.expires_at && new Date(coupon.expires_at) < new Date()) ||
      (coupon.usage_limit != null &&
        coupon.used_count != null &&
        Number(coupon.used_count) >= Number(coupon.usage_limit)) ||
      (coupon.min_order_amount != null && subtotal < Number(coupon.min_order_amount))
    ) {
      console.warn("[create-order] coupon rejected or invalid", trustedCouponId);
      trustedCouponId = null;
      trustedDiscount = 0;
    } else if (coupon.type === "fixed") {
      trustedDiscount = Math.min(Number(coupon.value) || 0, subtotal);
    } else {
      let d = subtotal * ((Number(coupon.value) || 0) / 100);
      if (coupon.max_discount != null) d = Math.min(d, Number(coupon.max_discount));
      trustedDiscount = d;
    }
    trustedDiscount = Math.round(trustedDiscount * 100) / 100;
  }

  const trustedTotal = Math.max(0, Math.round((subtotal - trustedDiscount) * 100) / 100);

  // Soft check: client total should not be wildly lower than trusted (display currency is still LKR base)
  const clientTotal = Number(body.total_amount);
  if (Number.isFinite(clientTotal) && clientTotal + 1 < trustedTotal) {
    console.warn("[create-order] total underpay blocked", { clientTotal, trustedTotal });
    return json(
      {
        error:
          "Order total is outdated (cart or coupon changed). Refresh checkout and place the order again.",
      },
      400,
    );
  }

  console.log(
    `[create-order] trusted subtotal=${subtotal} discount=${trustedDiscount} total=${trustedTotal}`,
  );

  // Resolve affiliate ref (optional)
  let affiliateId: string | null = null;
  let affiliateCode: string | null = null;
  const rawAff = String(body.affiliate_code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (rawAff.length >= 2) {
    const { data: aff } = await supabase
      .from("affiliates")
      .select("id, code, status, whatsapp")
      .ilike("code", rawAff)
      .maybeSingle();
    if (aff && (aff.status === "active" || aff.status === "pending")) {
      // Self-referral: same WhatsApp as affiliate → ignore
      const orderDigits = String(body.customer_whatsapp || "").replace(/\D/g, "").slice(-9);
      const affDigits = String(aff.whatsapp || "").replace(/\D/g, "").slice(-9);
      if (!(orderDigits.length >= 9 && orderDigits === affDigits)) {
        affiliateId = aff.id;
        affiliateCode = aff.code;
      }
    } else if (rawAff) {
      // Keep code on order even if pending; commission only when active + completed
      affiliateCode = rawAff;
    }
  }

  // Create or Update order (Upsert by order_number) — server totals only
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .upsert(
      [
        {
          order_number: body.order_number,
          customer_name: body.customer_name || "Customer",
          customer_whatsapp: body.customer_whatsapp,
          total_amount: trustedTotal,
          status: "pending", // Always set back to pending on "submission" or "pre-register"
          notes: body.notes ?? null,
          payment_method: body.payment_method ?? null,
          payment_proof_url: body.payment_proof_url ?? null,
          binance_id: body.binance_id ?? null,
          customer_country: body.customer_country ?? 'Unknown',
          customer_email: body.customer_email ?? null,
          applied_coupon_id: trustedCouponId,
          discount_amount: trustedDiscount,
          currency_code: (body as any).currency_code ?? 'LKR',
          currency_symbol: (body as any).currency_symbol ?? 'Rs.',
          currency_rate: (body as any).currency_rate ?? 1,
          affiliate_id: affiliateId,
          affiliate_code: affiliateCode,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'order_number' }
    )
    .select()
    .single();

  if (orderError || !order) {
    console.error("[create-order] Failed to upsert order", orderError);
    return json({ error: orderError?.message ?? "Failed to save order" }, 400);
  }

  // Fire-and-forget Smart AI SMS Matcher (< 700 LKR)
  if (Number(order.total_amount) < 700) {
    const matcherUrl = `${supabaseUrl}/functions/v1/smart-sms-matcher`;
    fetch(matcherUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_threshold: 700 }),
    }).catch((e) => console.warn("[create-order] smart-sms-matcher async invoke err", e));
  }

  // Delete existing items to avoid duplicates on update
  const { error: deleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", order.id);

  if (deleteError) {
    console.error("[create-order] Failed to clear old items", deleteError);
    // Continue anyway, insertion might fail if primary key conflicts but we use auto-id so it's fine
  }

  const itemsPayload = trustedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id ?? null,
    product_name: item.product_name,
    plan_name: item.plan_name ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    customer_credentials: item.customer_credentials ?? null,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);

  if (itemsError) {
    console.error("[create-order] Failed to create order items", itemsError);
    // NEVER hard-delete the order shell: payment proof may already be uploaded and the
    // customer can retry with the same order_number (upsert). Leaving a pending order
    // without items is recoverable; deleting loses the order_number and admin trail.
    return json(
      {
        error: itemsError.message ?? "Failed to create order items",
        order_id: order.id,
        order_number: order.order_number,
        partial: true,
      },
      400,
    );
  }

  console.log(`[create-order] Order created successfully: ${order.id}`);

  // Increment coupon usage if applied (trusted id only)
  if (trustedCouponId) {
    console.log(`[create-order] Incrementing usage for coupon: ${trustedCouponId}`);
    const { error: couponError } = await supabase.rpc('increment_coupon_usage', {
      coupon_id: trustedCouponId
    });

    if (couponError) {
      console.error("[create-order] Failed to increment coupon usage:", couponError);
      // We don't fail the whole order if coupon increment fails, but we log it
    }
  }

  // Trigger automated order confirmation email (optional/background)
  if (body.customer_email) {
    console.log(`[create-order] Customer email provided: ${body.customer_email}`);
    console.log(`[create-order] Attempting to fetch order_confirmation template...`);

    // We fetch the template ID for order_confirmation
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("id, name, is_active")
      .eq("template_key", "order_confirmation")
      .single();

    if (templateError) {
      console.error(`[create-order] Template lookup error:`, templateError);
      console.log(`[create-order] Template might not exist in database. Please run the SQL migration.`);
    }

    if (!template) {
      console.error(`[create-order] No template found for order_confirmation!`);
      console.error(`[create-order] Email will NOT be sent. Please ensure email_templates table has order_confirmation template.`);
    } else if (!template.is_active) {
      console.warn(`[create-order] Template exists but is not active: ${template.name}`);
    } else {
      console.log(`[create-order] Template found: ${template.name} (ID: ${template.id})`);

      // Invoke send-email function
      // We await this to ensure the email request is actually sent before the function completes
      try {
        console.log(`[create-order] Invoking send-email function...`);

        // Format price with currency info if provided
        const currencySymbol = (body as any).currency_symbol || '$';
        const currencyCode = (body as any).currency_code || 'USD';
        const totalFormatted = `${currencySymbol}${order.total_amount.toFixed(currencyCode === 'LKR' || currencyCode === 'INR' ? 0 : 2)}`;

        // Format payment method for display
        const paymentMethodDisplay = body.payment_method === 'bank_transfer'
          ? 'Bank Transfer 🏦'
          : body.payment_method === 'binance_usdt'
            ? 'Binance Pay ₿'
            : body.payment_method === 'crypto_onchain'
              ? 'Crypto Wallet 🔗'
              : body.payment_method === 'card'
                ? 'Card Payment 💳'
                : 'Pending';

        // Logo for email header (send-email also fills this as a fallback)
        const { data: logoSetting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "logo_url")
          .maybeSingle();
        const logoUrl =
          (logoSetting?.value && String(logoSetting.value).trim()) ||
          `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/site-assets/logo-1768828286339.png`;

        const emailPayload = {
          to: body.customer_email,
          templateId: template.id,
          orderId: order.id,
          variables: {
            customer_name: body.customer_name || 'Customer',
            order_id: body.order_number,
            total: totalFormatted,
            items: body.items.map(i => `${i.product_name} x${i.quantity}`).join(', '),
            payment_method: paymentMethodDisplay,
            logo_url: logoUrl,
          }
        };

        console.log(`[create-order] Email payload:`, JSON.stringify(emailPayload, null, 2));

        const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-email", {
          body: emailPayload
        });

        if (emailError) {
          console.error(`[create-order] send-email function returned error:`, emailError);
        } else {
          console.log(`[create-order] send-email invoked successfully. Result:`, emailResult);
          console.log(`[create-order] ✅ Confirmation email sent to ${body.customer_email}`);
        }
      } catch (err) {
        console.error(`[create-order] Exception while invoking send-email:`, err);
      }
    }
  } else {
    console.log(`[create-order] No customer email provided - skipping confirmation email`);
  }

  // --- ADMIN NOTIFICATION ---
  try {
    console.log(`[create-order] Sending admin notification to shazad.arshad199@gmail.com...`);

    // Format variables (re-using headers if possible, or re-declaring)
    const currencySymbol = (body as any).currency_symbol || '$';
    const currencyCode = (body as any).currency_code || 'USD';
    const totalFormatted = `${currencySymbol}${order.total_amount.toFixed(currencyCode === 'LKR' || currencyCode === 'INR' ? 0 : 2)}`;

    const paymentMethodDisplay = body.payment_method === 'bank_transfer'
      ? 'Bank Transfer'
      : body.payment_method === 'binance_usdt'
        ? 'Binance Pay'
        : body.payment_method === 'crypto_onchain'
          ? 'Crypto Wallet (on-chain)'
          : body.payment_method === 'card'
            ? 'Card Payment'
            : 'Pending/Other';

    const itemsListHtml = body.items.map(i =>
      `<li>${i.product_name} x${i.quantity} - ${currencySymbol}${i.total_price}</li>`
    ).join('');

    const adminEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 20px;">
        <h2 style="color: #333; margin-top: 0;">🚀 New Order Received</h2>
        <div style="background: #fff; padding: 20px; border-radius: 15px; border: 1px solid #eee;">
          <p><strong>Order:</strong> <span style="font-family: monospace;">${body.order_number}</span></p>
          <p><strong>Total:</strong> <span style="color: #00b8d4; font-weight: bold;">${totalFormatted}</span></p>
          <p><strong>Payment:</strong> ${paymentMethodDisplay}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Customer:</strong> ${body.customer_name || 'Guest'}</p>
          <p><strong>WhatsApp:</strong> ${body.customer_whatsapp}</p>
          <p><strong>Email:</strong> ${body.customer_email || 'Not provided'}</p>
        </div>
        <h3 style="color: #666; font-size: 14px; text-transform: uppercase; margin-top: 25px;">Order Manifest</h3>
        <ul style="padding-left: 20px; color: #444;">${itemsListHtml}</ul>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://snippymart.com/admin/orders" style="background: #000; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 10px; font-weight: bold;">VIEW IN PANEL</a>
        </div>
      </div>
    `;

    const adminEmailPayload = {
      to: 'shazad.arshad199@gmail.com',
      subject: `New Order: ${body.order_number} (${totalFormatted})`,
      html: adminEmailHtml,
      orderId: order.id
    };

    const { error: adminEmailError } = await supabase.functions.invoke("send-email", {
      body: adminEmailPayload
    });

    if (adminEmailError) {
      console.error(`[create-order] Admin email failed:`, adminEmailError);
    } else {
      console.log(`[create-order] ✅ Admin notification sent.`);
    }

  } catch (err) {
    console.error(`[create-order] Exception sending admin email:`, err);
  }
  // --------------------------

  // --- ADMIN APK PUSH (async — never delay order response) ---
  try {
    const pushUrl = `${supabaseUrl}/functions/v1/push-admin-order`;
    // Fire-and-forget: do not await; checkout returns immediately
    void fetch(pushUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: order.id,
        order_number: body.order_number,
        customer_name: body.customer_name,
        total_amount: order.total_amount,
      }),
    }).catch((e) => console.error("[create-order] push-admin-order fire-and-forget", e));
  } catch (e) {
    console.error("[create-order] push schedule failed", e);
  }
  // ----------------------------------------------------------

  return json({ order });
});

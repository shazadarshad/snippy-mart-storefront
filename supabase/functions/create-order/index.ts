import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PaymentMethod = "bank_transfer" | "binance_usdt";

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
  items: Array<{
    product_id?: string;
    product_name: string;
    plan_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

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

  console.log(`[create-order] Creating order ${body.order_number} items=${body.items.length}`);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        order_number: body.order_number,
        customer_name: body.customer_name || "Customer",
        customer_whatsapp: body.customer_whatsapp,
        total_amount: body.total_amount,
        status: "pending",
        notes: body.notes ?? null,
        payment_method: body.payment_method ?? null,
        payment_proof_url: body.payment_proof_url ?? null,
        binance_id: body.binance_id ?? null,
        customer_country: body.customer_country ?? 'Unknown',
        customer_email: body.customer_email ?? null,
      },
    ])
    .select()
    .single();

  if (orderError || !order) {
    console.error("[create-order] Failed to create order", orderError);
    return json({ error: orderError?.message ?? "Failed to create order" }, 400);
  }

  const itemsPayload = body.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id ?? null,
    product_name: item.product_name,
    plan_name: item.plan_name ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);

  if (itemsError) {
    console.error("[create-order] Failed to create order items", itemsError);
    // best-effort rollback to avoid dangling orders
    await supabase.from("orders").delete().eq("id", order.id);
    return json({ error: itemsError.message ?? "Failed to create order items" }, 400);
  }

  console.log(`[create-order] Order created successfully: ${order.id}`);

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
            ? 'Binance USDT ₿'
            : body.payment_method === 'card'
              ? 'Card Payment 💳'
              : 'Pending';

        const emailPayload = {
          to: body.customer_email,
          templateId: template.id,
          orderId: order.id,
          variables: {
            customer_name: body.customer_name || 'Customer',
            order_id: body.order_number,
            total: totalFormatted,
            items: body.items.map(i => `${i.product_name} x${i.quantity}`).join(', '),
            payment_method: paymentMethodDisplay
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
        ? 'Binance USDT'
        : body.payment_method === 'card'
          ? 'Card Payment'
          : 'Pending/Other';

    const itemsListHtml = body.items.map(i =>
      `<li>${i.product_name} x${i.quantity} - ${currencySymbol}${i.total_price}</li>`
    ).join('');

    const adminEmailHtml = `
      <h2>New Order Received! 🚀</h2>
      <p><strong>Order ID:</strong> ${body.order_number}</p>
      <p><strong>Customer:</strong> ${body.customer_name || 'Guest'}</p>
      <p><strong>WhatsApp:</strong> ${body.customer_whatsapp}</p>
      <p><strong>Email:</strong> ${body.customer_email || 'Not provided'}</p>
      <p><strong>Total Amount:</strong> ${totalFormatted}</p>
      <p><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
      
      <h3>Order Items:</h3>
      <ul>${itemsListHtml}</ul>
      
      <p><strong>Notes:</strong> ${body.notes || 'None'}</p>
      
      <hr />
      <p><a href="https://snippy-mart-storefront.vercel.app/admin/orders">View in Admin Panel</a></p>
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

  return json({ order });
});

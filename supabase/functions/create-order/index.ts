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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

  return json({ order });
});

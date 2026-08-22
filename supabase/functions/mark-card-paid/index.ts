import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase env" }, 500);
  }

  let body: { order_number?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const orderNumber = String(body.order_number || "").trim();
  if (!orderNumber) return json({ error: "order_number is required" }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: lookupErr } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_method, customer_name, total_amount, card_marked_paid_at, notes",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (lookupErr || !order) return json({ error: "Order not found" }, 404);

  if (order.status === "cancelled" || order.status === "refunded") {
    return json({ error: "This order is no longer open." }, 400);
  }

  const already = !!order.card_marked_paid_at;
  const now = new Date().toISOString();

  if (!already) {
    const { error: updErr } = await supabase
      .from("orders")
      .update({
        card_marked_paid_at: now,
        updated_at: now,
      })
      .eq("id", order.id);

    if (updErr) {
      const stamp = `[Card] Customer tapped I've paid at ${now}`;
      const notes = [order.notes, stamp].filter(Boolean).join("\n");
      const { error: noteErr } = await supabase
        .from("orders")
        .update({ notes, updated_at: now })
        .eq("id", order.id);
      if (noteErr) {
        return json({ error: updErr.message || "Could not mark paid" }, 400);
      }
    }

    const pushUrl = `${supabaseUrl}/functions/v1/push-admin-order`;
    fetch(pushUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "card_paid",
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
      }),
    }).catch((e) => console.warn("[mark-card-paid] push", e));
  }

  return json({
    ok: true,
    already,
    order_number: order.order_number,
    card_marked_paid_at: already ? order.card_marked_paid_at : now,
  });
});

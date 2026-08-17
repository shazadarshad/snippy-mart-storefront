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

  let body: { order_number?: string; payment_proof_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const orderNumber = String(body.order_number || "").trim();
  const proofPath = String(body.payment_proof_url || "").trim();
  if (!orderNumber || !proofPath) {
    return json({ error: "order_number and payment_proof_url are required" }, 400);
  }
  if (proofPath.includes("..") || proofPath.startsWith("http")) {
    return json({ error: "payment_proof_url must be a storage path" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: lookupErr } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_method, card_checkout_url")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (lookupErr || !order) {
    return json({ error: "Order not found" }, 404);
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return json({ error: "This order can no longer accept payment proof." }, 400);
  }

  const { error: updErr } = await supabase
    .from("orders")
    .update({
      payment_proof_url: proofPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updErr) {
    return json({ error: updErr.message || "Failed to save proof" }, 400);
  }

  return json({ ok: true, order_number: order.order_number });
});

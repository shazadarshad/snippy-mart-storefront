import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    let body: { sms_body?: string; sender?: string; max_threshold?: number } = {};
    try {
      body = await req.json();
    } catch {
      /* ignore */
    }

    // 1. If an SMS payload was provided, record it into bank_sms_logs
    if (body.sms_body) {
      const sender = body.sender || "DF-Alert";
      const cleanBody = body.sms_body;

      // Extract amount ignoring trailing balance
      const bodyWithoutBalance = cleanBody.split(/account\s+balance|balance\s*[:-]/i)[0];
      const match = bodyWithoutBalance.match(
        /(?:Inward\s+CEFTS\s+of\s+)?(?:LKR|Rs\.?|SLR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
      );

      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ""));
        if (amount > 0) {
          const refMatch = cleanBody.match(/(?:ref|trx|txn|id)[:\s]*([a-z0-9]+)/i);
          const refNum = refMatch ? refMatch[1] : null;

          await supabase.from("bank_sms_logs").insert({
            sender,
            body: cleanBody,
            amount,
            reference_number: refNum,
          });
        }
      }
    }

    // 2. Call RPC Smart Matcher Function
    const maxLimit = body.max_threshold || 700.0;
    const { data: matches, error } = await supabase.rpc(
      "match_and_auto_approve_orders",
      { p_max_threshold: maxLimit }
    );

    if (error) {
      console.error("[smart-sms-matcher] RPC error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, matches_count: matches?.length || 0, matches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[smart-sms-matcher]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

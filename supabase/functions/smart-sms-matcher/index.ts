import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const databaseUrl = Deno.env.get("SUPABASE_DB_URL") || Deno.env.get("DB_URL");
  if (!databaseUrl) {
    return new Response(JSON.stringify({ error: "No SUPABASE_DB_URL" }), { status: 500, headers: corsHeaders });
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });

  try {
    let body: { sms_body?: string; sender?: string; max_threshold?: number } = {};
    try {
      body = await req.json();
    } catch {
      /* ignore */
    }

    // 1. If an SMS payload was provided, record it into bank_sms_logs
    if (body.sms_body) {
      const sender = body.sender || 'DF-Alert';
      const cleanBody = body.sms_body;

      // Extract amount ignoring trailing balance
      const bodyWithoutBalance = cleanBody.split(/(?i)account balance|balance\s*[:-]/)[0];
      const match = bodyWithoutBalance.match(/(?:Inward\s+CEFTS\s+of\s+)?(?:LKR|Rs\.?|SLR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          // Extract ref
          const refMatch = cleanBody.match(/(?:ref|trx|txn|id)[:\s]*([a-z0-9]+)/i);
          const refNum = refMatch ? refMatch[1] : null;

          // Insert into bank_sms_logs if not already logged
          await sql`
            INSERT INTO public.bank_sms_logs (sender, body, amount, reference_number)
            VALUES (${sender}, ${cleanBody}, ${amount}, ${refNum})
          `;
        }
      }
    }

    // 2. Run RPC Smart Matcher Function
    const maxLimit = body.max_threshold || 700.00;
    const matches = await sql`
      SELECT * FROM public.match_and_auto_approve_orders(${maxLimit})
    `;

    return new Response(JSON.stringify({ ok: true, matches_count: matches.length, matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error('[smart-sms-matcher]', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  } finally {
    await sql.end({ timeout: 5 });
  }
});

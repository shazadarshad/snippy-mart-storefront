import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQL = `
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS card_checkout_url text,
  ADD COLUMN IF NOT EXISTS card_link_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS card_marked_paid_at timestamptz;
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("apikey") || "").trim();
  const jwtRole = (tok: string) => {
    try {
      const payload = tok.split(".")[1];
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      return json.role || null;
    } catch {
      return null;
    }
  };
  const ok =
    (serviceKey && (auth === serviceKey || apikey === serviceKey)) ||
    jwtRole(auth) === "service_role" ||
    jwtRole(apikey) === "service_role";
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const databaseUrl = Deno.env.get("SUPABASE_DB_URL") || Deno.env.get("DB_URL");
  if (!databaseUrl) {
    return new Response(JSON.stringify({ error: "No DB URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    await sql.unsafe(SQL);
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name IN ('card_checkout_url', 'card_link_created_at', 'card_marked_paid_at')
      ORDER BY column_name
    `;
    return new Response(JSON.stringify({ ok: true, columns: cols.map((c: { column_name: string }) => c.column_name) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
});

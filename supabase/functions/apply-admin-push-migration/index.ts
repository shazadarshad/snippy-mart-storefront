/**
 * One-shot: apply admin_push_tokens DDL using SUPABASE_DB_URL (injected on Edge).
 * Safe to call multiple times (IF NOT EXISTS).
 * Invoke with service role Authorization.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SQL = `
CREATE TABLE IF NOT EXISTS public.admin_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_push_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS admin_push_tokens_user_id_idx ON public.admin_push_tokens (user_id);

ALTER TABLE public.admin_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage own push tokens" ON public.admin_push_tokens;
CREATE POLICY "Admins manage own push tokens"
  ON public.admin_push_tokens
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

COMMENT ON TABLE public.admin_push_tokens IS
  'FCM tokens for Snippy Admin Capacitor APK. Does not affect storefront or web admin UX.';
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("apikey") || "").trim();

  function jwtRole(tok: string): string | null {
    try {
      const payload = tok.split(".")[1];
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      return json.role || null;
    } catch {
      return null;
    }
  }

  const ok =
    (serviceKey && (auth === serviceKey || apikey === serviceKey)) ||
    jwtRole(auth) === "service_role" ||
    jwtRole(apikey) === "service_role";

  if (!ok) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        debug: {
          hasServiceEnv: !!serviceKey,
          authLen: auth.length,
          apikeyLen: apikey.length,
          authRole: jwtRole(auth),
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const databaseUrl = Deno.env.get("SUPABASE_DB_URL") || Deno.env.get("DB_URL");
  if (!databaseUrl) {
    return new Response(
      JSON.stringify({
        error: "No SUPABASE_DB_URL in function env — run SQL manually in dashboard",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    await sql.unsafe(SQL);
    const rows = await sql`
      SELECT COUNT(*)::int AS n FROM public.admin_push_tokens
    `;
    return new Response(
      JSON.stringify({ ok: true, table: "admin_push_tokens", rows: rows[0]?.n ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
});

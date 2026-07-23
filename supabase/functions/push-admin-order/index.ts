/**
 * Fire-and-forget FCM push to admin devices (Capacitor APK).
 * Called async from create-order — must never block checkout.
 *
 * Secrets (Supabase function env):
 *   FCM_PROJECT_ID
 *   FCM_SERVICE_ACCOUNT_JSON  — full service account JSON string
 *
 * If secrets are missing, returns 200 { skipped: true } so callers stay healthy.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

type PushBody = {
  order_id?: string;
  order_number?: string;
  customer_name?: string;
  total_amount?: number;
  total_label?: string;
};

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const key = await importPrivateKey(sa.private_key);
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 55),
    },
    key,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`FCM token error: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

async function sendFcm(
  projectId: string,
  accessToken: string,
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title, body },
        data,
        android: {
          priority: "HIGH",
          notification: {
            channel_id: "admin_orders",
            sound: "default",
            default_vibrate_timings: true,
            notification_priority: "PRIORITY_MAX",
          },
        },
      },
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const projectId = Deno.env.get("FCM_PROJECT_ID");
  const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

  if (!supabaseUrl || !serviceKey) {
    return json({ skipped: true, reason: "missing supabase env" });
  }

  // Auth: service role only (create-order fire-and-forget)
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("apikey") || "").trim();
  if (bearer !== serviceKey && apikey !== serviceKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!projectId || !saRaw) {
    console.warn("[push-admin-order] FCM not configured — skip");
    return json({ skipped: true, reason: "fcm_not_configured" });
  }

  let body: PushBody = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saRaw) as ServiceAccount;
  } catch {
    return json({ error: "Invalid FCM_SERVICE_ACCOUNT_JSON" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tokens, error: tokErr } = await admin
    .from("admin_push_tokens")
    .select("id, token");

  if (tokErr) {
    console.error("[push-admin-order] token query", tokErr);
    return json({ error: tokErr.message }, 500);
  }

  if (!tokens?.length) {
    return json({ ok: true, sent: 0, reason: "no_tokens" });
  }

  const num = body.order_number || "New order";
  const name = body.customer_name || "Customer";
  const total =
    body.total_label ||
    (body.total_amount != null
      ? `Rs. ${Number(body.total_amount).toLocaleString()}`
      : "");
  const title = "🛒 New Snippy order";
  const notifBody = `${num} · ${name}${total ? ` · ${total}` : ""}`;

  let accessToken: string;
  try {
    accessToken = await getFcmAccessToken(sa);
  } catch (e) {
    console.error("[push-admin-order] access token", e);
    return json({ error: String(e) }, 500);
  }

  const fcmProject = projectId || sa.project_id || "";
  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    tokens.map(async (row) => {
      try {
        const result = await sendFcm(
          fcmProject,
          accessToken,
          row.token,
          title,
          notifBody,
          {
            url: "/admin/orders",
            order_id: String(body.order_id || ""),
            order_number: String(body.order_number || ""),
          },
        );
        if (result.ok) {
          sent += 1;
        } else {
          console.error("[push-admin-order] FCM fail", row.id, result.status, result.text);
          if (
            result.status === 404 ||
            result.text.includes("UNREGISTERED") ||
            result.text.includes("NOT_FOUND")
          ) {
            stale.push(row.id);
          }
        }
      } catch (e) {
        console.error("[push-admin-order] send error", e);
      }
    }),
  );

  if (stale.length) {
    await admin.from("admin_push_tokens").delete().in("id", stale);
  }

  console.log(`[push-admin-order] sent=${sent}/${tokens.length}`);
  return json({ ok: true, sent, total: tokens.length });
});

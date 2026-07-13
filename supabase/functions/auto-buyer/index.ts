import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CANBOSO_BASE = "https://canboso.com";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBuyerKey(): string | null {
  return (
    Deno.env.get("CANBOSO_BUYER_KEY") ||
    Deno.env.get("BUYER_API_KEY") ||
    null
  );
}

async function canbosoGet(path: string, key: string) {
  const url = `${CANBOSO_BASE}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { success: false, message: text || `Upstream HTTP ${res.status}` };
  }
  return { status: res.status, body };
}

async function canbosoPost(path: string, payload: Record<string, unknown>) {
  const res = await fetch(`${CANBOSO_BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { success: false, message: text || `Upstream HTTP ${res.status}` };
  }
  return { status: res.status, body };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const key = getBuyerKey();
  if (!key) {
    return json(
      {
        success: false,
        message:
          "Buyer API key is not configured. Set CANBOSO_BUYER_KEY secret on the auto-buyer function.",
      },
      500
    );
  }

  try {
    const url = new URL(req.url);
    const action =
      url.searchParams.get("action") ||
      (req.method === "GET" ? "products" : "purchase");

    // ── Products ──
    if (req.method === "GET" && (action === "products" || action === "list")) {
      const { status, body } = await canbosoGet(
        "/api/telegram-buyer/products",
        key
      );
      return json(body, status >= 400 ? status : 200);
    }

    // ── Balance ──
    if (req.method === "GET" && action === "balance") {
      const { status, body } = await canbosoGet(
        "/api/telegram-buyer/balance",
        key
      );
      return json(body, status >= 400 ? status : 200);
    }

    // ── Purchase ──
    if (req.method === "POST" && (action === "purchase" || action === "buy")) {
      let body: Record<string, unknown> = {};
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON body" }, 400);
      }

      const product_id = String(body.product_id || "").trim();
      if (!product_id) {
        return json({ success: false, message: "product_id is required" }, 400);
      }

      let quantity = Number(body.quantity ?? 1);
      if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
      quantity = Math.min(Math.floor(quantity), 100);

      const payload: Record<string, unknown> = {
        key,
        product_id,
        quantity,
      };

      const customer_email = String(body.customer_email || "").trim();
      if (customer_email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
          return json(
            { success: false, message: "Invalid customer_email" },
            400
          );
        }
        payload.customer_email = customer_email;
      }

      if (body.slot_months != null && body.slot_months !== "") {
        const months = Number(body.slot_months);
        if (!Number.isFinite(months) || months < 1) {
          return json(
            { success: false, message: "Invalid slot_months" },
            400
          );
        }
        payload.slot_months = Math.floor(months);
      }

      const { status, body: result } = await canbosoPost(
        "/api/telegram-buyer/purchase",
        payload
      );
      return json(result, status >= 400 ? status : 200);
    }

    return json(
      {
        success: false,
        message:
          "Unknown action. Use GET ?action=products|balance or POST ?action=purchase",
      },
      400
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[auto-buyer]", message);
    return json({ success: false, message }, 500);
  }
});

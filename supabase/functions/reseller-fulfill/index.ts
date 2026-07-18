import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DEFAULT_BASE =
  "https://eismrrkygprctnwxmkbw.supabase.co/functions/v1/reseller-api";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskKey(key: string | null | undefined): string | null {
  if (!key || key.length < 12) return key ? "••••" : null;
  return `${key.slice(0, 10)}…${key.slice(-6)}`;
}

async function requireAdmin(req: Request, supabaseAdmin: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: json({ error: "Missing authorization" }, 401) };

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return { error: json({ error: "Unauthorized" }, 401) };
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !roleRow) {
    return { error: json({ error: "Admin access required" }, 403) };
  }

  return { user };
}

async function getSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseAdmin
    .from("reseller_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  return (
    data ?? {
      id: 1,
      api_key: null,
      base_url: DEFAULT_BASE,
      is_enabled: false,
      auto_deliver_on_processing: true,
      auto_complete_on_success: true,
      usd_to_lkr: 360,
      markup_percent: 50,
      pricing_mode: "smart",
      min_profit_lkr: 200,
    }
  );
}

async function callResellerApi(
  baseUrl: string,
  apiKey: string,
  method: "GET" | "POST",
  action: string,
  query: Record<string, string> = {},
  body?: unknown,
) {
  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: method === "POST" && body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    ok: res.ok,
    status: res.status,
    data: parsed,
    rateLimit: {
      limit: res.headers.get("X-RateLimit-Limit"),
      remaining: res.headers.get("X-RateLimit-Remaining"),
    },
  };
}

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  products?: {
    id: string;
    name: string;
    reseller_product_id: string | null;
    manual_fulfillment?: boolean | null;
  } | null;
};

/** True if payload has a real code/link/login customers can use */
function extractUsableDelivery(payload: any): string | null {
  if (payload == null) return null;
  if (typeof payload === "string") {
    const t = payload.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof payload !== "object") {
    const t = String(payload).trim();
    return t.length > 0 ? t : null;
  }

  const pick = (v: unknown): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t.length > 0 ? t : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      const nested: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(o)) {
        if (val == null || typeof val === "object") continue;
        nested[k] = val;
      }
      if (Object.keys(nested).length === 0) return null;
      try {
        return JSON.stringify(nested);
      } catch {
        return null;
      }
    }
    return null;
  };

  const keys = [
    "data",
    "delivered_data",
    "delivery",
    "code",
    "codes",
    "coupon",
    "credentials",
    "account",
    "result",
    "login",
    "email",
    "password",
    "link",
    "url",
    "redeem_link",
  ];
  for (const k of keys) {
    const got = pick(payload[k]);
    if (got) return got;
  }

  const useful: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (/^(status|success|ok|order_id|vendor_order_id|amount|idempotent|message|error|raw)$/i.test(k)) {
      continue;
    }
    if (v == null || typeof v === "object") continue;
    const s = String(v).trim();
    if (s) useful[k] = s;
  }
  if (Object.keys(useful).length > 0) {
    try {
      return JSON.stringify(useful);
    } catch {
      /* fall through */
    }
  }
  return null;
}

async function deliverOrder(
  supabaseAdmin: ReturnType<typeof createClient>,
  orderId: string,
  options: { force?: boolean; bypassEnabled?: boolean } = {},
) {
  const settings = await getSettings(supabaseAdmin);

  if (!settings.api_key) {
    return {
      success: false,
      error: "Reseller API key not configured. Save your key under Admin → Reseller API.",
    };
  }

  // is_enabled gates normal automation. Admin actions pass bypassEnabled.
  // force also bypasses and re-orders already-delivered lines (use carefully).
  if (!settings.is_enabled && !options.force && !options.bypassEnabled) {
    return {
      success: false,
      error:
        "Reseller API is disabled in settings. Turn ON “Enable auto-delivery” under Admin → Reseller API and click Save — or use Deliver again (admin bypass).",
      delivered: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  const baseUrl = settings.base_url || DEFAULT_BASE;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      customer_email,
      customer_name,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        products (
          id,
          name,
          reseller_product_id,
          manual_fulfillment
        )
      )
    `,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Order not found" };
  }

  const items = (order.order_items || []) as OrderItemRow[];

  const results: Array<Record<string, unknown>> = [];
  let deliveredCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  /** True if any line still needs inventory / manual admin work */
  let hasManualLines = false;

  for (const item of items) {
    let resellerProductId = item.products?.reseller_product_id ?? null;
    let manualFulfillment = item.products?.manual_fulfillment;

    if ((!resellerProductId || manualFulfillment == null) && item.product_id) {
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("reseller_product_id, manual_fulfillment")
        .eq("id", item.product_id)
        .maybeSingle();
      if (!resellerProductId) resellerProductId = prod?.reseller_product_id ?? null;
      if (manualFulfillment == null) manualFulfillment = prod?.manual_fulfillment;
    }

    // Inventory / manual products stay for admin — do not auto-complete order later
    if (!resellerProductId && manualFulfillment !== false) {
      hasManualLines = true;
    }

    if (!resellerProductId) {
      skippedCount++;
      results.push({
        order_item_id: item.id,
        product_name: item.product_name,
        status: "skipped",
        reason: "No reseller_product_id mapped",
      });
      continue;
    }

    const externalOrderId = `${order.order_number}:${item.id}`;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    // Skip if already successfully delivered with real payload (unless force)
    if (!options.force) {
      const { data: existing } = await supabaseAdmin
        .from("reseller_deliveries")
        .select("id, status, delivered_data, vendor_order_id, amount, idempotent_replay")
        .eq("external_order_id", externalOrderId)
        .eq("status", "delivered")
        .maybeSingle();

      if (existing && String(existing.delivered_data || "").trim()) {
        deliveredCount++;
        results.push({
          order_item_id: item.id,
          product_name: item.product_name,
          status: "already_delivered",
          vendor_order_id: existing.vendor_order_id,
          delivered_data: existing.delivered_data,
          amount: existing.amount,
        });
        continue;
      }
    }

    const apiResult = await callResellerApi(
      baseUrl,
      settings.api_key,
      "POST",
      "order",
      {},
      {
        product_id: resellerProductId,
        quantity,
        external_order_id: externalOrderId,
      },
    );

    const payload = apiResult.data ?? {};
    const deliveredData = extractUsableDelivery(payload);

    const apiLooksOk =
      apiResult.ok &&
      (payload.status === "delivered" ||
        payload.status === "success" ||
        payload.success === true ||
        deliveredData != null ||
        !!payload.order_id);

    const vendorOrderId = payload.order_id ?? payload.vendor_order_id ?? null;
    const amount = payload.amount != null ? Number(payload.amount) : null;
    const idempotentReplay = !!payload.idempotent_replay;

    // Real success = usable customer payload only (never empty / junk-only)
    if (apiLooksOk && deliveredData) {
      const row = {
        order_id: order.id,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        reseller_product_id: resellerProductId,
        external_order_id: externalOrderId,
        vendor_order_id: vendorOrderId != null ? String(vendorOrderId) : null,
        delivered_data: deliveredData,
        amount,
        status: "delivered" as const,
        error_message: null,
        idempotent_replay: idempotentReplay,
        raw_response: payload,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabaseAdmin
        .from("reseller_deliveries")
        .upsert(row, { onConflict: "external_order_id" });

      if (upsertError) {
        failedCount++;
        results.push({
          order_item_id: item.id,
          product_name: item.product_name,
          status: "failed",
          error: `Delivered but failed to save: ${upsertError.message}`,
          raw: payload,
        });
        continue;
      }

      deliveredCount++;
      results.push({
        order_item_id: item.id,
        product_name: item.product_name,
        status: "delivered",
        vendor_order_id: vendorOrderId,
        delivered_data: deliveredData,
        amount,
        idempotent_replay: idempotentReplay,
      });
    } else {
      const errMsg = !apiResult.ok
        ? payload?.error ||
          payload?.message ||
          (apiResult.status === 402
            ? "Insufficient balance on reseller panel"
            : apiResult.status === 409
              ? "Out of stock or conflict"
              : apiResult.status === 429
                ? "Rate limit exceeded"
                : apiResult.status === 401
                  ? "Invalid or revoked API key"
                  : `Reseller API error (${apiResult.status})`)
        : "Panel accepted the order but returned no code, link, or login. Retry Deliver or contact the seller panel.";

      const failRow = {
        order_id: order.id,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        reseller_product_id: resellerProductId,
        external_order_id: externalOrderId,
        vendor_order_id: vendorOrderId != null ? String(vendorOrderId) : null,
        delivered_data: null,
        amount: null,
        status: "failed" as const,
        error_message: String(errMsg),
        idempotent_replay: false,
        raw_response: payload,
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin
        .from("reseller_deliveries")
        .upsert(failRow, { onConflict: "external_order_id" });

      failedCount++;
      results.push({
        order_item_id: item.id,
        product_name: item.product_name,
        status: "failed",
        error: errMsg,
        http_status: apiResult.status,
        raw: payload,
      });
    }
  }

  // Auto-complete only when EVERY reseller line delivered AND no manual inventory remains
  let orderStatus = order.status;
  const mappedAttempted = items.length - skippedCount;

  const canAutoComplete =
    settings.auto_complete_on_success &&
    mappedAttempted > 0 &&
    failedCount === 0 &&
    deliveredCount >= mappedAttempted &&
    !hasManualLines;

  if (canAutoComplete) {
    const deliveredLines = results
      .filter((r) => r.status === "delivered" || r.status === "already_delivered")
      .map((r) => {
        const data = r.delivered_data != null ? String(r.delivered_data) : "(see Track Order)";
        const short = data.length > 120 ? data.slice(0, 120) + "…" : data;
        return `• ${r.product_name}: ${short}${r.vendor_order_id ? ` (${r.vendor_order_id})` : ""}`;
      });

    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("notes")
      .eq("id", order.id)
      .single();

    const stamp = `\n\n[Reseller auto-delivery ${new Date().toISOString()}]\n${deliveredLines.join("\n")}`;
    const notes = ((currentOrder?.notes || "") + stamp).trim();

    const { error: statusError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (!statusError) {
      orderStatus = "completed";

      try {
        await supabaseAdmin.functions.invoke("handle-order-status-change", {
          body: {
            order: {
              ...order,
              status: "completed",
              notes,
            },
            old_order: { ...order, status: order.status },
            custom_message:
              "Your Auto product has been delivered. Open Track Order with your Order ID to view codes, links, or logins.",
          },
        });
      } catch (e) {
        console.error("[reseller-fulfill] email notify failed", e);
      }
    }
  } else if (
    settings.auto_complete_on_success &&
    mappedAttempted > 0 &&
    failedCount === 0 &&
    deliveredCount >= mappedAttempted &&
    hasManualLines
  ) {
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("notes")
      .eq("id", order.id)
      .single();
    const stamp =
      `\n\n[Reseller auto-delivery ${new Date().toISOString()}] Auto items delivered; order left in progress (manual items remain).`;
    await supabaseAdmin
      .from("orders")
      .update({
        notes: ((currentOrder?.notes || "") + stamp).trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  return {
    success: failedCount === 0 && deliveredCount > 0,
    order_id: order.id,
    order_number: order.order_number,
    order_status: orderStatus,
    delivered: deliveredCount,
    failed: failedCount,
    skipped: skippedCount,
    results,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase env vars" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }

    const url = new URL(req.url);
    const action = String(body.action || url.searchParams.get("action") || "");

    // deliver_order can be triggered by admin UI or internal service after status change
    const internalSecret = Deno.env.get("RESELLER_INTERNAL_SECRET");
    const isInternal =
      internalSecret &&
      req.headers.get("x-reseller-internal") === internalSecret;

    if (!isInternal) {
      const auth = await requireAdmin(req, supabaseAdmin);
      if (auth.error) return auth.error;
    }

    // ---- settings ----
    if (action === "get_settings") {
      const s = await getSettings(supabaseAdmin);
      return json({
        base_url: s.base_url || DEFAULT_BASE,
        is_enabled: !!s.is_enabled,
        auto_deliver_on_processing: s.auto_deliver_on_processing !== false,
        auto_complete_on_success: s.auto_complete_on_success !== false,
        has_api_key: !!s.api_key,
        api_key_preview: maskKey(s.api_key),
        usd_to_lkr: Number(s.usd_to_lkr) > 0 ? Number(s.usd_to_lkr) : 360,
        markup_percent:
          s.markup_percent != null && Number.isFinite(Number(s.markup_percent))
            ? Number(s.markup_percent)
            : 50,
        pricing_mode: s.pricing_mode === "fixed" ? "fixed" : "smart",
        min_profit_lkr:
          s.min_profit_lkr != null && Number.isFinite(Number(s.min_profit_lkr))
            ? Number(s.min_profit_lkr)
            : 200,
      });
    }

    if (action === "save_settings") {
      const current = await getSettings(supabaseAdmin);
      const nextKey =
        typeof body.api_key === "string" && body.api_key.trim()
          ? body.api_key.trim()
          : current.api_key;

      const usdToLkrRaw = body.usd_to_lkr != null ? Number(body.usd_to_lkr) : Number(current.usd_to_lkr);
      const markupRaw =
        body.markup_percent != null ? Number(body.markup_percent) : Number(current.markup_percent);
      const minProfitRaw =
        body.min_profit_lkr != null ? Number(body.min_profit_lkr) : Number(current.min_profit_lkr);
      const pricingMode =
        body.pricing_mode === "fixed" || body.pricing_mode === "smart"
          ? body.pricing_mode
          : current.pricing_mode === "fixed"
            ? "fixed"
            : "smart";

      const payload = {
        id: 1,
        api_key: nextKey,
        base_url:
          typeof body.base_url === "string" && body.base_url.trim()
            ? body.base_url.trim()
            : current.base_url || DEFAULT_BASE,
        is_enabled: body.is_enabled != null ? !!body.is_enabled : !!current.is_enabled,
        auto_deliver_on_processing:
          body.auto_deliver_on_processing != null
            ? !!body.auto_deliver_on_processing
            : current.auto_deliver_on_processing !== false,
        auto_complete_on_success:
          body.auto_complete_on_success != null
            ? !!body.auto_complete_on_success
            : current.auto_complete_on_success !== false,
        usd_to_lkr: Number.isFinite(usdToLkrRaw) && usdToLkrRaw > 0 ? usdToLkrRaw : 360,
        markup_percent: Number.isFinite(markupRaw) && markupRaw >= 0 ? markupRaw : 50,
        pricing_mode: pricingMode,
        min_profit_lkr: Number.isFinite(minProfitRaw) && minProfitRaw >= 0 ? minProfitRaw : 200,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from("reseller_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) return json({ error: error.message }, 400);

      return json({
        success: true,
        has_api_key: !!payload.api_key,
        api_key_preview: maskKey(payload.api_key),
        base_url: payload.base_url,
        is_enabled: payload.is_enabled,
        auto_deliver_on_processing: payload.auto_deliver_on_processing,
        auto_complete_on_success: payload.auto_complete_on_success,
        usd_to_lkr: payload.usd_to_lkr,
        markup_percent: payload.markup_percent,
        pricing_mode: payload.pricing_mode,
        min_profit_lkr: payload.min_profit_lkr,
      });
    }

    // ---- proxy actions (need key) ----
    if (["balance", "products", "stock", "vendor_orders"].includes(action)) {
      const s = await getSettings(supabaseAdmin);
      if (!s.api_key) return json({ error: "API key not configured" }, 400);

      const baseUrl = s.base_url || DEFAULT_BASE;

      if (action === "balance") {
        const r = await callResellerApi(baseUrl, s.api_key, "GET", "balance");
        return json(
          { ok: r.ok, status: r.status, data: r.data, rateLimit: r.rateLimit },
          r.ok ? 200 : r.status || 400,
        );
      }

      if (action === "products") {
        const r = await callResellerApi(baseUrl, s.api_key, "GET", "products");
        return json(
          { ok: r.ok, status: r.status, data: r.data, rateLimit: r.rateLimit },
          r.ok ? 200 : r.status || 400,
        );
      }

      if (action === "stock") {
        const productId = String(body.product_id || url.searchParams.get("product_id") || "");
        if (!productId) return json({ error: "product_id required" }, 400);
        const r = await callResellerApi(baseUrl, s.api_key, "GET", "stock", {
          product_id: productId,
        });
        return json(
          { ok: r.ok, status: r.status, data: r.data, rateLimit: r.rateLimit },
          r.ok ? 200 : r.status || 400,
        );
      }

      if (action === "vendor_orders") {
        const limit = String(body.limit || url.searchParams.get("limit") || "50");
        const offset = String(body.offset || url.searchParams.get("offset") || "0");
        const r = await callResellerApi(baseUrl, s.api_key, "GET", "orders", {
          limit,
          offset,
        });
        return json(
          { ok: r.ok, status: r.status, data: r.data, rateLimit: r.rateLimit },
          r.ok ? 200 : r.status || 400,
        );
      }
    }

    if (action === "deliver_order") {
      const orderId = String(body.order_id || "");
      if (!orderId) return json({ error: "order_id required" }, 400);
      const result = await deliverOrder(supabaseAdmin, orderId, {
        force: !!body.force,
        // Admin UI / status→processing may bypass the is_enabled toggle when a key exists
        bypassEnabled: !!body.bypass_enabled || !!body.bypassEnabled,
      });
      // Always 200 with structured body so the client can show per-item errors
      // (non-2xx often strips JSON in supabase-js)
      const http =
        result.success || (result.delivered && result.delivered > 0) || result.results
          ? 200
          : result.error && !result.results
            ? 400
            : 200;
      return json(result, http);
    }

    if (action === "list_deliveries") {
      const limit = Math.min(Number(body.limit) || 50, 200);
      const { data, error } = await supabaseAdmin
        .from("reseller_deliveries")
        .select(
          "id, order_id, product_name, vendor_order_id, delivered_data, amount, status, error_message, external_order_id, created_at, orders(order_number)",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return json({ error: error.message }, 400);
      return json({ deliveries: data });
    }

    return json(
      {
        error: "Unknown action",
        actions: [
          "get_settings",
          "save_settings",
          "balance",
          "products",
          "stock",
          "vendor_orders",
          "deliver_order",
          "list_deliveries",
        ],
      },
      400,
    );
  } catch (e: any) {
    console.error("[reseller-fulfill]", e);
    return json({ error: e?.message || "Internal error" }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
const CANBOSO_BASE = "https://canboso.com";
const AKUNDING_BASE = "https://akunding.shop/api";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function getCanbosoKey() {
  return Deno.env.get("CANBOSO_BUYER_KEY") || Deno.env.get("BUYER_API_KEY") || null;
}
function getAkundingKey() {
  return Deno.env.get("AKUNDING_API_KEY") || Deno.env.get("AKUNDING_RESELLER_KEY") || null;
}
async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch  {
    return {
      success: false,
      message: text || `Upstream HTTP ${res.status}`,
      raw: text
    };
  }
}
// ─── Canboso ───────────────────────────────────────────────
async function canbosoGet(path, key) {
  const url = `${CANBOSO_BASE}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });
  return {
    status: res.status,
    body: await parseJsonResponse(res)
  };
}
async function canbosoPost(path, payload) {
  const res = await fetch(`${CANBOSO_BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return {
    status: res.status,
    body: await parseJsonResponse(res)
  };
}
function mapCanbosoProduct(p) {
  const rawId = String(p._id ?? p.id ?? "");
  if (!rawId) return null;
  const stats = p.stats && typeof p.stats === "object" ? p.stats : {};
  return {
    ...p,
    _id: `canboso:${rawId}`,
    provider: "canboso",
    provider_product_id: rawId,
    product_name: String(p.product_name ?? p.name ?? "Product"),
    description: p.description ?? "",
    usdPricing: num(p.usdPricing ?? p.walletPricing ?? p.pricing),
    walletPricing: num(p.walletPricing ?? p.usdPricing),
    walletCurrency: p.walletCurrency ?? "USD",
    stats: {
      total: num(stats.total),
      sold: num(stats.sold),
      available: num(stats.available ?? stats.stock)
    },
    emoji: p.emoji,
    descriptionImage: p.descriptionImage,
    displayOrder: num(p.displayOrder, 999),
    isSlotProduct: !!p.isSlotProduct,
    requiresCustomerEmail: !!p.requiresCustomerEmail,
    requiresSlotMonths: !!p.requiresSlotMonths,
    slotDurations: Array.isArray(p.slotDurations) ? p.slotDurations : undefined,
    promotions: p.promotions,
    marketPromotions: p.marketPromotions
  };
}
// ─── Akunding ──────────────────────────────────────────────
async function akundingFetch(path, key, init) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${key}`
  };
  if (init?.body !== undefined) headers["Content-Type"] = "application/json";
  if (init?.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;
  const res = await fetch(`${AKUNDING_BASE}${path}`, {
    method: init?.method || "GET",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined
  });
  return {
    status: res.status,
    body: await parseJsonResponse(res)
  };
}
function num(v, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function firstString(...vals) {
  for (const v of vals){
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}
/** Map Akunding product object → unified auto product (field names vary). */ function mapAkundingProduct(p) {
  const rawId = p.id ?? p.product_id ?? p.productId;
  if (rawId == null || rawId === "") return null;
  const idStr = String(rawId);
  const name = firstString(p.name, p.title, p.product_name, p.productName, `Product ${idStr}`);
  const descriptionParts = [
    firstString(p.description, p.desc, p.details, p.note, p.content),
    firstString(p.features, p.feature)
  ].filter(Boolean);
  const description = descriptionParts.join("\n\n");
  const unitLabel = firstString(p.unit_label, p.unitLabel, p.unit);
  // Akunding uses base_price in USD; also accept common aliases
  let usd = num(p.base_price ?? p.price_usd ?? p.usd_price ?? p.usdPricing ?? p.usd ?? p.unit_price ?? p.price ?? p.amount ?? p.cost ?? p.sell_price);
  if (p.price_usd_cents != null && num(p.price_usd_cents) > 0 && usd === num(p.price_usd_cents)) {
    usd = num(p.price_usd_cents) / 100;
  }
  // Heuristic: huge numbers without explicit USD field → VND-ish
  if (usd >= 1000 && p.base_price == null && p.price_usd == null) {
    usd = usd / 25000;
  }
  const available = num(p.stock ?? p.available ?? p.quantity_available ?? p.qty ?? p.inventory ?? p.remaining ?? p.available_stock ?? p.stats?.available);
  const total = num(p.total ?? p.total_stock ?? available);
  // Bulk tiers → promotion-style badges for UI
  const bulk = Array.isArray(p.bulk_tiers) ? p.bulk_tiers : [];
  const promotions = bulk.map((t)=>{
    if (!t || typeof t !== "object") return null;
    const row = t;
    return {
      type: "bulk_price",
      minQty: num(row.min_qty ?? row.minQty),
      unitPrice: num(row.unit_price ?? row.unitPrice ?? row.price)
    };
  }).filter(Boolean);
  return {
    _id: `akunding:${idStr}`,
    provider: "akunding",
    provider_product_id: idStr,
    product_name: name,
    description,
    usdPricing: Math.round(usd * 10000) / 10000,
    walletPricing: Math.round(usd * 10000) / 10000,
    walletCurrency: "USD",
    walletPricingText: `$${usd.toFixed(2)}`,
    unit_label: unitLabel || undefined,
    stats: {
      total,
      sold: Math.max(0, total - available),
      available
    },
    descriptionImage: firstString(p.image, p.image_url, p.thumbnail, p.icon) || undefined,
    displayOrder: num(p.display_order ?? p.sort_order ?? p.position, 500),
    isSlotProduct: false,
    requiresCustomerEmail: !!(p.requires_email ?? p.require_email),
    emoji: firstString(p.emoji, p.category) || "akunding",
    promotions: promotions.length ? promotions : p.promotions,
    bulk_tiers: bulk.length ? bulk : undefined
  };
}
function normalizeDeliveredFromAkunding(orderBody) {
  const out = [];
  if (!orderBody || typeof orderBody !== "object") return out;
  const o = orderBody;
  const pushLine = (line, idx)=>{
    const t = line.trim();
    if (!t) return;
    // email:pass or user|pass
    const parts = t.split(/[:|]/);
    if (parts.length >= 2) {
      out.push({
        user: parts[0].trim(),
        password: parts.slice(1).join(":").trim(),
        deliveredAt: new Date().toISOString(),
        productItemId: `ak-${idx}`
      });
    } else {
      out.push({
        user: t,
        deliveredAt: new Date().toISOString(),
        productItemId: `ak-${idx}`
      });
    }
  };
  // Common shapes
  const accounts = o.accounts ?? o.items ?? o.delivered ?? o.licenses ?? o.codes ?? o.data;
  if (Array.isArray(accounts)) {
    accounts.forEach((item, i)=>{
      if (typeof item === "string") pushLine(item, i);
      else if (item && typeof item === "object") {
        const r = item;
        out.push({
          user: firstString(r.user, r.username, r.email, r.account, r.login, r.code, r.key),
          password: firstString(r.password, r.pass, r.pwd, r.secret),
          verifyEmail: firstString(r.recovery, r.verifyEmail, r.email2),
          deliveredAt: firstString(r.deliveredAt, r.created_at) || new Date().toISOString(),
          productItemId: firstString(r.id, r.item_id) || `ak-${i}`,
          raw: r
        });
      }
    });
  }
  if (typeof o.content === "string") {
    o.content.split(/\r?\n/).forEach((line, i)=>pushLine(line, i));
  }
  if (typeof o.export === "string") {
    o.export.split(/\r?\n/).forEach((line, i)=>pushLine(line, 1000 + i));
  }
  if (typeof o.result === "string") {
    o.result.split(/\r?\n/).forEach((line, i)=>pushLine(line, 2000 + i));
  }
  // If still empty, stash whole order for admin
  if (out.length === 0) {
    out.push({
      user: JSON.stringify(o).slice(0, 2000),
      password: "",
      deliveredAt: new Date().toISOString(),
      productItemId: "ak-raw"
    });
  }
  return out;
}
function parseProviderId(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (s.startsWith("canboso:")) return {
    provider: "canboso",
    id: s.slice("canboso:".length)
  };
  if (s.startsWith("akunding:")) return {
    provider: "akunding",
    id: s.slice("akunding:".length)
  };
  // Legacy canboso mongo ids (24 hex) without prefix
  if (/^[a-f0-9]{24}$/i.test(s)) return {
    provider: "canboso",
    id: s
  };
  // Pure integer → akunding
  if (/^\d+$/.test(s)) return {
    provider: "akunding",
    id: s
  };
  return {
    provider: "canboso",
    id: s
  };
}
// ─── Handler ───────────────────────────────────────────────
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (req.method === "GET" ? "products" : "purchase");
    const canbosoKey = getCanbosoKey();
    const akundingKey = getAkundingKey();
    // ── Products (merged) ──
    if (req.method === "GET" && (action === "products" || action === "list")) {
      const products = [];
      const providers = {};
      // Canboso
      if (canbosoKey) {
        try {
          const { status, body } = await canbosoGet("/api/telegram-buyer/products", canbosoKey);
          const b = body;
          if (status < 400 && Array.isArray(b.products)) {
            for (const raw of b.products){
              if (raw && typeof raw === "object") {
                const mapped = mapCanbosoProduct(raw);
                if (mapped) products.push(mapped);
              }
            }
            providers.canboso = {
              ok: true,
              count: b.products.length,
              walletCurrency: b.walletCurrency
            };
          } else {
            providers.canboso = {
              ok: false,
              message: b.message || `HTTP ${status}`
            };
          }
        } catch (e) {
          providers.canboso = {
            ok: false,
            message: e instanceof Error ? e.message : "Canboso fetch failed"
          };
        }
      } else {
        providers.canboso = {
          ok: false,
          message: "CANBOSO_BUYER_KEY not set"
        };
      }
      // Akunding
      if (akundingKey) {
        try {
          const { status, body } = await akundingFetch("/v1/products", akundingKey);
          let list = [];
          if (Array.isArray(body)) list = body;
          else if (body && typeof body === "object") {
            const b = body;
            if (Array.isArray(b.products)) list = b.products;
            else if (Array.isArray(b.data)) list = b.data;
            else if (Array.isArray(b.items)) list = b.items;
          }
          if (status < 400) {
            let n = 0;
            for (const raw of list){
              if (raw && typeof raw === "object") {
                const mapped = mapAkundingProduct(raw);
                if (mapped) {
                  products.push(mapped);
                  n++;
                }
              }
            }
            providers.akunding = {
              ok: true,
              count: n
            };
          } else {
            const b = body;
            providers.akunding = {
              ok: false,
              message: b.detail || b.message || `HTTP ${status}`
            };
          }
        } catch (e) {
          providers.akunding = {
            ok: false,
            message: e instanceof Error ? e.message : "Akunding fetch failed"
          };
        }
      } else {
        providers.akunding = {
          ok: false,
          message: "AKUNDING_API_KEY not set"
        };
      }
      return json({
        success: true,
        products,
        providers,
        count: products.length
      });
    }
    // ── Balance (both) ──
    if (req.method === "GET" && action === "balance") {
      const result = {
        success: true,
        providers: {}
      };
      if (canbosoKey) {
        try {
          const { status, body } = await canbosoGet("/api/telegram-buyer/balance", canbosoKey);
          result.providers.canboso = status < 400 ? body : {
            success: false,
            body
          };
        } catch (e) {
          result.providers.canboso = {
            success: false,
            message: e instanceof Error ? e.message : "fail"
          };
        }
      }
      if (akundingKey) {
        try {
          const { status, body } = await akundingFetch("/v1/me", akundingKey);
          result.providers.akunding = status < 400 ? body : {
            success: false,
            body
          };
        } catch (e) {
          result.providers.akunding = {
            success: false,
            message: e instanceof Error ? e.message : "fail"
          };
        }
      }
      return json(result);
    }
    // ── Purchase ──
    if (req.method === "POST" && (action === "purchase" || action === "buy")) {
      let body = {};
      try {
        body = await req.json();
      } catch  {
        return json({
          success: false,
          message: "Invalid JSON body"
        }, 400);
      }
      const parsed = parseProviderId(String(body.product_id || body.provider_product_id || ""));
      if (!parsed) {
        return json({
          success: false,
          message: "product_id is required"
        }, 400);
      }
      const provider = body.provider || parsed.provider;
      const productId = parsed.id;
      let quantity = Number(body.quantity ?? 1);
      if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
      quantity = Math.min(Math.floor(quantity), 100);
      if (provider === "canboso") {
        if (!canbosoKey) {
          return json({
            success: false,
            message: "Canboso key not configured"
          }, 500);
        }
        const payload = {
          key: canbosoKey,
          product_id: productId,
          quantity
        };
        const customer_email = String(body.customer_email || "").trim();
        if (customer_email) payload.customer_email = customer_email;
        if (body.slot_months != null && body.slot_months !== "") {
          payload.slot_months = Math.floor(Number(body.slot_months));
        }
        const { status, body: result } = await canbosoPost("/api/telegram-buyer/purchase", payload);
        const r = result;
        return json({
          ...r,
          provider: "canboso",
          success: r.success !== false && status < 400
        }, status >= 400 ? status : 200);
      }
      if (provider === "akunding") {
        if (!akundingKey) {
          return json({
            success: false,
            message: "Akunding key not configured"
          }, 500);
        }
        const pid = Number(productId);
        if (!Number.isFinite(pid) || pid < 1) {
          return json({
            success: false,
            message: "Invalid Akunding product_id"
          }, 400);
        }
        const idem = String(body.idempotency_key || body.idempotencyKey || "").trim() || crypto.randomUUID();
        const { status, body: result } = await akundingFetch("/v1/orders", akundingKey, {
          method: "POST",
          body: {
            product_id: pid,
            quantity
          },
          idempotencyKey: idem
        });
        if (status >= 400) {
          const r = result;
          return json({
            success: false,
            provider: "akunding",
            message: r.detail || r.message || `Akunding order failed (HTTP ${status})`,
            raw: result
          }, status);
        }
        const r = result;
        const orderId = r.id ?? r.order_id ?? r.orderId;
        // Try export for plain-text credentials
        let exportText = "";
        if (orderId != null) {
          try {
            const exp = await akundingFetch(`/v1/orders/${orderId}/export?format=txt`, akundingKey);
            if (exp.status < 400) {
              if (typeof exp.body === "string") exportText = exp.body;
              else if (exp.body && typeof exp.body === "object") {
                const eb = exp.body;
                exportText = firstString(eb.content, eb.data, eb.export, eb.text);
              }
            }
          } catch  {
          /* optional */ }
        }
        let delivered = normalizeDeliveredFromAkunding(result);
        if (exportText) {
          const fromExport = exportText.split(/\r?\n/).map((l)=>l.trim()).filter(Boolean).map((line, i)=>{
            const parts = line.split(/[:|]/);
            if (parts.length >= 2) {
              return {
                user: parts[0].trim(),
                password: parts.slice(1).join(":").trim(),
                deliveredAt: new Date().toISOString(),
                productItemId: `ak-export-${i}`
              };
            }
            return {
              user: line,
              password: "",
              deliveredAt: new Date().toISOString(),
              productItemId: `ak-export-${i}`
            };
          });
          if (fromExport.length) delivered = fromExport;
        }
        return json({
          success: true,
          provider: "akunding",
          orderCode: orderId != null ? String(orderId) : idem,
          productType: firstString(r.product_name, r.productName, "Akunding product"),
          quantity,
          finalQuantity: quantity,
          amount: r.amount ?? r.total ?? r.price,
          amountText: r.amount_text ?? r.total_text,
          deliveredAccounts: delivered,
          raw: result,
          export: exportText || undefined
        });
      }
      return json({
        success: false,
        message: `Unknown provider: ${provider}`
      }, 400);
    }
    return json({
      success: false,
      message: "Unknown action. Use GET ?action=products|balance or POST ?action=purchase"
    }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[auto-buyer]", message);
    return json({
      success: false,
      message
    }, 500);
  }
});

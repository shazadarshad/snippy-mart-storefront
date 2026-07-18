import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildCustomerFacingProduct } from '@/lib/resellerProductCopy';

/** Default API $ → cost LKR (panel still deducts USD) */
export const RESELLER_USD_TO_LKR = 360;

/** Only used when pricing_mode = fixed */
export const RESELLER_DEFAULT_MARKUP_PERCENT = 50;

/** Minimum profit in LKR so tiny items still make sense */
export const RESELLER_DEFAULT_MIN_PROFIT_LKR = 200;

export type ResellerPricingMode = 'smart' | 'fixed';

/**
 * Smart tiers: cheaper products need higher %; expensive ones use lower %.
 * upToCostLkr = apply this markup when cost_lkr is <= this (ordered ascending).
 * Last tier should use a huge upTo (Infinity handled as 1e12).
 */
export type MarkupTier = Array<{ upToCostLkr: number; markupPercent: number }>;

export const DEFAULT_SMART_TIERS: MarkupTier = [
  { upToCostLkr: 400, markupPercent: 100 }, // cost 300 → +100% → 600 (+ min profit)
  { upToCostLkr: 800, markupPercent: 75 }, // cost 500 → +75% → 875
  { upToCostLkr: 1500, markupPercent: 55 }, // cost 1200 → +55%
  { upToCostLkr: 3000, markupPercent: 40 },
  { upToCostLkr: 6000, markupPercent: 28 },
  { upToCostLkr: 1e12, markupPercent: 18 }, // expensive: thinner margin
];

export function markupPercentForCostLkr(
  costLkr: number,
  tiers: MarkupTier = DEFAULT_SMART_TIERS,
): number {
  const sorted = [...tiers].sort((a, b) => a.upToCostLkr - b.upToCostLkr);
  for (const t of sorted) {
    if (costLkr <= t.upToCostLkr) return t.markupPercent;
  }
  return sorted[sorted.length - 1]?.markupPercent ?? 20;
}

/**
 * Charm price ending in 99 (LKR, no cents).
 * Examples: 368 → 399, 400 → 499, 99 → 99, 1 → 99, 1200 → 1299
 */
export function roundSellLkr(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const n = Math.ceil(amount);
  if (n <= 99) return 99;
  // Already a .99 price
  if (n % 100 === 99) return n;
  // Jump up to this hundred's 99, or next if already past it
  // 368 → floor(368/100)=3 → 399
  // 400 → floor(400/100)=4 → 499
  // 301 → 399
  const bucket = Math.floor(n / 100);
  const candidate = bucket * 100 + 99;
  if (candidate >= n) return candidate;
  return (bucket + 1) * 100 + 99;
}

export type ApiPriceOpts = {
  rate?: number;
  /** smart (tiered) or fixed single % */
  pricingMode?: ResellerPricingMode;
  /** used only in fixed mode */
  markupPercent?: number;
  minProfitLkr?: number;
  tiers?: MarkupTier;
};

/**
 * cost_lkr = usd × rate
 * SMART: markup % depends on cost band + min profit floor + round to xx99
 * FIXED: single markup % (legacy)
 * Panel still only deducts API $ — margin is yours.
 * You can override products.price anytime in Admin (custom customer price).
 */
export function calcApiCustomerPriceLkr(
  costUsd: number,
  opts?: ApiPriceOpts,
): {
  costLkr: number;
  sellLkr: number;
  profitLkr: number;
  markupPercent: number;
  pricingMode: ResellerPricingMode;
} {
  const rate = opts?.rate ?? RESELLER_USD_TO_LKR;
  const mode: ResellerPricingMode = opts?.pricingMode === 'fixed' ? 'fixed' : 'smart';
  const minProfit = opts?.minProfitLkr ?? RESELLER_DEFAULT_MIN_PROFIT_LKR;
  const usd = Number(costUsd);

  if (!Number.isFinite(usd) || usd <= 0) {
    return { costLkr: 0, sellLkr: 0, profitLkr: 0, markupPercent: 0, pricingMode: mode };
  }

  const costLkr = Math.round(usd * rate);

  let markup: number;
  if (mode === 'fixed') {
    markup = opts?.markupPercent ?? RESELLER_DEFAULT_MARKUP_PERCENT;
  } else {
    markup = markupPercentForCostLkr(costLkr, opts?.tiers ?? DEFAULT_SMART_TIERS);
  }

  const fromPercent = costLkr * (1 + Number(markup) / 100);
  const fromMinProfit = costLkr + Math.max(0, minProfit);
  const rawSell = Math.max(fromPercent, fromMinProfit);
  const sellLkr = roundSellLkr(rawSell);

  return {
    costLkr,
    sellLkr,
    profitLkr: Math.max(0, sellLkr - costLkr),
    markupPercent: markup,
    pricingMode: mode,
  };
}

/**
 * Customer-facing price in LKR.
 * API products: `price` is always the customer sell price in LKR (xx99).
 * Only tiny values (&lt; 50) are treated as legacy USD cost leftovers.
 */
export function productPriceInLkr(
  product: {
    price: number;
    old_price?: number | null;
    reseller_product_id?: string | null;
    reseller_cost_usd?: number | null;
  },
  field: 'price' | 'old_price' = 'price',
): number {
  const raw = field === 'old_price' ? product.old_price : product.price;
  if (raw == null || raw === undefined || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;

  // Normal store products + API sell prices (LKR)
  if (!product.reseller_product_id) return Math.round(n);

  // API product: price column is customer LKR (e.g. 4699). Never hide it.
  // Only convert tiny leftovers that look like raw USD (&lt; 50).
  if (n < 50 && product.reseller_cost_usd == null) {
    return calcApiCustomerPriceLkr(n).sellLkr;
  }

  return Math.round(n);
}

export type ResellerSettings = {
  base_url: string;
  is_enabled: boolean;
  auto_deliver_on_processing: boolean;
  auto_complete_on_success: boolean;
  has_api_key: boolean;
  api_key_preview: string | null;
  usd_to_lkr?: number;
  markup_percent?: number;
  pricing_mode?: ResellerPricingMode;
  min_profit_lkr?: number;
};

export type ResellerRemoteProduct = {
  id: string;
  name: string;
  price?: number;
  stock?: number | string;
  manual_delivery?: boolean;
  [key: string]: unknown;
};

export type ResellerDelivery = {
  id: string;
  order_id: string;
  product_name: string | null;
  vendor_order_id: string | null;
  delivered_data: string | null;
  amount: number | null;
  status: string;
  error_message: string | null;
  external_order_id: string;
  created_at: string;
  orders?: { order_number: string } | null;
};

async function invokeReseller<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('reseller-fulfill', { body });

  if (error) {
    const anyErr = error as any;
    if (anyErr?.context) {
      try {
        const errBody = await anyErr.context.json();
        const msg = errBody?.error || errBody?.message;
        if (msg) throw new Error(String(msg));
      } catch (e) {
        if (e instanceof Error && e.message !== error.message) throw e;
      }
    }
    throw new Error(error.message || 'Reseller API request failed');
  }

  if (data?.error && !data?.success && data?.delivered == null) {
    // Some responses include error alongside partial success; only throw pure errors
    if (data.results == null && data.ok === false) {
      throw new Error(String(data.error));
    }
    if (data.ok === false || (data.status && data.status >= 400 && !data.data)) {
      throw new Error(String(data.error || data.message || 'Request failed'));
    }
  }

  return data as T;
}

export const useResellerSettings = () => {
  return useQuery({
    queryKey: ['reseller', 'settings'],
    queryFn: () => invokeReseller<ResellerSettings>({ action: 'get_settings' }),
    staleTime: 30_000,
  });
};

export const useSaveResellerSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      api_key?: string;
      base_url?: string;
      is_enabled?: boolean;
      auto_deliver_on_processing?: boolean;
      auto_complete_on_success?: boolean;
      usd_to_lkr?: number;
      markup_percent?: number;
      pricing_mode?: ResellerPricingMode;
      min_profit_lkr?: number;
    }) => invokeReseller({ action: 'save_settings', ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller'] });
    },
  });
};

export const useResellerBalance = (enabled = true) => {
  return useQuery({
    queryKey: ['reseller', 'balance'],
    enabled,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await invokeReseller<{ ok: boolean; data: any; status?: number }>({
        action: 'balance',
      });
      if (!res.ok && res.status) {
        throw new Error(
          res.data?.error || res.data?.message || `Balance request failed (${res.status})`,
        );
      }
      return res.data;
    },
    retry: 1,
  });
};

export const useResellerProducts = (enabled = true) => {
  return useQuery({
    queryKey: ['reseller', 'products'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await invokeReseller<{ ok: boolean; data: any }>({ action: 'products' });
      if (!res.ok) {
        throw new Error(res.data?.error || res.data?.message || 'Failed to load reseller products');
      }
      const raw = res.data;
      if (Array.isArray(raw)) return raw as ResellerRemoteProduct[];
      if (Array.isArray(raw?.products)) return raw.products as ResellerRemoteProduct[];
      if (Array.isArray(raw?.data)) return raw.data as ResellerRemoteProduct[];
      return [] as ResellerRemoteProduct[];
    },
  });
};

export const useResellerDeliveries = (enabled = true) => {
  return useQuery({
    queryKey: ['reseller', 'deliveries'],
    enabled,
    queryFn: async () => {
      const res = await invokeReseller<{ deliveries: ResellerDelivery[] }>({
        action: 'list_deliveries',
        limit: 50,
      });
      return res.deliveries || [];
    },
  });
};

export type ResellerDeliverResult = {
  success: boolean;
  error?: string;
  delivered?: number;
  failed?: number;
  skipped?: number;
  order_status?: string;
  order_id?: string;
  results?: Array<{
    order_item_id?: string;
    product_name?: string;
    status?: string;
    error?: string;
    delivered_data?: string;
    reason?: string;
  }>;
};

/** Admin: delivery log for one order (failed + delivered) */
export const useOrderResellerDeliveryLog = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['reseller', 'order-log', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reseller_deliveries')
        .select(
          'id, product_name, status, error_message, delivered_data, vendor_order_id, amount, external_order_id, created_at, updated_at',
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        product_name: string | null;
        status: string;
        error_message: string | null;
        delivered_data: string | null;
        vendor_order_id: string | null;
        amount: number | null;
        external_order_id: string;
        created_at: string;
        updated_at: string;
      }>;
    },
  });
};

export function summarizeDeliverResult(res: ResellerDeliverResult): string {
  const fails = (res.results || []).filter((r) => r.status === 'failed');
  if (fails.length) {
    return fails
      .map((r) => `${r.product_name || 'Item'}: ${r.error || 'failed'}`)
      .join(' · ');
  }
  if (res.error) return res.error;
  if (res.failed && res.failed > 0) return `${res.failed} item(s) failed to deliver`;
  if (res.delivered && res.delivered > 0) {
    return `Delivered ${res.delivered} item(s)${res.skipped ? ` · ${res.skipped} skipped (not API)` : ''}`;
  }
  if (res.skipped && !res.delivered) return 'No API products on this order (nothing to auto-deliver)';
  return 'No delivery action';
}

export const useDeliverOrderViaReseller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, force }: { orderId: string; force?: boolean }) => {
      // Raw invoke — keep JSON body even when edge returns 400 (failed delivery)
      const { data, error } = await supabase.functions.invoke('reseller-fulfill', {
        body: {
          action: 'deliver_order',
          order_id: orderId,
          force: !!force,
        },
      });

      let res = (data || {}) as ResellerDeliverResult;

      if (error && !data) {
        const anyErr = error as any;
        if (anyErr?.context) {
          try {
            const body = await anyErr.context.json();
            res = body as ResellerDeliverResult;
          } catch {
            throw new Error(error.message || 'Delivery failed');
          }
        } else {
          throw new Error(error.message || 'Delivery failed');
        }
      }

      // Prefer structured body over throw so UI can show per-item errors
      return res;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['reseller'] });
      qc.invalidateQueries({ queryKey: ['reseller', 'order-log', vars.orderId] });
    },
  });
};

/** Public track-order: delivered credentials for this order */
export const useOrderResellerDeliveries = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['reseller', 'order-deliveries', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_order_reseller_deliveries', {
        p_order_id: orderId,
      });
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        product_name: string | null;
        vendor_order_id: string | null;
        delivered_data: string | null;
        amount: number | null;
        status: string;
        created_at: string;
      }>;
    },
  });
};

function slugify(name: string, resellerId: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 48);
  const suffix = String(resellerId).replace(/-/g, '').slice(0, 8);
  return `${base || 'api-product'}-api-${suffix}`;
}

/**
 * Import seller-panel products as NEW catalog rows only.
 * Never updates/replaces existing store products.
 * Skips remote IDs already present as reseller_product_id.
 *
 * Customer price = cost_lkr × (1 + markup%) — panel only deducts API $.
 */
export const useImportResellerProducts = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts?: { productIds?: string[]; markActive?: boolean }) => {
      const settings = await invokeReseller<ResellerSettings>({ action: 'get_settings' });
      const rate = Number(settings.usd_to_lkr) || RESELLER_USD_TO_LKR;
      const pricingMode: ResellerPricingMode =
        settings.pricing_mode === 'fixed' ? 'fixed' : 'smart';
      const markup =
        settings.markup_percent != null
          ? Number(settings.markup_percent)
          : RESELLER_DEFAULT_MARKUP_PERCENT;
      const minProfit =
        settings.min_profit_lkr != null
          ? Number(settings.min_profit_lkr)
          : RESELLER_DEFAULT_MIN_PROFIT_LKR;

      const res = await invokeReseller<{ ok: boolean; data: any }>({ action: 'products' });
      if (!res.ok) {
        throw new Error(res.data?.error || res.data?.message || 'Failed to load reseller products');
      }
      const raw = res.data;
      let remote: ResellerRemoteProduct[] = [];
      if (Array.isArray(raw)) remote = raw;
      else if (Array.isArray(raw?.products)) remote = raw.products;
      else if (Array.isArray(raw?.data)) remote = raw.data;

      if (opts?.productIds?.length) {
        const set = new Set(opts.productIds.map(String));
        remote = remote.filter((p) => set.has(String(p.id)));
      }

      if (!remote.length) {
        return { added: 0, skipped: 0, addedNames: [] as string[] };
      }

      const { data: existingRows, error: existErr } = await (supabase as any)
        .from('products')
        .select('id, reseller_product_id')
        .not('reseller_product_id', 'is', null);

      if (existErr) throw existErr;

      const already = new Set(
        (existingRows || [])
          .map((r: any) => String(r.reseller_product_id))
          .filter(Boolean),
      );

      const toAdd = remote.filter((rp) => !already.has(String(rp.id)));
      const skipped = remote.length - toAdd.length;

      if (!toAdd.length) {
        return { added: 0, skipped, addedNames: [] as string[] };
      }

      // display_order: append after current max
      const { data: maxRow } = await (supabase as any)
        .from('products')
        .select('display_order')
        .order('display_order', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      let nextOrder = (maxRow?.display_order ?? -1) + 1;
      const markActive = opts?.markActive !== false;

      const rows = [];
      for (const rp of toAdd) {
        const usd = Number(rp.price);
        const costUsd = Number.isFinite(usd) && usd > 0 ? usd : 0;
        const { sellLkr } = calcApiCustomerPriceLkr(costUsd, {
          rate,
          pricingMode,
          markupPercent: markup,
          minProfitLkr: minProfit,
        });
        const face = await buildCustomerFacingProduct(rp);
        const order = nextOrder++;
        const oldPrice = sellLkr > 0 ? roundSellLkr(sellLkr * 1.15) : null;

        rows.push({
          name: face.name,
          slug: slugify(face.name, String(rp.id)),
          description: face.description,
          price: sellLkr,
          old_price: oldPrice,
          reseller_cost_usd: costUsd,
          category: 'API Products',
          image_url: face.image_url,
          is_active: markActive && face.stock_status !== 'out_of_stock',
          is_featured: false,
          stock_status: face.stock_status,
          reseller_stock: face.reseller_stock,
          manual_fulfillment: false,
          use_variant_pricing: false,
          reseller_product_id: String(rp.id),
          display_order: order,
          requirements: { require_email: false, require_password: false },
        });
      }

      const CHUNK = 40;
      let added = 0;
      const addedNames: string[] = [];
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const { data, error } = await (supabase as any).from('products').insert(chunk).select('id, name');
        if (error) throw error;
        added += data?.length ?? chunk.length;
        for (const r of data || []) addedNames.push(r.name);
      }

      return { added, skipped, addedNames };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['reseller'] });
    },
  });
};

/** True when product was imported / mapped to reseller API */
export function isResellerApiProduct(product: {
  reseller_product_id?: string | null;
  category?: string | null;
}): boolean {
  return !!(product.reseller_product_id && String(product.reseller_product_id).trim());
}

/**
 * Round every API product's customer sell price up to xx99.
 * Does not change reseller_cost_usd (panel cost).
 */
export const useRoundApiPricesTo99 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: rows, error } = await (supabase as any)
        .from('products')
        .select('id, name, price, reseller_product_id')
        .not('reseller_product_id', 'is', null);
      if (error) throw error;
      if (!rows?.length) throw new Error('No API products found');

      let updated = 0;
      const samples: string[] = [];
      for (const row of rows) {
        const before = Number(row.price) || 0;
        const after = roundSellLkr(before);
        if (before === after) continue;
        const { error: upErr } = await (supabase as any)
          .from('products')
          .update({
            price: after,
            // keep a crossed-out "was" slightly higher when useful
            old_price: roundSellLkr(after * 1.12),
          })
          .eq('id', row.id);
        if (!upErr) {
          updated++;
          if (samples.length < 5) {
            samples.push(`${row.name}: Rs.${before} → Rs.${after}`);
          }
        }
      }
      return { updated, total: rows.length, samples };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/** Set custom customer LKR price for one API product (admin). */
export const useSetApiProductPrice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      priceLkr,
    }: {
      productId: string;
      priceLkr: number;
    }) => {
      const price = roundSellLkr(Number(priceLkr));
      if (!price || price < 99) throw new Error('Price must be at least Rs. 99');
      const { data, error } = await (supabase as any)
        .from('products')
        .update({ price })
        .eq('id', productId)
        .select('id, name, price')
        .single();
      if (error) throw error;
      return data as { id: string; name: string; price: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/**
 * Re-generate polished titles, descriptions, and Auto Product images
 * for already-imported API products (does not change prices).
 */
export const useRefreshResellerPresentation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await invokeReseller<{ ok: boolean; data: any }>({ action: 'products' });
      if (!res.ok) {
        throw new Error(res.data?.error || res.data?.message || 'Failed to load reseller products');
      }
      const raw = res.data;
      let remote: ResellerRemoteProduct[] = [];
      if (Array.isArray(raw)) remote = raw;
      else if (Array.isArray(raw?.products)) remote = raw.products;
      else if (Array.isArray(raw?.data)) remote = raw.data;

      // Match by string id and lowercase
      const remoteById = new Map<string, ResellerRemoteProduct>();
      for (const r of remote) {
        remoteById.set(String(r.id), r);
        remoteById.set(String(r.id).toLowerCase(), r);
      }

      const { data: localRows, error } = await (supabase as any)
        .from('products')
        .select('id, reseller_product_id, name, description')
        .not('reseller_product_id', 'is', null);

      if (error) throw error;
      if (!localRows?.length) {
        throw new Error('No API products found in your catalog to refresh.');
      }

      let updated = 0;
      let failed = 0;
      let descUpdated = 0;
      const samples: string[] = [];
      const errors: string[] = [];

      for (const row of localRows) {
        const rid = String(row.reseller_product_id);
        const rp =
          remoteById.get(rid) ||
          remoteById.get(rid.toLowerCase()) ||
          ({
            id: rid,
            name: row.name, // re-polish even without live API row
          } as ResellerRemoteProduct);

        // Prefer raw API name when available so 12m expands correctly
        const sourceName = String(rp.name || row.name || 'Digital Product');
        // Each product polished from ITS own API payload only (never shared template)
        const face = await buildCustomerFacingProduct({
          ...rp,
          name: sourceName,
        });

        // 1) Core fields — name/stock always; description ONLY when THIS product has API text
        //    (avoids wiping a unique description with a generic empty fallback)
        const coreUpdate: Record<string, unknown> = {
          name: face.name,
          stock_status: face.stock_status,
        };
        if (face.hasApiDescription) {
          coreUpdate.description = face.description;
          descUpdated++;
        }
        if (face.reseller_stock != null) {
          coreUpdate.reseller_stock = face.reseller_stock;
        } else {
          coreUpdate.reseller_stock = null;
        }

        const { error: coreErr } = await (supabase as any)
          .from('products')
          .update(coreUpdate)
          .eq('id', row.id);

        if (coreErr) {
          failed++;
          if (errors.length < 3) errors.push(`${row.name}: ${coreErr.message}`);
          continue;
        }

        // 2) Image separately (can be large data-URI) — don't block title update
        if (face.image_url) {
          const { error: imgErr } = await (supabase as any)
            .from('products')
            .update({ image_url: face.image_url })
            .eq('id', row.id);
          if (imgErr && errors.length < 3) {
            errors.push(`Image for ${face.name}: ${imgErr.message}`);
          }
        }

        updated++;
        if (samples.length < 5 && row.name !== face.name) {
          samples.push(`"${row.name}" → "${face.name}"`);
        }
      }

      if (updated === 0) {
        throw new Error(
          errors[0] ||
            'No products updated. Check you are logged in as admin and products have reseller IDs.',
        );
      }

      return { updated, failed, descUpdated, samples, errors };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

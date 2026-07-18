import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

/** Round sell price to a clean shop amount (nearest 50, always >= raw) */
export function roundSellLkr(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const stepped = Math.ceil(amount / 50) * 50;
  // Prefer friendly endings for mid prices (e.g. 890 → 900 feel is fine via 50s)
  return Math.max(50, stepped);
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
 * SMART: markup % depends on cost band + min profit floor + round to 50s
 * FIXED: single markup % (legacy)
 * Panel still only deducts API $ — margin is yours.
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
 * API products: `price` is already sell LKR (margin applied on import).
 * Legacy API rows (USD in price, no cost column): fall back to $ × 360 × markup.
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
  if (raw == null || raw === undefined) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;

  if (!product.reseller_product_id) return n;

  // New model: sell price already in LKR
  if (product.reseller_cost_usd != null && Number(product.reseller_cost_usd) > 0) {
    return Math.round(n);
  }

  // Legacy: price stored as USD from API
  if (n > 0 && n < 200) {
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

export const useDeliverOrderViaReseller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, force }: { orderId: string; force?: boolean }) => {
      const res = await invokeReseller<{
        success: boolean;
        error?: string;
        delivered?: number;
        failed?: number;
        skipped?: number;
        order_status?: string;
        results?: any[];
      }>({
        action: 'deliver_order',
        order_id: orderId,
        force: !!force,
      });

      if (res.error && !res.delivered) {
        throw new Error(res.error);
      }
      if (res.failed && res.failed > 0 && !res.delivered) {
        const first = res.results?.find((r) => r.status === 'failed');
        throw new Error(first?.error || res.error || 'Delivery failed');
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['reseller'] });
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

function stockFromRemote(rp: ResellerRemoteProduct): 'in_stock' | 'limited' | 'out_of_stock' {
  const s = rp.stock;
  if (s == null) return 'in_stock';
  if (typeof s === 'string') {
    const lower = s.toLowerCase();
    if (lower.includes('out') || lower === '0') return 'out_of_stock';
    if (lower.includes('limit') || lower.includes('low')) return 'limited';
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) {
      if (n <= 0) return 'out_of_stock';
      if (n <= 5) return 'limited';
    }
    return 'in_stock';
  }
  if (typeof s === 'number') {
    if (s <= 0) return 'out_of_stock';
    if (s <= 5) return 'limited';
  }
  return 'in_stock';
}

function pickApiString(rp: ResellerRemoteProduct, keys: string[]): string | null {
  for (const k of keys) {
    const v = rp[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function resolveApiImage(rp: ResellerRemoteProduct, name: string): string {
  const candidates = [
    pickApiString(rp, ['image_url', 'image', 'img', 'thumbnail', 'thumb', 'icon', 'cover', 'photo', 'logo']),
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `https:${url}`;
  }

  // Generated fallback avatar (no API image)
  const label = encodeURIComponent(name.slice(0, 24) || 'Auto');
  return `https://ui-avatars.com/api/?name=${label}&background=059669&color=fff&size=400&bold=true&format=png`;
}

function buildApiDescription(
  rp: ResellerRemoteProduct,
  name: string,
  costLkr: number,
  sellLkr: number,
): string {
  const fromApi = pickApiString(rp, [
    'description',
    'desc',
    'details',
    'detail',
    'info',
    'about',
    'product_description',
    'long_description',
  ]);

  if (fromApi) {
    // Keep seller text; append short auto-delivery note if missing
    if (/auto|instant|deliver/i.test(fromApi)) return fromApi;
    return `${fromApi}\n\n⚡ Instant auto delivery after payment is confirmed. Track your order for credentials.`;
  }

  return [
    `## ${name}`,
    '',
    '⚡ **Auto delivery** — credentials sent automatically after payment confirmation.',
    '',
    '### What you get',
    '- Digital product delivered to your **Track Order** page',
    '- Fast fulfillment from our automated system',
    '- WhatsApp support if you need help',
    '',
    '### How it works',
    '1. Place your order and complete payment',
    '2. We confirm payment',
    '3. Product is delivered automatically — no waiting for manual activation',
    '',
    '_This is an auto-fulfilled product._',
  ].join('\n');
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

      const rows = toAdd.map((rp) => {
        const usd = Number(rp.price);
        const costUsd = Number.isFinite(usd) && usd > 0 ? usd : 0;
        const { costLkr, sellLkr } = calcApiCustomerPriceLkr(costUsd, {
          rate,
          pricingMode,
          markupPercent: markup,
          minProfitLkr: minProfit,
        });
        const name = String(rp.name || 'API Product').trim();
        const order = nextOrder++;
        // Optional "was" price for discount feel (~12–18% above sell, rounded)
        const oldPrice = sellLkr > 0 ? roundSellLkr(sellLkr * 1.15) : null;

        return {
          name,
          slug: slugify(name, String(rp.id)),
          description: buildApiDescription(rp, name, costLkr, sellLkr),
          // Customer pays this (LKR, margin included)
          price: sellLkr,
          old_price: oldPrice,
          // Your prepaid panel cost (USD) — only this is deducted on delivery
          reseller_cost_usd: costUsd,
          category: 'API Products',
          image_url: resolveApiImage(rp, name),
          is_active: markActive,
          is_featured: false,
          stock_status: stockFromRemote(rp),
          manual_fulfillment: false,
          use_variant_pricing: false,
          reseller_product_id: String(rp.id),
          display_order: order,
          requirements: { require_email: false, require_password: false },
        };
      });

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

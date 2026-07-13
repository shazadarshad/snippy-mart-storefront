export const AUTO_USD_TO_LKR = 360;
export const CANBOSO_ASSET_BASE = 'https://canboso.com';

export interface AutoProductStats {
  total?: number;
  sold?: number;
  available?: number;
}

export interface AutoPromotion {
  type?: string;
  minQty?: number;
  percent?: number;
  bonusQty?: number;
}

export interface AutoProduct {
  _id: string;
  product_name: string;
  product_name_raw?: string;
  description?: string;
  description_raw?: string;
  pricing?: number;
  usdPricing?: number;
  walletCurrency?: string;
  walletPricing?: number;
  walletPricingText?: string;
  promotionUsdPricing?: number | null;
  isSlotProduct?: boolean;
  slotDurations?: number[];
  requiresCustomerEmail?: boolean;
  requiresSlotMonths?: boolean;
  quantityFixed?: number | null;
  slotPricingMode?: string;
  promotions?: AutoPromotion[] | string | null;
  marketPromotions?: AutoPromotion[] | string | null;
  promotionBadges?: unknown;
  stats?: AutoProductStats;
  emoji?: string;
  descriptionImage?: string;
  warrantyType?: string;
  warrantyDays?: number;
  displayOrder?: number;
}

export interface AutoProductsResponse {
  success: boolean;
  lang?: string;
  botSource?: string;
  walletCurrency?: string;
  requester?: { chatId?: number; name?: string };
  products?: AutoProduct[];
  message?: string;
}

export interface AutoBalanceResponse {
  success: boolean;
  lang?: string;
  botSource?: string;
  walletCurrency?: string;
  requester?: { chatId?: number; name?: string };
  balance?: number;
  balanceUsd?: number;
  balanceVnd?: number;
  balanceText?: string;
  usdtBalance?: number;
  usdRate?: number;
  updatedAt?: string | null;
  message?: string;
}

export interface DeliveredAccount {
  productItemId?: string;
  user?: string;
  password?: string;
  verifyEmail?: string;
  deliveredAt?: string;
  [key: string]: unknown;
}

export interface AutoPurchaseResponse {
  success: boolean;
  lang?: string;
  botSource?: string;
  walletCurrency?: string;
  orderCode?: string;
  productType?: string;
  productTypeRaw?: string;
  quantity?: number;
  bonusQuantity?: number;
  finalQuantity?: number;
  slotMonths?: number;
  customerEmail?: string;
  originalAmount?: number;
  originalAmountText?: string;
  discountPercent?: number;
  discountAmount?: number;
  discountAmountText?: string;
  amount?: number;
  amountUsd?: number;
  amountText?: string;
  balance?: number;
  balanceUsd?: number;
  balanceText?: string;
  deliveredAccounts?: DeliveredAccount[];
  message?: string;
  referralReward?: unknown;
}

export type AutoPurchasePayload = {
  product_id: string;
  quantity: number;
  customer_email?: string;
  slot_months?: number;
};

function asArrayPromos(value: AutoPromotion[] | string | null | undefined): AutoPromotion[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
}

export function getProductPromotions(p: AutoProduct | null | undefined): AutoPromotion[] {
  if (!p) return [];
  const a = asArrayPromos(p.promotions);
  const b = asArrayPromos(p.marketPromotions);
  return [...a, ...b];
}

export function productUsdPrice(p: AutoProduct | null | undefined): number {
  if (!p) return 0;
  const promo = p.promotionUsdPricing;
  if (typeof promo === 'number' && Number.isFinite(promo) && promo > 0) return promo;
  if (typeof p.usdPricing === 'number' && Number.isFinite(p.usdPricing)) return p.usdPricing;
  if (typeof p.walletPricing === 'number' && Number.isFinite(p.walletPricing)) return p.walletPricing;
  return 0;
}

export function productLkrPrice(p: AutoProduct | null | undefined): number {
  return Math.round(productUsdPrice(p) * AUTO_USD_TO_LKR);
}

export function productAvailable(p: AutoProduct | null | undefined): number {
  if (!p) return 0;
  const n = p.stats?.available;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function productImageUrl(p: AutoProduct | null | undefined): string | null {
  if (!p) return null;
  const img = (p.descriptionImage || '').trim();
  if (!img || img === '__none__') return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/')) return `${CANBOSO_ASSET_BASE}${img}`;
  return `${CANBOSO_ASSET_BASE}/${img}`;
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n < 1 ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatLkr(n: number): string {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Math.round(n))}`;
}

/**
 * Direct fetch to the functions URL for reliable GET + query params
 * (supabase.functions.invoke is POST-oriented and awkward with query strings).
 */
async function fetchFunction<T>(
  action: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown }
): Promise<T> {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  if (!base || !anon) {
    throw new Error('Supabase is not configured');
  }

  const url = `${base.replace(/\/$/, '')}/functions/v1/auto-buyer?action=${encodeURIComponent(action)}`;
  const method = init?.method || 'GET';

  const res = await fetch(url, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(init?.body ?? {}) : undefined,
  });

  let data: T & { success?: boolean; message?: string };
  try {
    data = (await res.json()) as T & { success?: boolean; message?: string };
  } catch {
    throw new Error(`Auto API returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Auto API error (HTTP ${res.status})`);
  }

  return data;
}

export async function fetchAutoProducts(): Promise<AutoProductsResponse> {
  return fetchFunction<AutoProductsResponse>('products');
}

export async function fetchAutoBalance(): Promise<AutoBalanceResponse> {
  return fetchFunction<AutoBalanceResponse>('balance');
}

export async function purchaseAutoProduct(
  payload: AutoPurchasePayload
): Promise<AutoPurchaseResponse> {
  return fetchFunction<AutoPurchaseResponse>('purchase', {
    method: 'POST',
    body: payload,
  });
}

export function categorizeProduct(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('gmail') || n.includes('hotmail') || n.includes('mail')) return 'Email';
  if (n.includes('grok') || n.includes('chatgpt') || n.includes('gpt') || n.includes('claude') || n.includes('gemini') || n.includes('deepseek') || n.includes('api ')) return 'AI';
  if (n.includes('capcut') || n.includes('canva') || n.includes('adobe') || n.includes('picsart') || n.includes('meitu')) return 'Design';
  if (n.includes('vpn') || n.includes('express') || n.includes('hma')) return 'VPN';
  if (n.includes('cursor') || n.includes('kiro') || n.includes('codex')) return 'Dev Tools';
  if (n.includes('office') || n.includes('microsoft') || n.includes('xbox')) return 'Microsoft';
  if (n.includes('elevenlabs') || n.includes('kling') || n.includes('veo') || n.includes('higgs') || n.includes('openart')) return 'Media AI';
  if (n.includes('duolingo')) return 'Education';
  return 'Other';
}

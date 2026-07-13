import { supabase } from '@/integrations/supabase/client';

export const AUTO_USD_TO_LKR = 360;
export const CANBOSO_ASSET_BASE = 'https://canboso.com';

/** Same project as the rest of the storefront (hardcoded client — do not rely on VITE_* at runtime). */
const SUPABASE_URL = 'https://vuffzfuklzzcnfnubtzx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZmZ6ZnVrbHp6Y25mbnVidHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTQ1NjAsImV4cCI6MjA4NDI3MDU2MH0.qHjJYOrNi1cBYPYapmHMJgDxsI50sHAKUAvv0VnPQFM';

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
  success?: boolean;
  lang?: string;
  botSource?: string;
  walletCurrency?: string;
  requester?: { chatId?: number; name?: string };
  products?: AutoProduct[];
  message?: string;
}

export interface AutoBalanceResponse {
  success?: boolean;
  balance?: number;
  balanceUsd?: number;
  balanceText?: string;
  walletCurrency?: string;
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
  success?: boolean;
  orderCode?: string;
  productType?: string;
  quantity?: number;
  bonusQuantity?: number;
  finalQuantity?: number;
  amount?: number;
  amountUsd?: number;
  amountText?: string;
  balance?: number;
  balanceText?: string;
  deliveredAccounts?: DeliveredAccount[];
  message?: string;
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
  return [...asArrayPromos(p.promotions), ...asArrayPromos(p.marketPromotions)];
}

export function productUsdPrice(p: AutoProduct | null | undefined): number {
  try {
    if (p == null || typeof p !== 'object') return 0;
    const promo = p?.promotionUsdPricing;
    if (typeof promo === 'number' && Number.isFinite(promo) && promo > 0) return promo;
    const usd = p?.usdPricing;
    if (typeof usd === 'number' && Number.isFinite(usd)) return usd;
    const wallet = p?.walletPricing;
    if (typeof wallet === 'number' && Number.isFinite(wallet)) return wallet;
    return 0;
  } catch {
    return 0;
  }
}

/** Customer-facing LKR price (USD × rate). */
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatLkr(n: number): string {
  return `LKR ${new Intl.NumberFormat('en-LK').format(Math.round(n))}`;
}

export function accountLines(acc: DeliveredAccount): string {
  const parts: string[] = [];
  if (acc.user) parts.push(`User: ${acc.user}`);
  if (acc.password) parts.push(`Pass: ${acc.password}`);
  if (acc.verifyEmail) parts.push(`Recovery: ${acc.verifyEmail}`);
  for (const [k, v] of Object.entries(acc)) {
    if (['user', 'password', 'verifyEmail', 'productItemId', 'deliveredAt'].includes(k)) continue;
    if (typeof v === 'string' && v.trim()) parts.push(`${k}: ${v}`);
  }
  return parts.join('\n') || JSON.stringify(acc, null, 2);
}

async function fetchFunction<T>(
  action: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown }
): Promise<T> {
  const method = init?.method || 'GET';
  const url = `${SUPABASE_URL}/functions/v1/auto-buyer?action=${encodeURIComponent(action)}`;

  // Prefer session token when logged in; always fall back to publishable key
  let authToken = SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) authToken = data.session.access_token;
  } catch {
    /* ignore */
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(init?.body ?? {}) : undefined,
    });
  } catch {
    throw new Error('Network error loading auto catalog. Check your connection and try again.');
  }

  let data: T & { success?: boolean; message?: string; products?: unknown };
  try {
    data = (await res.json()) as T & { success?: boolean; message?: string; products?: unknown };
  } catch {
    throw new Error(`Auto catalog returned invalid data (HTTP ${res.status}).`);
  }

  // Products list: accept body if products array is present even when success is omitted
  if (action === 'products' && Array.isArray((data as AutoProductsResponse).products)) {
    return data;
  }

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Auto service error (HTTP ${res.status})`);
  }

  return data;
}

export async function fetchAutoProducts(): Promise<AutoProduct[]> {
  const data = await fetchFunction<AutoProductsResponse>('products');
  const list = Array.isArray(data.products) ? data.products : [];
  return list.filter(
    (p): p is AutoProduct =>
      p != null &&
      typeof p === 'object' &&
      typeof p._id === 'string' &&
      !!p._id &&
      typeof p.product_name === 'string'
  );
}

/** Staff-only; not shown to customers. */
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
  if (
    n.includes('grok') ||
    n.includes('chatgpt') ||
    n.includes('gpt') ||
    n.includes('claude') ||
    n.includes('gemini') ||
    n.includes('deepseek') ||
    n.includes('api ')
  )
    return 'AI';
  if (
    n.includes('capcut') ||
    n.includes('canva') ||
    n.includes('adobe') ||
    n.includes('picsart') ||
    n.includes('meitu')
  )
    return 'Design';
  if (n.includes('vpn') || n.includes('express') || n.includes('hma')) return 'VPN';
  if (n.includes('cursor') || n.includes('kiro') || n.includes('codex')) return 'Dev Tools';
  if (n.includes('office') || n.includes('microsoft') || n.includes('xbox')) return 'Microsoft';
  if (
    n.includes('elevenlabs') ||
    n.includes('kling') ||
    n.includes('veo') ||
    n.includes('higgs') ||
    n.includes('openart')
  )
    return 'Media AI';
  if (n.includes('duolingo')) return 'Education';
  return 'Other';
}

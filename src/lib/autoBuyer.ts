import { supabase } from '@/integrations/supabase/client';

/**
 * Customer sell rate: LKR per $1 of supplier (Canboso) price.
 *
 * Profit (approx):
 *   cost_usd     = API usdPricing (debited from YOUR Canboso wallet)
 *   sell_lkr     = cost_usd × AUTO_USD_TO_LKR
 *   cost_lkr     ≈ cost_usd × (what YOU paid per $ when funding the wallet)
 *   profit_lkr   ≈ sell_lkr − cost_lkr
 *
 * Example CapCut Pro 30D at $2.75:
 *   sell = 2.75 × 360 = LKR 990
 *   if you fund at ~LKR 300/USD → cost ≈ 825 → profit ≈ LKR 165 (~20%)
 * There is NO extra fixed +1000 on auto items — only this rate.
 */
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

/** Family key + display title for grouping same product lines as variants. */
export function productFamily(name: string): { key: string; title: string } {
  const n = (name || '').toLowerCase().replace(/\s+/g, ' ').trim();

  if (/capcut\s*pro/.test(n)) return { key: 'capcut-pro', title: 'CapCut Pro' };
  if (/supergrok|super\s*grok/.test(n)) return { key: 'supergrok', title: 'SuperGrok' };
  if (/adobe\s*full\s*app/.test(n)) return { key: 'adobe-full-app', title: 'Adobe Full App' };
  if (/claude/.test(n) && /(api|token)/.test(n))
    return { key: 'api-claude', title: 'Claude API Tokens' };
  if (/codex/.test(n) && /(api|token)/.test(n))
    return { key: 'api-codex', title: 'Codex API Tokens' };
  if (/deepseek/.test(n) && /(api|token)/.test(n))
    return { key: 'api-deepseek', title: 'DeepSeek API Tokens' };
  if (/cursor\s*pro/.test(n)) return { key: 'cursor-pro', title: 'Cursor Pro' };
  if (/elevenlabs/.test(n)) return { key: 'elevenlabs', title: 'ElevenLabs' };
  if (/picsart\s*pro/.test(n)) return { key: 'picsart-pro', title: 'Picsart Pro' };
  if (/veo3|antigravity/.test(n)) return { key: 'veo3', title: 'VEO3 (Antigravity)' };
  if (/\bhiggs\b/.test(n)) return { key: 'higgs', title: 'Higgs AI' };
  if (/canva\s*edu|account canva edu/.test(n)) return { key: 'canva-edu', title: 'Canva Edu' };
  if (/canva\s*pro|add mail canva/.test(n)) return { key: 'canva-pro', title: 'Canva Pro' };
  if (/gemini/.test(n)) return { key: 'gemini', title: 'Gemini AI' };
  if (/office\s*365|microsoft office/.test(n))
    return { key: 'office-365', title: 'Microsoft Office 365' };
  if (/gmail\s*random\s*ip/.test(n)) return { key: 'gmail-random-ip', title: 'Gmail Random IP' };
  if (/gmail\s*stock|gmail us stock/.test(n)) return { key: 'gmail-stock', title: 'Gmail Stock' };
  if (/gpt\s*plus|chatgpt\s*plus/.test(n)) return { key: 'gpt-plus', title: 'ChatGPT Plus' };
  if (/express\s*vpn/.test(n)) return { key: 'express-vpn', title: 'ExpressVPN' };
  if (/\bhma\b.*vpn|hma vpn/.test(n)) return { key: 'hma-vpn', title: 'HMA VPN' };
  if (/duolingo/.test(n)) return { key: 'duolingo', title: 'Duolingo Super' };
  if (/openart/.test(n)) return { key: 'openart', title: 'OpenArt' };
  if (/kling/.test(n)) return { key: 'kling', title: 'Kling AI' };
  if (/meitu/.test(n)) return { key: 'meitu', title: 'Meitu VIP' };
  if (/kiro/.test(n)) return { key: 'kiro', title: 'Kiro Power' };
  if (/xbox/.test(n)) return { key: 'xbox', title: 'Xbox Gift Code' };
  if (/hotmail|immortal hot/.test(n)) return { key: 'hotmail', title: 'HotMail' };

  // Fallback: strip duration / warranty noise so similar titles still group
  const stripped = n
    .replace(/\b\d+\s*[-–>]+\s*\d+\s*d\b/gi, ' ')
    .replace(/\b\d+\s*d\b/gi, ' ')
    .replace(/\b\d+\s*h\b/gi, ' ')
    .replace(/\b\d+\s*m(onth)?s?\b/gi, ' ')
    .replace(/\b\d+\s*years?\b/gi, ' ')
    .replace(/\b(full\s*)?warranty\b/gi, ' ')
    .replace(/\bcovers?\b/gi, ' ')
    .replace(/\bcomes with\b/gi, ' ')
    .replace(/\bno fees?\b/gi, ' ')
    .replace(/\bno damage\b/gi, ' ')
    .replace(/\bno warranty\b/gi, ' ')
    .replace(/[|()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const key = stripped || n || 'other';
  const title = key
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { key: `solo:${key}`, title: title || name };
}

/**
 * Display-only text cleanup. Does NOT change API IDs or purchase mapping.
 * Original supplier strings stay on the product object for admin / notes.
 */
export function cleanSupplierText(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = String(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\uFFFD/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    // collapse weird spacing
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Common supplier English / shorthand fixes (safe, conservative)
  const replacements: [RegExp, string][] = [
    [/\bcomes with full warranty\b/gi, 'Full warranty'],
    [/\bcomes with\b/gi, 'Includes'],
    [/\bfully covered\b/gi, 'Full warranty'],
    [/\bfull cover\b/gi, 'Full warranty'],
    [/\bfull warranty\b/gi, 'Full warranty'],
    [/\bno damage\b/gi, 'No damage warranty'],
    [/\bno warranty\b/gi, 'No warranty'],
    [/\bno fees?\b/gi, 'No extra fees'],
    [/\bcovers?\s+(\d+)\s*d\b/gi, '$1-day warranty'],
    [/\bcovers?\s+(\d+)\s*h\b/gi, '$1-hour warranty'],
    [/\b(\d+)\s*d\b/gi, '$1 days'],
    [/\b(\d+)\s*h\b/gi, '$1 hours'],
    [/\b(\d+)\s*m\b(?!\w)/gi, '$1 months'],
    [/\b1 month\b/gi, '1 month'],
    [/\bcre\b/gi, 'credits'],
    [/\bcdk\b/gi, 'activation code'],
    [/\badd mail\b/gi, 'Add mail'],
    [/\brandom cre\b/gi, 'random credits'],
    [/\bvery phone\b/gi, 'phone verification'],
    [/\blogin l[oộ]i pass\b/gi, 'login password issues'],
    [/\bdu[oọ]c b[aả]o h[aà]nh\b/gi, 'warranty included'],
    [/\bmkp\b/gi, 'recovery'],
    [/\b ho[aà]n ti[eề]n\b/gi, ' refund'],
  ];

  for (const [re, to] of replacements) {
    t = t.replace(re, to);
  }

  // Fix " -> " range leftovers
  t = t.replace(/\s*->\s*/g, ' – ').replace(/\s{2,}/g, ' ').trim();
  return t;
}

/** Nice title-case without wrecking known brands / codes. */
function smartTitleCase(s: string): string {
  const keepUpper = new Set([
    'ai',
    'api',
    'vpn',
    'gpt',
    'us',
    'pc',
    'ip',
    'cdn',
    'pro',
    'vip',
    'edu',
    'veo3',
    'chatgpt',
    'gmail',
    'hotmail',
    'office',
    '365',
    'canva',
    'capcut',
    'claude',
    'codex',
    'cursor',
  ]);
  return s
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (keepUpper.has(lower)) {
        if (lower === 'chatgpt') return 'ChatGPT';
        if (lower === 'veo3') return 'VEO3';
        if (lower === 'ip') return 'IP';
        if (lower === 'us') return 'US';
        if (lower === 'pc') return 'PC';
        if (lower === 'api') return 'API';
        if (lower === 'ai') return 'AI';
        if (lower === 'vpn') return 'VPN';
        if (lower === 'gpt') return 'GPT';
        if (lower === 'edu') return 'Edu';
        if (lower === 'vip') return 'VIP';
        if (lower === 'pro') return 'Pro';
        return lower.toUpperCase() === w ? w : lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      if (/^\d/.test(w)) return w;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/** Customer-facing product title (display only). */
export function displayTitle(p: AutoProduct | null | undefined): string {
  if (!p) return 'Product';
  const fam = productFamily(p.product_name || '');
  // Prefer clean family name + short variant cue when multi-part
  const variant = shortVariantParts(p.product_name || '');
  if (variant) return `${fam.title} — ${variant}`;
  return smartTitleCase(cleanSupplierText(p.product_name || fam.title));
}

const FAMILY_BLURBS: Record<string, string> = {
  'capcut-pro':
    'CapCut Pro access for creators. Pick a duration. Delivered after your bank transfer is confirmed.',
  supergrok: 'SuperGrok access. Choose plan length and warranty option below.',
  'adobe-full-app':
    'Adobe Creative Cloud full-app access. Select duration and warranty type.',
  'api-claude': 'Claude API token packs. Instant-style delivery after payment confirmation.',
  'api-codex': 'Codex API token packs for coding workflows. Choose pack size below.',
  'api-deepseek': 'DeepSeek API token access. Select the pack that fits your usage.',
  'cursor-pro': 'Cursor Pro access. Choose warranty style below.',
  elevenlabs: 'ElevenLabs credits / plan access for voice AI.',
  'picsart-pro': 'Picsart Pro creative suite access. Choose warranty option.',
  veo3: 'Google VEO3 / Antigravity video AI credits. Select pack below.',
  higgs: 'Higgs AI credits and plans.',
  'canva-edu': 'Canva Education plan access for design work.',
  'canva-pro': 'Canva Pro access. Add-mail / upgrade style delivery as listed.',
  gemini: 'Google Gemini AI Pro access. Choose the plan option below.',
  'office-365': 'Microsoft Office 365 access. Family / premium options available.',
  'gmail-random-ip': 'Gmail accounts (random IP range). Format and warranty as listed on the option.',
  'gmail-stock': 'Gmail stock accounts by year range. Check the option notes before buying.',
  'gpt-plus': 'ChatGPT Plus access for the selected period.',
  'express-vpn': 'ExpressVPN subscription access.',
  'hma-vpn': 'HMA VPN key / access for supported devices.',
  duolingo: 'Duolingo Super premium access.',
  openart: 'OpenArt AI credits for image generation.',
  kling: 'Kling AI video credits.',
  meitu: 'Meitu VIP creative tools access.',
  kiro: 'Kiro Power plan access.',
  xbox: 'Xbox gift code (random).',
  hotmail: 'Hotmail / Outlook mail access. Immortal-style stock as listed.',
};

function shortVariantParts(name: string): string {
  const n = name.toLowerCase();
  const bits: string[] = [];

  // Token / credit size first
  const token = name.match(/(\d+\s*M)\s*Token/i) || name.match(/(\d+)\s*M\s*Token/i);
  if (token) bits.push(`${token[1].replace(/\s+/g, '')} tokens`);

  const credits = name.match(/(\d[\d,]*)\s*(?:cre|credits?)/i);
  if (credits && !token) bits.push(`${credits[1]} credits`);

  // Duration
  const rangeD = n.match(/(\d+)\s*d\s*[-–>]+\s*(\d+)\s*d/);
  if (rangeD) bits.push(`${rangeD[1]}–${rangeD[2]} days`);
  else {
    const d = n.match(/\b(\d+)\s*d\b/);
    const months = n.match(/\b(\d+)\s*months?\b/) || n.match(/\b(\d+)\s*m\b(?!\w)/);
    const years = n.match(/\b(\d+)\s*years?\b/);
    const hours = n.match(/\b(\d+)\s*h\b/);
    if (d) bits.push(`${d[1]} days`);
    else if (months) bits.push(`${months[1]} month${months[1] === '1' ? '' : 's'}`);
    else if (years) bits.push(`${years[1]} year${years[1] === '1' ? '' : 's'}`);
    else if (hours) bits.push(`${hours[1]} hours`);
  }

  // Warranty / quality tags
  if (/\bno warranty\b/i.test(n)) bits.push('No warranty');
  else if (/\b24h\b/i.test(n)) bits.push('24h warranty');
  else if (/\b7d warranty\b|\b7-day warranty\b|\bcovers 7d\b/i.test(n)) bits.push('7-day warranty');
  else if (/\bfull warranty\b|\bfully covered\b|\bfull cover\b|\bcomes with full warranty\b/i.test(n))
    bits.push('Full warranty');
  else if (/\bno damage\b/i.test(n)) bits.push('No damage warranty');
  else if (/\bno fees?\b/i.test(n)) bits.push('No fees');

  if (/\btrial\b/i.test(n)) bits.push('Trial');
  if (/\brenew\b/i.test(n)) bits.push('Renew');
  if (/\brandom\b/i.test(n) && !/gmail/i.test(n)) bits.push('Random');
  if (/\bus stock\b/i.test(n)) bits.push('US stock');
  if (/\bnot serviced\b/i.test(n)) bits.push('Not serviced');
  if (/\bstarter\b/i.test(n)) bits.push('Starter');
  if (/\bultra\b/i.test(n)) bits.push('Ultra');
  if (/\bx5\b/i.test(n)) bits.push('x5');
  if (/\bx20\b/i.test(n)) bits.push('x20');
  if (/\bfamily\b/i.test(n)) bits.push('Family');
  if (/\badd\s*5\b/i.test(n) || /\badd 5 member\b/i.test(n)) bits.push('Add 5 members');
  if (/\bcdk\b/i.test(n)) bits.push('Activation code');
  if (/\blink\b/i.test(n) && /gemini/i.test(n)) bits.push('Invite link');

  // Year ranges for gmail
  const yearsRange = name.match(/(20\d{2})\s*[-~–]\s*(20\d{2})/);
  if (yearsRange) bits.push(`${yearsRange[1]}–${yearsRange[2]}`);

  return bits.join(' · ');
}

/** Short option label in dropdowns (display only). */
export function variantLabel(p: AutoProduct): string {
  const parts = shortVariantParts(p.product_name || '');
  if (parts) return parts;
  const cleaned = cleanSupplierText(p.product_name || 'Option');
  return cleaned.length <= 64 ? cleaned : cleaned.slice(0, 61) + '…';
}

/** Customer-facing description (display only). */
export function displayDescription(p: AutoProduct | null | undefined): string {
  if (!p) return '';
  const fam = productFamily(p.product_name || '');
  const blurb = FAMILY_BLURBS[fam.key];
  const raw = cleanSupplierText(p.description || '');

  // Prefer supplier text if it looks usable (enough Latin letters, not too short)
  const latin = (raw.match(/[A-Za-z]/g) || []).length;
  const looksEnglish = latin >= 40 && raw.length >= 30;

  if (looksEnglish) {
    // Soft-trim for cards; keep readable paragraphs
    const clipped = raw.length > 280 ? raw.slice(0, 277).trimEnd() + '…' : raw;
    return clipped;
  }

  if (blurb) return blurb;

  if (raw) {
    return raw.length > 200 ? raw.slice(0, 197).trimEnd() + '…' : raw;
  }

  return `${fam.title} — digital delivery after bank transfer confirmation. Choose an option and complete payment.`;
}

export interface AutoProductGroup {
  key: string;
  title: string;
  category: string;
  variants: AutoProduct[];
  /** Cheapest in-stock variant, else cheapest overall */
  defaultVariant: AutoProduct;
  minLkr: number;
  maxLkr: number;
  totalAvailable: number;
  image: string | null;
  description?: string;
}

export function groupAutoProducts(products: AutoProduct[]): AutoProductGroup[] {
  const map = new Map<string, AutoProduct[]>();

  for (const p of products) {
    if (!p?._id) continue;
    const { key } = productFamily(p.product_name || '');
    const list = map.get(key) || [];
    list.push(p);
    map.set(key, list);
  }

  const groups: AutoProductGroup[] = [];

  for (const [key, variants] of map) {
    // Sort variants by price asc, then name
    variants.sort((a, b) => {
      const d = productLkrPrice(a) - productLkrPrice(b);
      if (d !== 0) return d;
      return (a.product_name || '').localeCompare(b.product_name || '');
    });

    const { title } = productFamily(variants[0].product_name || '');
    const prices = variants.map(productLkrPrice);
    const minLkr = Math.min(...prices);
    const maxLkr = Math.max(...prices);
    const totalAvailable = variants.reduce((s, v) => s + productAvailable(v), 0);
    const inStock = variants.filter((v) => productAvailable(v) > 0);
    const defaultVariant = inStock[0] || variants[0];
    const withImg = variants.find((v) => productImageUrl(v));
    // Prefer a cleaned blurb over messy raw supplier text
    const description = displayDescription(defaultVariant);

    groups.push({
      key,
      title, // already clean family title
      category: categorizeProduct(variants[0].product_name || ''),
      variants,
      defaultVariant,
      minLkr,
      maxLkr,
      totalAvailable,
      image: productImageUrl(withImg || defaultVariant),
      description,
    });
  }

  groups.sort((a, b) => {
    const ao = a.defaultVariant.displayOrder ?? 999;
    const bo = b.defaultVariant.displayOrder ?? 999;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });

  return groups;
}

/** Rough profit in LKR if you fund USD at `fundRateLkrPerUsd` (default 300). */
export function estimateProfitLkr(
  p: AutoProduct | null | undefined,
  fundRateLkrPerUsd = 300
): { costUsd: number; sellLkr: number; costLkr: number; profitLkr: number } {
  const costUsd = productUsdPrice(p);
  const sellLkr = productLkrPrice(p);
  const costLkr = Math.round(costUsd * fundRateLkrPerUsd);
  return { costUsd, sellLkr, costLkr, profitLkr: sellLkr - costLkr };
}

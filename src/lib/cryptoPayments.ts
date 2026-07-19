/**
 * Crypto payment helpers for checkout.
 *
 * Conversion rule (merchant-safe, never under-charge):
 * 1. LKR → USD using admin rate (optionally nudged safer)
 * 2. Apply safety markup % (default 2%)
 * 3. Divide by live coin USD price
 * 4. Always ROUND UP to coin decimals (ceil) — never floor/round-half
 */

export type CryptoWallet = {
  id: string;
  symbol: string;
  name: string;
  network: string;
  address: string;
  /** CoinGecko asset id for live USD price */
  coingecko_id: string;
  decimals: number;
  is_active: boolean;
};

export type CryptoPaymentSettings = {
  markup_percent: number;
  /** How many LKR = 1 USD for crypto quotes. Lower → customer pays slightly more crypto (safer for store). */
  lkr_per_usd: number;
  wallets: CryptoWallet[];
};

/** Matches storefront display rate; crypto path nudges safer on top. */
export const DEFAULT_CRYPTO_LKR_PER_USD = 360;

/** Extra % on top of converted amount so FX moves don't leave you short. */
export const DEFAULT_CRYPTO_MARKUP_PERCENT = 2;

export const DEFAULT_CRYPTO_WALLETS: CryptoWallet[] = [
  {
    id: 'usdt-trc20',
    symbol: 'USDT',
    name: 'Tether',
    network: 'TRC20 (TRON)',
    address: '',
    coingecko_id: 'tether',
    decimals: 2,
    is_active: false,
  },
  {
    id: 'usdt-bep20',
    symbol: 'USDT',
    name: 'Tether',
    network: 'BEP20 (BSC)',
    address: '',
    coingecko_id: 'tether',
    decimals: 2,
    is_active: false,
  },
  {
    id: 'usdt-erc20',
    symbol: 'USDT',
    name: 'Tether',
    network: 'ERC20 (Ethereum)',
    address: '',
    coingecko_id: 'tether',
    decimals: 2,
    is_active: false,
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin',
    address: '',
    coingecko_id: 'bitcoin',
    decimals: 8,
    is_active: false,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC20 (Ethereum)',
    address: '',
    coingecko_id: 'ethereum',
    decimals: 6,
    is_active: false,
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    name: 'BNB',
    network: 'BEP20 (BSC)',
    address: '',
    coingecko_id: 'binancecoin',
    decimals: 6,
    is_active: false,
  },
];

export function parseCryptoSettings(
  rawWallets: string | null | undefined,
  rawMarkup: string | null | undefined,
  rawLkrPerUsd: string | null | undefined,
): CryptoPaymentSettings {
  let wallets = DEFAULT_CRYPTO_WALLETS.map((w) => ({ ...w }));
  if (rawWallets) {
    try {
      const parsed = JSON.parse(rawWallets) as CryptoWallet[];
      if (Array.isArray(parsed) && parsed.length) {
        wallets = parsed.map((w) => ({
          id: String(w.id || cryptoRandomId()),
          symbol: String(w.symbol || 'USDT').toUpperCase(),
          name: String(w.name || w.symbol || 'Crypto'),
          network: String(w.network || ''),
          address: String(w.address || '').trim(),
          coingecko_id: String(w.coingecko_id || symbolToCoingecko(w.symbol)).toLowerCase(),
          decimals: clampDecimals(Number(w.decimals) || 6),
          is_active: Boolean(w.is_active),
        }));
      }
    } catch {
      /* keep defaults */
    }
  }

  const markup = Number(rawMarkup);
  const lkr = Number(rawLkrPerUsd);

  return {
    wallets,
    markup_percent: Number.isFinite(markup) && markup >= 0 ? markup : DEFAULT_CRYPTO_MARKUP_PERCENT,
    lkr_per_usd: Number.isFinite(lkr) && lkr > 0 ? lkr : DEFAULT_CRYPTO_LKR_PER_USD,
  };
}

export function activeWallets(settings: CryptoPaymentSettings): CryptoWallet[] {
  return settings.wallets.filter((w) => w.is_active && w.address.trim().length > 8);
}

function symbolToCoingecko(symbol?: string): string {
  const s = (symbol || '').toUpperCase();
  const map: Record<string, string> = {
    USDT: 'tether',
    USDC: 'usd-coin',
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    TRX: 'tron',
    SOL: 'solana',
    LTC: 'litecoin',
    DOGE: 'dogecoin',
  };
  return map[s] || 'tether';
}

function clampDecimals(n: number): number {
  if (!Number.isFinite(n)) return 6;
  return Math.min(12, Math.max(0, Math.floor(n)));
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Round UP to `decimals` places (never under-charge). */
export function ceilToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const f = 10 ** decimals;
  // Epsilon avoids floating point just-below issues (e.g. 1.2300000001)
  return Math.ceil(value * f - 1e-10) / f;
}

/**
 * Convert order total in LKR to a coin amount.
 * Always ceils; applies markup; uses a 1% safer LKR→USD rate (more USD, never less).
 */
export function convertLkrToCryptoAmount(
  amountLkr: number,
  coinPriceUsd: number,
  options: {
    lkrPerUsd: number;
    markupPercent: number;
    decimals: number;
  },
): number {
  if (!Number.isFinite(amountLkr) || amountLkr <= 0) return 0;
  if (!Number.isFinite(coinPriceUsd) || coinPriceUsd <= 0) return 0;

  const lkrPerUsd = options.lkrPerUsd > 0 ? options.lkrPerUsd : DEFAULT_CRYPTO_LKR_PER_USD;
  // Slightly lower LKR-per-USD ⇒ slightly higher USD quote (safer for store)
  const safeLkrPerUsd = lkrPerUsd * 0.99;
  const usdValue = amountLkr / safeLkrPerUsd;
  const markup = Math.max(0, options.markupPercent) / 100;
  const usdWithBuffer = usdValue * (1 + markup);
  const rawCoin = usdWithBuffer / coinPriceUsd;
  return ceilToDecimals(rawCoin, options.decimals);
}

export function formatCryptoAmount(amount: number, decimals: number, symbol: string): string {
  if (!Number.isFinite(amount)) return `— ${symbol}`;
  return `${amount.toFixed(decimals)} ${symbol}`;
}

/** Fallback USD prices if live API is unavailable (conservative / slightly high for major coins). */
export const FALLBACK_USD_PRICES: Record<string, number> = {
  tether: 1,
  'usd-coin': 1,
  bitcoin: 95000,
  ethereum: 3500,
  binancecoin: 650,
  tron: 0.25,
  solana: 180,
  litecoin: 100,
  dogecoin: 0.25,
};

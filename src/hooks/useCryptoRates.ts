import { useQuery } from '@tanstack/react-query';
import {
  FALLBACK_USD_PRICES,
  convertLkrToCryptoAmount,
  type CryptoPaymentSettings,
  type CryptoWallet,
} from '@/lib/cryptoPayments';

async function fetchCoinUsdPrices(ids: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};

  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(unique.join(','))}` +
    `&vs_currencies=usd`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Rate API ${res.status}`);
  const data = (await res.json()) as Record<string, { usd?: number }>;

  const out: Record<string, number> = {};
  for (const id of unique) {
    const p = data[id]?.usd;
    if (typeof p === 'number' && p > 0) out[id] = p;
  }
  return out;
}

export function useCryptoRates(coinIds: string[]) {
  const key = [...new Set(coinIds)].sort().join(',');

  return useQuery({
    queryKey: ['crypto-usd-rates', key],
    enabled: key.length > 0,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
    retry: 2,
    queryFn: async () => {
      try {
        const live = await fetchCoinUsdPrices(coinIds);
        // Fill missing with fallbacks
        const merged: Record<string, number> = { ...FALLBACK_USD_PRICES, ...live };
        return { prices: merged, source: Object.keys(live).length ? ('live' as const) : ('fallback' as const) };
      } catch {
        return { prices: { ...FALLBACK_USD_PRICES }, source: 'fallback' as const };
      }
    },
  });
}

export function quoteCrypto(
  amountLkr: number,
  wallet: Pick<CryptoWallet, 'coingecko_id' | 'decimals' | 'symbol'>,
  settings: Pick<CryptoPaymentSettings, 'lkr_per_usd' | 'markup_percent'>,
  prices: Record<string, number> | undefined,
): { amount: number; priceUsd: number; formatted: string } {
  const id = wallet.coingecko_id;
  const priceUsd =
    prices?.[id] ||
    FALLBACK_USD_PRICES[id] ||
    (wallet.symbol.toUpperCase() === 'USDT' || wallet.symbol.toUpperCase() === 'USDC' ? 1 : 0);

  const amount = convertLkrToCryptoAmount(amountLkr, priceUsd, {
    lkrPerUsd: settings.lkr_per_usd,
    markupPercent: settings.markup_percent,
    decimals: wallet.decimals,
  });

  return {
    amount,
    priceUsd,
    formatted: `${amount.toFixed(wallet.decimals)} ${wallet.symbol}`,
  };
}

/** USDT / Binance Pay quote (2 decimals, ceil + markup). */
export function quoteUsdt(
  amountLkr: number,
  settings: Pick<CryptoPaymentSettings, 'lkr_per_usd' | 'markup_percent'>,
  usdtUsdPrice = 1,
): { amount: number; formatted: string } {
  const amount = convertLkrToCryptoAmount(amountLkr, usdtUsdPrice > 0 ? usdtUsdPrice : 1, {
    lkrPerUsd: settings.lkr_per_usd,
    markupPercent: settings.markup_percent,
    decimals: 2,
  });
  return { amount, formatted: `${amount.toFixed(2)} USDT` };
}

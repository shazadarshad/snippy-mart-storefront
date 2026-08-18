import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type CurrencyCode = 'LKR' | 'USD' | 'INR';

export interface CurrencyItem {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

/**
 * Catalog is LKR. Display rates sit on real-world FX (not padded 370).
 * 300 LKR ≈ $1 and 86 INR ≈ $1 — so Rs. 4,999 ≈ $16.99 ≈ ₹1,499.
 * Shop-round UP after convert so the store is never short, without a fat markup.
 */
export const LKR_PER_USD = 300;
export const INR_PER_USD = 86;
export const INR_PER_LKR = INR_PER_USD / LKR_PER_USD;

export const CURRENCIES: Record<CurrencyCode, CurrencyItem> = {
  LKR: { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
};

/** Multiplier applied to LKR catalog amounts → display currency */
const RATES: Record<CurrencyCode, number> = {
  LKR: 1,
  USD: 1 / LKR_PER_USD,
  INR: INR_PER_LKR,
};

/** Snap up to n.99 so USD looks like a shop price, never below the raw convert. */
export function charmUsd(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  const floor = Math.floor(usd + 1e-12);
  let candidate = floor + 0.99;
  if (candidate + 1e-12 < usd) candidate += 1;
  return Math.round(candidate * 100) / 100;
}

/** Snap up to xx99 (₹199, ₹1499). */
export function charmInr(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const n = Math.ceil(amount - 1e-10);
  if (n <= 99) return 99;
  if (n % 100 === 99) return n;
  const bucket = Math.floor(n / 100);
  const candidate = bucket * 100 + 99;
  return candidate >= n ? candidate : candidate + 100;
}

/**
 * LKR catalog → shop display.
 * Convert at the store rate, then charm-round UP so:
 *   display × rate ≥ catalog  (no loss)
 *   $16.99 / ₹1,499 not $13.51 / ₹1,750
 */
export function convertLkrToDisplay(amountLkr: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amountLkr) || amountLkr <= 0) return 0;
  if (currency === 'LKR') return Math.ceil(amountLkr - 1e-10);

  if (currency === 'INR') {
    let inr = charmInr(amountLkr * INR_PER_LKR);
    while (inr / INR_PER_LKR + 1e-9 < amountLkr) inr += 100;
    return inr;
  }

  let usd = charmUsd(amountLkr / LKR_PER_USD);
  while (usd * LKR_PER_USD + 1e-9 < amountLkr) usd = Math.round((usd + 1) * 100) / 100;
  return usd;
}

/** Always LKR catalog — what they must send to a Sri Lankan bank. */
export function formatCatalogLkr(amountLkr: number): string {
  return `Rs. ${convertLkrToDisplay(amountLkr, 'LKR').toLocaleString('en-LK')}`;
}

/** Ceiled INR — what they must send via UPI. */
export function formatCatalogInr(amountLkr: number): string {
  return `₹${convertLkrToDisplay(amountLkr, 'INR').toLocaleString('en-IN')}`;
}

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rate: number;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (currency: CurrencyCode | string) => void;
  convertPrice: (priceInLKR: number) => number;
  formatPrice: (priceInLKR: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

function normalizeCurrency(value: string | null | undefined): CurrencyCode {
  const v = String(value || '').toUpperCase();
  if (v === 'USD') return 'USD';
  if (v === 'INR') return 'INR';
  return 'LKR';
}

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window === 'undefined') return 'LKR';
    return normalizeCurrency(localStorage.getItem('preferred-currency'));
  });

  const currencyInfo: CurrencyInfo = useMemo(
    () => ({
      ...CURRENCIES[currency],
      rate: RATES[currency],
    }),
    [currency],
  );

  const setCurrency = (newCurrency: CurrencyCode | string) => {
    const next = normalizeCurrency(newCurrency);
    setCurrencyState(next);
    localStorage.setItem('preferred-currency', next);
  };

  const convertPrice = (priceInLKR: number): number => {
    return convertLkrToDisplay(priceInLKR, currency);
  };

  const formatPrice = (priceInLKR: number): string => {
    const converted = convertPrice(priceInLKR);

    if (currency === 'LKR') {
      return `Rs. ${converted.toLocaleString('en-LK')}`;
    }

    if (currency === 'INR') {
      return `₹${converted.toLocaleString('en-IN')}`;
    }

    // USD — 2 decimals, already ceiled
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        convertPrice,
        formatPrice,
        isLoading: false,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type CurrencyCode = 'LKR' | 'USD' | 'INR';

export interface CurrencyItem {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

/**
 * Catalog prices are stored in LKR.
 *
 * Fixed display rates:
 *   1 USD = 370 LKR (always)
 *   1 LKR = 0.35 INR
 */
export const LKR_PER_USD = 370;
export const INR_PER_LKR = 0.35;
/** Implied: 1 USD ≈ 370 × 0.35 = 129.5 INR (via LKR path) */
export const INR_PER_USD = LKR_PER_USD * INR_PER_LKR;

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

/**
 * Convert LKR catalog → display currency, always rounding UP.
 * Never floor / banker's-round a customer-facing amount or FX can
 * leave the store short (e.g. 1199 LKR → $3.24 would be 1198.80 LKR).
 */
export function convertLkrToDisplay(amountLkr: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amountLkr) || amountLkr <= 0) return 0;
  if (currency === 'LKR') return Math.ceil(amountLkr - 1e-10);
  if (currency === 'INR') return Math.ceil(amountLkr * INR_PER_LKR - 1e-10);
  const usd = amountLkr / LKR_PER_USD;
  return Math.ceil(usd * 100 - 1e-10) / 100;
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

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
 * Anchor rates (display / convert):
 *   1 LKR = 0.35 INR
 *   1 USD = 103 INR
 *   ⇒ 1 USD = 103 / 0.35 ≈ 294.2857 LKR
 */
export const INR_PER_LKR = 0.35;
export const INR_PER_USD = 103;
/** LKR per 1 USD — kept consistent with INR anchors */
export const LKR_PER_USD = INR_PER_USD / INR_PER_LKR;

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
    return priceInLKR * RATES[currency];
  };

  const formatPrice = (priceInLKR: number): string => {
    const converted = convertPrice(priceInLKR);

    if (currency === 'LKR') {
      return `Rs. ${Math.round(converted).toLocaleString('en-LK')}`;
    }

    if (currency === 'INR') {
      return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    }

    // USD — 2 decimals
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

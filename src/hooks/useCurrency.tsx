import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'LKR' | 'EUR' | 'GBP' | 'INR';

interface CurrencyInfo {
    code: Currency;
    symbol: string;
    name: string;
    flag: string;
    rate: number; // Rate relative to USD
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
    LKR: { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰', rate: 320 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83 },
};

interface CurrencyContextType {
    currency: Currency;
    currencyInfo: CurrencyInfo;
    setCurrency: (currency: Currency) => void;
    convertPrice: (priceInUSD: number) => number;
    formatPrice: (priceInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred-currency');
            if (saved && saved in CURRENCIES) {
                return saved as Currency;
            }
        }
        return 'USD';
    });

    const currencyInfo = CURRENCIES[currency];

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('preferred-currency', newCurrency);
    };

    const convertPrice = (priceInUSD: number): number => {
        return priceInUSD * currencyInfo.rate;
    };

    const formatPrice = (priceInUSD: number): string => {
        const converted = convertPrice(priceInUSD);

        // Format based on currency
        if (currency === 'LKR' || currency === 'INR') {
            // Use Indian/Lankan number formatting
            return `${currencyInfo.symbol}${converted.toLocaleString('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })}`;
        }

        return `${currencyInfo.symbol}${converted.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Auto-detect currency based on timezone (simple approach)
    useEffect(() => {
        const saved = localStorage.getItem('preferred-currency');
        if (saved) return; // User has already set preference

        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            if (timezone.includes('Colombo')) {
                setCurrency('LKR');
            } else if (timezone.includes('London')) {
                setCurrency('GBP');
            } else if (timezone.includes('Kolkata') || timezone.includes('Mumbai')) {
                setCurrency('INR');
            } else if (timezone.includes('Paris') || timezone.includes('Berlin') || timezone.includes('Rome')) {
                setCurrency('EUR');
            }
        } catch (e) {
            // Fallback to USD
        }
    }, []);

    return (
        <CurrencyContext.Provider value= {{ currency, currencyInfo, setCurrency, convertPrice, formatPrice }
}>
    { children }
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = string;

export interface CurrencyItem {
    code: string;
    symbol: string;
    name: string;
    flag: string;
}

export const CURRENCIES: Record<string, CurrencyItem> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    LKR: { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    EUR_UAE: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' }, // Manual override for AED
};

// Aliases for better mapping
const CURRENCY_MAP: Record<string, string> = {
    'AED': 'AED',
    'PKR': 'PKR',
    'BDT': 'BDT',
    'CAD': 'CAD',
    'SGD': 'SGD',
};

interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    flag: string;
    rate: number; // Rate relative to LKR
}

interface CurrencyContextType {
    currency: string;
    currencyInfo: CurrencyInfo;
    setCurrency: (currency: string) => void;
    convertPrice: (priceInLKR: number) => number;
    formatPrice: (priceInLKR: number) => string;
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrencyState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred-currency');
            return saved || 'LKR';
        }
        return 'LKR';
    });

    const [rates, setRates] = useState<Record<string, number>>({ LKR: 1 });
    const [isLoading, setIsLoading] = useState(true);

    const currencyInfo: CurrencyInfo = {
        code: currency,
        symbol: CURRENCIES[currency]?.symbol || currency,
        name: CURRENCIES[currency]?.name || currency,
        flag: CURRENCIES[currency]?.flag || '🌐',
        rate: rates[currency] || 1,
    };

    const setCurrency = (newCurrency: string) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('preferred-currency', newCurrency);
    };

    const convertPrice = (priceInLKR: number): number => {
        return priceInLKR * (rates[currency] || 1);
    };

    const formatPrice = (priceInLKR: number): string => {
        const converted = convertPrice(priceInLKR);

        try {
            // Check if currency code exists in Intl
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currency,
                // Adjust fractions for certain currencies
                ...((currency === 'LKR' || currency === 'INR') ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {})
            }).format(converted);
        } catch (e) {
            // Fallback
            const symbol = currencyInfo.symbol;
            return `${symbol} ${converted.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    };

    useEffect(() => {
        const initializeCurrency = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch exchange rates relative to LKR
                const ratesResponse = await fetch('https://open.er-api.com/v6/latest/LKR');
                const ratesData = await ratesResponse.json();

                if (ratesData.result === 'success') {
                    setRates(ratesData.rates);
                }

                // 2. Auto-detect location if no preference exists
                const saved = localStorage.getItem('preferred-currency');
                if (!saved) {
                    const geoResponse = await fetch('https://ipapi.co/json/');
                    const geoData = await geoResponse.json();

                    if (geoData.currency && ratesData.rates[geoData.currency]) {
                        setCurrency(geoData.currency);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize currency/rates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeCurrency();
    }, []);

    return (
        <CurrencyContext.Provider value={{ currency, currencyInfo, setCurrency, convertPrice, formatPrice, isLoading }}>
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

import { useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { Product } from '@/hooks/useProducts';

interface UseSearchAutocompleteOptions {
    products: Product[];
    maxResults?: number;
    threshold?: number;
}

interface SearchResult {
    item: Product;
    score: number;
}

export const useSearchAutocomplete = ({
    products,
    maxResults = 5,
    threshold = 0.4,
}: UseSearchAutocompleteOptions) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fuse = useMemo(() => {
        return new Fuse(products, {
            keys: [
                { name: 'name', weight: 0.7 },
                { name: 'description', weight: 0.2 },
                { name: 'category', weight: 0.1 },
            ],
            threshold,
            includeScore: true,
            minMatchCharLength: 2,
        });
    }, [products, threshold]);

    const search = useCallback((searchQuery: string) => {
        setQuery(searchQuery);

        if (searchQuery.length < 2) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        const searchResults = fuse.search(searchQuery).slice(0, maxResults);
        setResults(searchResults.map(r => ({
            item: r.item,
            score: r.score || 0,
        })));

        setIsSearching(false);
    }, [fuse, maxResults]);

    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
    }, []);

    return {
        query,
        results,
        isSearching,
        search,
        clearSearch,
        hasResults: results.length > 0,
    };
};

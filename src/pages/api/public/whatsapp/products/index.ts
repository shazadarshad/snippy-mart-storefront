// PUBLIC API: GET /api/public/whatsapp/products
// Returns WhatsApp product menu (no auth required)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic to prevent caching issues
export const dynamic = 'force-dynamic';

// Public Supabase client (no auth)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProductMenuItem {
    id: string;
    menuTitle: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ProductMenuItem[] | { error: string }>
) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch enabled WhatsApp products
        const { data, error } = await supabase
            .from('whatsapp_product_config')
            .select(`
        menu_title,
        priority,
        product:products!inner(slug)
      `)
            .eq('enabled', true)
            .order('priority', { ascending: true });

        if (error) {
            console.error('Error fetching WhatsApp products:', error);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }

        // Format for WhatsApp bot
        const products: ProductMenuItem[] = (data || []).map((item: any) => ({
            id: item.product.slug,
            menuTitle: item.menu_title,
        }));

        // Return JSON (never HTML)
        return res.status(200).json(products);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

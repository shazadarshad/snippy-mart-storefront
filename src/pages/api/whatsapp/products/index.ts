// GET /api/whatsapp/products
// Returns list of WhatsApp-enabled products for bot menu

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppProductMenuResponse } from '@/types/whatsapp';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WhatsAppProductMenuResponse[] | { error: string }>
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch enabled WhatsApp products with product details
        const { data, error } = await supabase
            .from('whatsapp_product_config')
            .select(`
        id,
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

        // Format response
        const products: WhatsAppProductMenuResponse[] = (data || []).map((item: any) => ({
            id: item.product.slug,
            menuTitle: item.menu_title,
            priority: item.priority,
        }));

        // Cache for 60 seconds
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

        return res.status(200).json(products);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

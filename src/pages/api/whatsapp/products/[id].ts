// GET /api/whatsapp/products/[id]
// Returns WhatsApp flow for a specific product

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppProductFlowResponse } from '@/types/whatsapp';
import { generateOrderUrl } from '@/utils/whatsapp';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WhatsAppProductFlowResponse | { error: string }>
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
        // Fetch WhatsApp config with product details
        const { data, error } = await supabase
            .from('whatsapp_product_config')
            .select(`
        *,
        product:products!inner(slug, name)
      `)
            .eq('product.slug', id)
            .eq('enabled', true)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Product not found or not enabled for WhatsApp' });
        }

        // Format response
        const response: WhatsAppProductFlowResponse = {
            productId: data.product.slug,
            flowSteps: data.flow_steps || [],
            orderUrl: generateOrderUrl(data.product.slug),
            showOrderLink: data.show_order_link ?? true,
        };

        // Cache for 60 seconds
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

        return res.status(200).json(response);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

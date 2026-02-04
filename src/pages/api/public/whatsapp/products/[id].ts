// PUBLIC API: GET /api/public/whatsapp/products/[id]
// Returns WhatsApp product flow (no auth required)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic to prevent caching issues
export const dynamic = 'force-dynamic';

// Public Supabase client (no auth)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FlowStep {
    title: string;
    message: string;
    delayMs: number;
}

interface ProductFlowResponse {
    productId: string;
    flowSteps: FlowStep[];
    orderUrl: string;
    showOrderLink: boolean;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ProductFlowResponse | { error: string }>
) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
        // Fetch WhatsApp config for this product
        const { data, error } = await supabase
            .from('whatsapp_product_config')
            .select(`
        flow_steps,
        show_order_link,
        product:products!inner(slug, name)
      `)
            .eq('product.slug', id)
            .eq('enabled', true)
            .single();

        if (error || !data) {
            // Product not found or not enabled - return 404 JSON
            return res.status(404).json({ error: 'Product not found or not enabled for WhatsApp' });
        }

        // Build order URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snippymart.com';
        const orderUrl = `${baseUrl}/product/${data.product.slug}`;

        // Format response
        const response: ProductFlowResponse = {
            productId: data.product.slug,
            flowSteps: data.flow_steps || [],
            orderUrl,
            showOrderLink: data.show_order_link ?? true,
        };

        // Return JSON (never HTML)
        return res.status(200).json(response);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

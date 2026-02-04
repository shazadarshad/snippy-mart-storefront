// PUBLIC API: POST /api/public/whatsapp/log
// Logs WhatsApp interactions (no auth required)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Force dynamic to prevent caching issues
export const dynamic = 'force-dynamic';

// Public Supabase client (no auth)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_EVENTS = [
    'PRODUCT_VIEW',
    'ORDER_CLICK',
    'ESCALATION',
    'FALLBACK',
    'MENU_REQUEST',
];

interface LogRequest {
    phone: string;
    event: string;
    productId?: string;
    message?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ success: boolean } | { error: string }>
) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, event, productId, message }: LogRequest = req.body;

    // Validate required fields
    if (!phone || !event) {
        return res.status(400).json({ error: 'Missing required fields: phone and event' });
    }

    if (!VALID_EVENTS.includes(event)) {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    try {
        // Sanitize phone number (remove spaces, dashes, etc.)
        const sanitizedPhone = phone.replace(/[^0-9+]/g, '');

        // Get product ID from slug if provided
        let dbProductId: string | null = null;
        if (productId) {
            const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('slug', productId)
                .single();

            dbProductId = product?.id || null;
        }

        // Insert log entry
        const { error: insertError } = await supabase
            .from('whatsapp_logs')
            .insert({
                phone: sanitizedPhone,
                message: message || null,
                product_id: dbProductId,
                event,
                source: 'whatsapp',
                metadata: {},
            });

        if (insertError) {
            console.error('Error logging WhatsApp event:', insertError);
            return res.status(500).json({ error: 'Failed to log event' });
        }

        // Return success JSON (never HTML)
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

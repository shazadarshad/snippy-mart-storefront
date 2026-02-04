// POST /api/whatsapp/log
// Logs WhatsApp bot interactions

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppLogInput, WhatsAppLogResponse } from '@/types/whatsapp';
import { sanitizePhoneNumber, isValidEventType } from '@/utils/whatsapp';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<WhatsAppLogResponse | { error: string }>
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, message, productId, event, metadata }: WhatsAppLogInput = req.body;

    // Validate required fields
    if (!phone || !event) {
        return res.status(400).json({ error: 'Missing required fields: phone and event' });
    }

    if (!isValidEventType(event)) {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    try {
        // Sanitize phone number
        const sanitizedPhone = sanitizePhoneNumber(phone);

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

        // Insert log
        const { data, error } = await supabase
            .from('whatsapp_logs')
            .insert({
                phone: sanitizedPhone,
                message: message || null,
                product_id: dbProductId,
                event,
                source: 'whatsapp',
                metadata: metadata || {},
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error logging WhatsApp event:', error);
            return res.status(500).json({ error: 'Failed to log event' });
        }

        return res.status(201).json({
            success: true,
            id: data.id,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

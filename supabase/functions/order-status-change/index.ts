import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderStatusChangePayload {
    type: 'INSERT' | 'UPDATE';
    table: string;
    record: {
        id: string;
        status: string;
        customer_name: string;
        customer_email: string;
        total: number;
        currency_code?: string;
        currency_symbol?: string;
        delivery_address?: string;
    };
    old_record?: {
        status: string;
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const payload: OrderStatusChangePayload = await req.json();
        const { record, old_record } = payload;

        console.log('Order status change detected:', {
            orderId: record.id,
            oldStatus: old_record?.status,
            newStatus: record.status,
        });

        // Only send email if status actually changed
        if (old_record && old_record.status === record.status) {
            console.log('Status unchanged, skipping email');
            return new Response(JSON.stringify({ message: 'Status unchanged' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        let templateKey: string | null = null;
        let emailVariables: Record<string, string> = {};

        // Determine which email template to use based on status
        switch (record.status) {
            case 'completed':
                templateKey = 'order_delivered';
                emailVariables = {
                    customer_name: record.customer_name,
                    order_id: record.id,
                    delivery_date: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    delivery_address: record.delivery_address || 'Your registered address',
                    tracking_number: `TRK-${record.id.substring(0, 8).toUpperCase()}`,
                };
                break;

            case 'processing':
            case 'shipped':
                templateKey = 'status_update';
                const statusMessages: Record<string, string> = {
                    processing: 'Your order is being prepared for shipment',
                    shipped: 'Your order is on its way to you!',
                };
                emailVariables = {
                    customer_name: record.customer_name,
                    order_id: record.id,
                    current_status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
                    status_message: statusMessages[record.status] || 'Your order status has been updated',
                    estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    tracking_url: `${Deno.env.get('FRONTEND_URL') || 'https://snippymart.com'}/track?order=${record.id}`,
                };
                break;

            case 'rejected':
            case 'cancelled':
                templateKey = 'payment_rejected';
                const currencySymbol = record.currency_symbol || '$';
                const total = record.total.toFixed(record.currency_code === 'LKR' || record.currency_code === 'INR' ? 0 : 2);
                emailVariables = {
                    customer_name: record.customer_name,
                    order_id: record.id,
                    rejection_reason: record.status === 'rejected' ? 'Payment verification failed' : 'Order cancelled',
                    order_total: `${currencySymbol}${total}`,
                    retry_url: `${Deno.env.get('FRONTEND_URL') || 'https://snippymart.com'}/checkout?retry=${record.id}`,
                };
                break;

            default:
                console.log(`No email template for status: ${record.status}`);
                return new Response(JSON.stringify({ message: 'No email template for this status' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
        }

        if (!templateKey) {
            return new Response(JSON.stringify({ message: 'No template selected' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // Fetch the email template
        const { data: template, error: templateError } = await supabaseClient
            .from('email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single();

        if (templateError || !template) {
            console.error('Template fetch error:', templateError);
            throw new Error(`Email template not found: ${templateKey}`);
        }

        // Replace variables in HTML content
        let htmlContent = template.html_content;
        let subject = template.subject;

        for (const [key, value] of Object.entries(emailVariables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, value);
            subject = subject.replace(regex, value);
        }

        // Send email using Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'Snippy Mart <orders@snippymart.com>',
                to: [record.customer_email],
                subject,
                html: htmlContent,
            }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error('Email send error:', emailResult);
            throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
        }

        console.log('Email sent successfully:', {
            orderId: record.id,
            template: templateKey,
            emailId: emailResult.id,
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Status update email sent',
                template: templateKey,
                emailId: emailResult.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error in order-status-change function:', error);
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload = await req.json();
        const { record, old_record, custom_message } = payload;

        // Support both Webhook (payload.record) and direct manual call (payload.order)
        const order = record || payload.order;
        const oldOrder = old_record || payload.old_order;

        if (!order) {
            return new Response(JSON.stringify({ error: "No order data provided" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Only proceed if status has changed (if we have an old record)
        if (oldOrder && order.status === oldOrder.status && !custom_message) {
            return new Response(JSON.stringify({ message: "Status unchanged" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Only proceed if user has an email
        if (!order.customer_email) {
            return new Response(JSON.stringify({ message: "No customer email" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log(`[Status Change] Order #${order.order_number}: ${oldOrder?.status || 'N/A'} -> ${order.status}`);

        // Determine which template to use based on status
        let templateKey = "status_update"; // Default to status update
        let variables: Record<string, string> = {
            customer_name: order.customer_name || 'Customer',
            order_id: order.order_number,
            current_status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
            status_message: custom_message || `Your order status has been updated to ${order.status}.`,
            estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            tracking_url: `${Deno.env.get('FRONTEND_URL') || 'https://snippymart.com'}/track?order=${order.order_number}`,
        };

        // Custom logic for specific statuses
        if (order.status === 'completed') {
            templateKey = "order_delivered";

            // Try to find the assigned account
            const { data: assignment } = await supabase
                .from('account_assignments')
                .select(`
                    inventory_accounts (
                        email,
                        password,
                        rules_template,
                        service_type
                    )
                `)
                .eq('order_id', order.id)
                .maybeSingle();

            variables = {
                customer_name: order.customer_name || 'Customer',
                order_id: order.order_number,
                delivery_date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                delivery_address: order.delivery_address || 'Your registered address',
                tracking_number: `TRK-${order.order_number.substring(0, 8).toUpperCase()}`,
            };

            if (assignment && (assignment as any).inventory_accounts) {
                const acc = (assignment as any).inventory_accounts;
                // Add credentials info to the message
                variables.delivery_address = `${acc.service_type || 'Subscription'} - Credentials sent separately`;
            }
        }
        else if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'rejected') {
            templateKey = "payment_rejected";
            const currencySymbol = order.currency_symbol || '$';
            const total = order.total ? order.total.toFixed(order.currency_code === 'LKR' || order.currency_code === 'INR' ? 0 : 2) : '0.00';

            variables = {
                customer_name: order.customer_name || 'Customer',
                order_id: order.order_number,
                rejection_reason: custom_message || (order.status === 'cancelled' ? 'Order cancelled' : 'Payment verification failed'),
                order_total: `${currencySymbol}${total}`,
                retry_url: `${Deno.env.get('FRONTEND_URL') || 'https://snippymart.com'}/checkout?retry=${order.order_number}`,
            };
        }
        else if (order.status === 'processing' || order.status === 'shipped') {
            templateKey = "status_update";
            const statusMessages: Record<string, string> = {
                processing: 'Your order is being prepared for shipment',
                shipped: 'Your order is on its way to you!',
            };

            variables = {
                customer_name: order.customer_name || 'Customer',
                order_id: order.order_number,
                current_status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
                status_message: custom_message || statusMessages[order.status] || 'Your order status has been updated',
                estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                tracking_url: `${Deno.env.get('FRONTEND_URL') || 'https://snippymart.com'}/track?order=${order.order_number}`,
            };
        }

        console.log(`[Email] Using template: ${templateKey} for order ${order.order_number}`);

        // Fetch template ID using the new template keys
        const { data: template } = await supabase
            .from("email_templates")
            .select("id")
            .eq("template_key", templateKey)
            .eq("is_active", true)
            .single();

        if (template) {
            console.log(`[Email] Sending email to ${order.customer_email} with template ${templateKey}`);
            await supabase.functions.invoke("send-email", {
                body: {
                    to: order.customer_email,
                    templateId: template.id,
                    orderId: order.id,
                    variables: variables
                }
            });
            console.log(`[Email] Email sent successfully`);
        } else {
            console.error(`[Email] Template not found: ${templateKey}`);
        }

        return new Response(JSON.stringify({
            success: true,
            template: templateKey,
            email_sent: !!template
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Status handler error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

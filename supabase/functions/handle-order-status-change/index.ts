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
            return new Response(JSON.stringify({ error: "No order data provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Only proceed if status has changed (if we have an old record)
        if (oldOrder && order.status === oldOrder.status && !custom_message) {
            return new Response(JSON.stringify({ message: "Status unchanged" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Only proceed if user has an email
        if (!order.customer_email) {
            return new Response(JSON.stringify({ message: "No customer email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        console.log(`[Status Change] Order #${order.order_number}: ${oldOrder?.status || 'N/A'} -> ${order.status}`);

        let templateKey = "order_status_update";
        let variables: Record<string, string> = {
            customer_name: order.customer_name || 'Customer',
            order_id: order.order_number,
            status: order.status,
            message: custom_message || `Your order status has been updated to ${order.status}.`
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

            if (assignment && (assignment as any).inventory_accounts) {
                const acc = (assignment as any).inventory_accounts;
                variables.product_name = acc.service_type || 'Subscription';
                variables.credentials = `<p style="margin: 0; font-family: monospace; font-size: 14px;"><strong>Email:</strong> ${acc.email}</p><p style="margin: 10px 0 0; font-family: monospace; font-size: 14px;"><strong>Password:</strong> ${acc.password}</p>`;
                variables.message = custom_message || acc.rules_template || 'Please follow all usage rules provided on the tracking page.';
            } else {
                variables.product_name = 'Subscription';
                variables.credentials = '<p>Your account access details are ready! You can view them on your live tracking page.</p>';
                variables.message = custom_message || 'Please check the tracking page for usage rules.';
            }
        }
        else if (order.status === 'cancelled' || order.status === 'refunded') {
            templateKey = "payment_rejected";
            variables.message = custom_message || "We were unable to verify your payment or the request was cancelled. If this was a mistake, please contact support.";
        }

        // Fetch template ID
        const { data: template } = await supabase
            .from("email_templates")
            .select("id")
            .eq("template_key", templateKey)
            .single();

        if (template) {
            await supabase.functions.invoke("send-email", {
                body: {
                    to: order.customer_email,
                    templateId: template.id,
                    orderId: order.id,
                    variables: variables
                }
            });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (error: any) {
        console.error("Status handler error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_EVENTS = [
    "PRODUCT_VIEW",
    "ORDER_CLICK",
    "ESCALATION",
    "FALLBACK",
    "MENU_REQUEST",
];

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get request body
        const { phone, event, productId, message } = await req.json();

        // Validate
        if (!phone || !event) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: phone and event" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!VALID_EVENTS.includes(event)) {
            return new Response(
                JSON.stringify({ error: "Invalid event type" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Sanitize phone
        const sanitizedPhone = phone.replace(/[^0-9+]/g, "");

        // Get product ID from slug if provided
        let dbProductId: string | null = null;
        if (productId) {
            const { data: product } = await supabase
                .from("products")
                .select("id")
                .eq("slug", productId)
                .single();

            dbProductId = product?.id || null;
        }

        // Insert log
        const { error: insertError } = await supabase
            .from("whatsapp_logs")
            .insert({
                phone: sanitizedPhone,
                message: message || null,
                product_id: dbProductId,
                event,
                source: "whatsapp",
                metadata: {},
            });

        if (insertError) {
            console.error("Error logging event:", insertError);
            return new Response(
                JSON.stringify({ error: "Failed to log event" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

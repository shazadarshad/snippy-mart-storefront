import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get product ID from URL
        const url = new URL(req.url);
        const productId = url.searchParams.get("id");

        if (!productId) {
            return new Response(
                JSON.stringify({ error: "Product ID is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Fetch product flow
        const { data, error } = await supabase
            .from("whatsapp_product_config")
            .select(`
        flow_steps,
        show_order_link,
        product:products!inner(slug, name)
      `)
            .eq("product.slug", productId)
            .eq("enabled", true)
            .single();

        if (error || !data) {
            return new Response(
                JSON.stringify({ error: "Product not found or not enabled for WhatsApp" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build response
        const baseUrl = Deno.env.get("SITE_URL") || "https://snippymart.com";
        const response = {
            productId: data.product.slug,
            flowSteps: data.flow_steps || [],
            orderUrl: `${baseUrl}/product/${data.product.slug}`,
            showOrderLink: data.show_order_link ?? true,
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

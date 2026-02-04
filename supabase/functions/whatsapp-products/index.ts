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
        // Create Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Fetch enabled WhatsApp products
        const { data, error } = await supabase
            .from("whatsapp_product_config")
            .select(`
        menu_title,
        priority,
        product:products!inner(slug)
      `)
            .eq("enabled", true)
            .order("priority", { ascending: true });

        if (error) {
            console.error("Error fetching products:", error);
            return new Response(
                JSON.stringify({ error: "Failed to fetch products" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Format response
        const products = (data || []).map((item: any) => ({
            id: item.product.slug,
            menuTitle: item.menu_title,
        }));

        return new Response(JSON.stringify(products), {
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

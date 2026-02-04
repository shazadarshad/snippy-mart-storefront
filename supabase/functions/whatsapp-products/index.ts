import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Fetch WhatsApp-enabled products with FULL details
        const { data: whatsappProducts, error: configError } = await supabaseClient
            .from("whatsapp_product_config")
            .select(`
        *,
        product:products!inner(
          id,
          name,
          slug,
          description,
          features,
          category,
          price,
          compare_at_price,
          stock_status,
          image_url,
          created_at
        )
      `)
            .eq("enabled", true)
            .order("display_order", { ascending: true });

        if (configError) {
            throw configError;
        }

        if (!whatsappProducts || whatsappProducts.length === 0) {
            return new Response(
                JSON.stringify([]),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200
                }
            );
        }

        // Fetch variants for all products
        const productIds = whatsappProducts.map((wp: any) => wp.product.id);

        const { data: variants, error: variantsError } = await supabaseClient
            .from("product_variants")
            .select("*")
            .in("product_id", productIds)
            .eq("active", true)
            .order("display_order", { ascending: true });

        if (variantsError) {
            console.error("Error fetching variants:", variantsError);
        }

        // Build complete product data
        const completeProducts = whatsappProducts.map((wp: any) => {
            const product = wp.product;
            const productVariants = variants?.filter((v: any) => v.product_id === product.id) || [];

            // Build comprehensive product info for AI
            let productInfo = `## ${product.name}\n\n`;

            // Price information
            if (productVariants.length > 0) {
                productInfo += `**Pricing Options:**\n`;
                productVariants.forEach((variant: any) => {
                    productInfo += `• ${variant.name}: LKR ${variant.price.toLocaleString('en-US')}`;
                    if (variant.duration) {
                        productInfo += ` (${variant.duration})`;
                    }
                    productInfo += `\n`;
                });
                productInfo += `\n`;
            } else {
                productInfo += `**Price**: LKR ${product.price.toLocaleString('en-US')}\n`;
                if (product.compare_at_price && product.compare_at_price > product.price) {
                    const discount = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
                    productInfo += `~~LKR ${product.compare_at_price.toLocaleString('en-US')}~~ (${discount}% OFF!)\n`;
                }
                productInfo += `\n`;
            }

            // Description
            if (product.description) {
                productInfo += `**Description:**\n${product.description}\n\n`;
            }

            // Features
            if (product.features) {
                productInfo += `**Features:**\n`;
                const featuresList = product.features.split('\n').filter((f: string) => f.trim());
                featuresList.forEach((feature: string) => {
                    productInfo += `• ${feature.trim()}\n`;
                });
                productInfo += `\n`;
            }

            // Category
            if (product.category) {
                productInfo += `**Category**: ${product.category}\n\n`;
            }

            // Stock status
            if (product.stock_status) {
                const statusEmoji = product.stock_status === 'in_stock' ? '✅' :
                    product.stock_status === 'low_stock' ? '⚠️' : '❌';
                const statusText = product.stock_status.replace('_', ' ').toUpperCase();
                productInfo += `**Availability**: ${statusEmoji} ${statusText}\n\n`;
            }

            // Requirements
            if (wp.requirements) {
                productInfo += `**Requirements:**\n${wp.requirements}\n\n`;
            } else {
                productInfo += `**Requirements:**\nEmail address only\n\n`;
            }

            // Delivery info
            productInfo += `**Delivery:**\nDigital delivery within 24 hours (usually much faster)\n\n`;

            // Credentials
            productInfo += `**What You Get:**\nFresh new account with credentials sent via email\n\n`;

            // Product link (VERIFIED URL)
            productInfo += `**Order Link:**\nhttps://snippymart.com/product/${product.slug}\n`;

            return {
                id: product.id,
                name: product.name,
                slug: product.slug,
                menuTitle: wp.menu_title,
                triggerKeywords: wp.trigger_keywords || [],
                category: product.category,
                price: product.price,
                variants: productVariants.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    price: v.price,
                    duration: v.duration,
                    sku: v.sku
                })),
                productInfo: productInfo,
                imageUrl: product.image_url,
                orderUrl: `https://snippymart.com/product/${product.slug}`,
                displayOrder: wp.display_order
            };
        });

        return new Response(
            JSON.stringify(completeProducts),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );

    } catch (error) {
        console.error("Error in whatsapp-products:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500
            }
        );
    }
});
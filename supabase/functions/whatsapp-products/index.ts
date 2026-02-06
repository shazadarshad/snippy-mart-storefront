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

        // Fetch WhatsApp-enabled products with COMPLETE details from main products table
        const { data: whatsappProducts, error: configError } = await supabaseClient
            .from("whatsapp_product_config")
            .select(`
                id,
                enabled,
                menu_title,
                trigger_keywords,
                requirements,
                display_order,
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
                    image_url
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

        // Fetch pricing plans for these products
        const productIds = whatsappProducts.map((wp: any) => wp.product.id);

        const { data: pricingPlans, error: plansError } = await supabaseClient
            .from("product_pricing_plans")
            .select("*")
            .in("product_id", productIds)
            .eq("is_active", true);

        if (plansError) {
            console.error("Error fetching pricing plans:", plansError);
        }

        // Fetch all variants for these pricing plans
        const planIds = pricingPlans?.map((p: any) => p.id) || [];

        const { data: planVariants, error: variantsError } = await supabaseClient
            .from("product_pricing_plan_variants")
            .select("*")
            .in("plan_id", planIds)
            .eq("is_active", true)
            .order("price", { ascending: true }); // Order by price low to high

        if (variantsError) {
            console.error("Error fetching plan variants:", variantsError);
        }

        console.log("Fetched products:", whatsappProducts.length);
        console.log("Fetched pricing plans:", pricingPlans?.length || 0);
        console.log("Fetched plan variants:", planVariants?.length || 0);

        // Build complete product data with ACCURATE information
        const completeProducts = whatsappProducts.map((wp: any) => {
            const product = wp.product;

            // Get pricing plans for this product
            const productPlans = pricingPlans?.filter((p: any) => p.product_id === product.id) || [];

            // Get all variants for these plans
            let allVariants: any[] = [];
            productPlans.forEach((plan: any) => {
                const variants = planVariants?.filter((v: any) => v.plan_id === plan.id) || [];
                variants.forEach((variant: any) => {
                    allVariants.push({
                        name: `${plan.duration} - ${variant.name}`,
                        price: variant.price,
                        duration: plan.duration,
                        planName: plan.name,
                        variantName: variant.name
                    });
                });
            });

            // If no variants, use plans directly
            if (allVariants.length === 0 && productPlans.length > 0) {
                allVariants = productPlans.map((plan: any) => ({
                    name: plan.duration || plan.name,
                    price: plan.price,
                    duration: plan.duration
                }));
            }

            console.log(`Product: ${product.name}, Variants:`, allVariants.length);

            // Build comprehensive product info for AI
            let productInfo = `## ${product.name}\n\n`;

            // Price information - SHOW ALL VARIANTS
            if (allVariants.length > 0) {
                productInfo += `**Pricing Options:**\n`;
                allVariants.forEach((variant: any) => {
                    productInfo += `• ${variant.name}: LKR ${variant.price.toLocaleString('en-US')}`;
                    if (variant.duration && !variant.name.includes(variant.duration)) {
                        productInfo += ` (${variant.duration})`;
                    }
                    productInfo += `\n`;
                });
                productInfo += `\n`;
            } else {
                // Fallback to base price if no variants
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

            // Payment methods - ACCURATE info
            productInfo += `**Payment Methods:**\n`;
            productInfo += `• Bank Transfer (Instant)\n`;
            productInfo += `• Binance USDT (Instant)\n`;
            productInfo += `• Card Payment (Contact team for secure link - Type HUMAN)\n\n`;

            // Delivery info
            productInfo += `**Delivery:**\nDigital delivery within 24 hours (usually much faster)\n\n`;

            // What you get
            productInfo += `**What You Get:**\nFresh new account with credentials sent via email\n\n`;

            // CORRECT product page URL
            productInfo += `**Order Link:**\nhttps://snippymart.com/products/${product.slug}\n`;

            return {
                id: product.id,
                name: product.name,
                slug: product.slug,
                menuTitle: wp.menu_title,
                triggerKeywords: wp.trigger_keywords || [],
                category: product.category,
                price: product.price,
                variants: allVariants.map((v: any) => ({
                    name: v.name,
                    price: v.price,
                    duration: v.duration
                })),
                productInfo: productInfo,
                imageUrl: product.image_url,
                orderUrl: `https://snippymart.com/products/${product.slug}`,
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
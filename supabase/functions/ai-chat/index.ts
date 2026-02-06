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
        const { message, history } = await req.json();

        if (!message) {
            throw new Error("Message is required");
        }

        // Initialize Supabase
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Fetch all active products with pricing plans
        const { data: products, error: productsError } = await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                slug,
                description,
                features,
                category,
                price,
                stock_status,
                image_url,
                product_pricing_plans (
                    id,
                    name,
                    duration,
                    price,
                    is_active,
                    product_pricing_plan_variants (
                        id,
                        name,
                        price,
                        is_active
                    )
                )
            `)
            .eq("is_active", true)
            .order("name");

        if (productsError) {
            console.error("Products fetch error:", productsError);
        }

        // Build knowledge base
        let knowledgeBase = `# SNIPPY MART COMPLETE PRODUCT CATALOG\n\n`;
        knowledgeBase += `**Website**: https://snippymart.com\n`;
        knowledgeBase += `**Currency**: Sri Lankan Rupees (LKR) ONLY\n\n`;
        knowledgeBase += `**CRITICAL RULES**:\n`;
        knowledgeBase += `1. ONLY use information from this database\n`;
        knowledgeBase += `2. NEVER use $ - ONLY LKR\n`;
        knowledgeBase += `3. If info is missing, say "I don't have that specific detail"\n`;
        knowledgeBase += `4. NEVER guess or hallucinate prices\n\n`;

        if (products && products.length > 0) {
            products.forEach((product: any) => {
                knowledgeBase += `## ${product.name}\n\n`;
                knowledgeBase += `**Category**: ${product.category || 'Digital Services'}\n`;
                knowledgeBase += `**Product Page**: https://snippymart.com/products/${product.slug}\n\n`;

                if (product.description) {
                    knowledgeBase += `**Description**: ${product.description}\n\n`;
                }

                // Pricing
                if (product.product_pricing_plans && product.product_pricing_plans.length > 0) {
                    knowledgeBase += `**Pricing Options**:\n`;
                    product.product_pricing_plans.forEach((plan: any) => {
                        if (plan.is_active) {
                            if (plan.product_pricing_plan_variants && plan.product_pricing_plan_variants.length > 0) {
                                plan.product_pricing_plan_variants.forEach((variant: any) => {
                                    if (variant.is_active) {
                                        knowledgeBase += `• ${plan.duration} - ${variant.name}: LKR ${variant.price.toLocaleString('en-US')}\n`;
                                    }
                                });
                            } else {
                                knowledgeBase += `• ${plan.duration || plan.name}: LKR ${plan.price.toLocaleString('en-US')}\n`;
                            }
                        }
                    });
                    knowledgeBase += `\n`;
                } else if (product.price) {
                    knowledgeBase += `**Price**: LKR ${product.price.toLocaleString('en-US')}\n\n`;
                }

                if (product.features) {
                    knowledgeBase += `**Features**:\n`;
                    const featuresList = product.features.split('\n').filter((f: string) => f.trim());
                    featuresList.forEach((feature: string) => {
                        knowledgeBase += `• ${feature.trim()}\n`;
                    });
                    knowledgeBase += `\n`;
                }

                if (product.stock_status) {
                    const statusEmoji = product.stock_status === 'in_stock' ? '✅' : '⚠️';
                    knowledgeBase += `**Availability**: ${statusEmoji} ${product.stock_status.replace('_', ' ').toUpperCase()}\n\n`;
                }

                knowledgeBase += `---\n\n`;
            });
        }

        knowledgeBase += `## Store Information\n\n`;
        knowledgeBase += `**Payment Methods**:\n`;
        knowledgeBase += `• Bank Transfer (Instant)\n`;
        knowledgeBase += `• Binance USDT (Instant)\n`;
        knowledgeBase += `• Card Payment (Contact support for secure link)\n\n`;
        knowledgeBase += `**Delivery**: Digital delivery within 24 hours\n`;
        knowledgeBase += `**Account Type**: Fresh new accounts with credentials via email\n`;
        knowledgeBase += `**Support**: Available via WhatsApp during business hours (4-6 PM, 8-10 PM)\n\n`;

        // Build conversation history for context
        const conversationMessages = history?.map((msg: any) => ({
            role: msg.role,
            content: msg.content
        })) || [];

        // Call OpenAI
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are the Snippy Mart AI Assistant - a helpful, professional expert on digital services.

${knowledgeBase}

**Response Guidelines**:
1. **Accuracy First**: Only use information from the knowledge base above
2. **Currency**: Always use LKR, never $
3. **Honesty**: If you don't know something, say "I don't have that specific information"
4. **Formatting**: Use **bold** for emphasis, emojis for friendliness (✅🚀💻📧)
5. **Concise**: Keep responses under 300 characters when possible
6. **Helpful**: End with a clear next step or question

**For Ordering Questions**:
- Direct users to snippymart.com/products
- Mention payment methods: Bank Transfer & Binance USDT (instant)
- For card payment, tell them to contact support

**For Product Questions**:
- Use exact prices from knowledge base
- List all available variants/plans
- Include product page link

**If Unsure**: "I don't have that detail. You can check our products page at snippymart.com/products or contact our support team!"

Be friendly, professional, and always accurate. Never make up information.`
                    },
                    ...conversationMessages,
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.3,
                max_tokens: 400
            })
        });

        if (!openaiResponse.ok) {
            throw new Error("OpenAI API error");
        }

        const openaiData = await openaiResponse.json();
        const aiResponse = openaiData.choices[0].message.content;

        // Anti-hallucination check
        if (aiResponse.includes("$") && !knowledgeBase.includes("$")) {
            return new Response(
                JSON.stringify({
                    response: "I don't have exact pricing for that. Please check our products page at snippymart.com/products for the latest LKR rates! ✅"
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200
                }
            );
        }

        return new Response(
            JSON.stringify({ response: aiResponse }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );

    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({
                response: "I'm having a small technical issue. Please visit snippymart.com/products or try again in a moment! 🚀"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );
    }
});

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
                knowledgeBase += `**Product Page**: https://snippymart.com/products/${product.slug}\n`;

                // Stock Status - PROMINENT
                if (product.stock_status) {
                    let statusText = '';
                    let statusEmoji = '';

                    if (product.stock_status === 'in_stock') {
                        statusEmoji = '✅';
                        statusText = 'IN STOCK - Available for immediate order';
                    } else if (product.stock_status === 'limited_stock') {
                        statusEmoji = '⚠️';
                        statusText = 'LIMITED STOCK - Order soon!';
                    } else if (product.stock_status === 'out_of_stock') {
                        statusEmoji = '❌';
                        statusText = 'OUT OF STOCK - Currently unavailable';
                    } else {
                        statusEmoji = '⏳';
                        statusText = 'COMING SOON';
                    }

                    knowledgeBase += `**Availability**: ${statusEmoji} ${statusText}\n\n`;
                }

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

                knowledgeBase += `---\n\n`;
            });
        }

        // Fetch custom AI knowledge items
        const { data: customKnowledge } = await supabaseClient
            .from("ai_knowledge_items")
            .select("*")
            .eq("is_active", true)
            .order("priority", { ascending: false });

        if (customKnowledge && customKnowledge.length > 0) {
            knowledgeBase += `## Custom Product Knowledge\n\n`;

            // Group by category
            const productDetails = customKnowledge.filter(k => k.category === 'product_detail');
            const faqs = customKnowledge.filter(k => k.category === 'faq');
            const general = customKnowledge.filter(k => k.category === 'general');

            if (productDetails.length > 0) {
                knowledgeBase += `**Product-Specific Details**:\n`;
                productDetails.forEach(item => {
                    knowledgeBase += `• ${item.key}: ${item.value}\n`;
                });
                knowledgeBase += `\n`;
            }

            if (faqs.length > 0) {
                knowledgeBase += `**Custom FAQs**:\n`;
                faqs.forEach(item => {
                    if (item.question && item.answer) {
                        knowledgeBase += `Q: ${item.question}\n`;
                        knowledgeBase += `A: ${item.answer}\n\n`;
                    }
                });
            }

            if (general.length > 0) {
                knowledgeBase += `**Additional Information**:\n`;
                general.forEach(item => {
                    knowledgeBase += `• ${item.key}: ${item.value}\n`;
                });
                knowledgeBase += `\n`;
            }
        }

        knowledgeBase += `## Store Information\n\n`;
        knowledgeBase += `**Payment Methods**:\n`;
        knowledgeBase += `• Bank Transfer (Instant)\n`;
        knowledgeBase += `• Binance USDT (Instant)\n`;
        knowledgeBase += `• Card Payment (Contact support for secure link)\n\n`;
        knowledgeBase += `**Delivery**: Digital delivery within 24 hours (usually faster)\n`;
        knowledgeBase += `**Account Type**: Fresh new accounts with credentials via email\n\n`;

        knowledgeBase += `## Contact Information\n\n`;
        knowledgeBase += `**WhatsApp**: +94-78-776-7869 (Primary support channel)\n`;
        knowledgeBase += `**Email**: hello@snippymart.com\n`;
        knowledgeBase += `**Instagram**: @snippymartofficial\n`;
        knowledgeBase += `**Website**: https://snippymart.com\n\n`;

        knowledgeBase += `**Support Hours**:\n`;
        knowledgeBase += `• 4:00 PM – 6:00 PM (Sri Lanka Time)\n`;
        knowledgeBase += `• 8:00 PM – 10:00 PM (Sri Lanka Time)\n`;
        knowledgeBase += `• Messages outside hours will be reviewed during next available slot\n\n`;

        knowledgeBase += `## Privacy & Policies\n\n`;
        knowledgeBase += `**Privacy Policy**:\n`;
        knowledgeBase += `• We collect: Name, WhatsApp number, email, payment info\n`;
        knowledgeBase += `• We use it for: Order processing, confirmations, customer support\n`;
        knowledgeBase += `• We DO NOT sell or share your data with third parties\n`;
        knowledgeBase += `• Full policy: https://snippymart.com/privacy-policy\n\n`;

        knowledgeBase += `**Refund Policy**:\n`;
        knowledgeBase += `• Digital products - No refunds after delivery\n`;
        knowledgeBase += `• Account issues - We provide replacements/fixes\n`;
        knowledgeBase += `• Payment issues - Contact within 24 hours\n`;
        knowledgeBase += `• Full policy: https://snippymart.com/refund-policy\n\n`;

        knowledgeBase += `**Terms of Service**:\n`;
        knowledgeBase += `• Accounts are for personal use only\n`;
        knowledgeBase += `• No reselling of purchased accounts\n`;
        knowledgeBase += `• We deliver fresh accounts with valid credentials\n`;
        knowledgeBase += `• Full terms: https://snippymart.com/terms-of-service\n\n`;

        knowledgeBase += `## How to Order\n\n`;
        knowledgeBase += `**Step 1**: Visit https://snippymart.com/products\n`;
        knowledgeBase += `**Step 2**: Choose your product and plan\n`;
        knowledgeBase += `**Step 3**: Add to cart and proceed to checkout\n`;
        knowledgeBase += `**Step 4**: Fill in your details (Name, WhatsApp, Email)\n`;
        knowledgeBase += `**Step 5**: Choose payment method:\n`;
        knowledgeBase += `   • Bank Transfer - Get instant bank details\n`;
        knowledgeBase += `   • Binance USDT - Get wallet address\n`;
        knowledgeBase += `   • Card Payment - Contact support for secure link\n`;
        knowledgeBase += `**Step 6**: Complete payment and send confirmation\n`;
        knowledgeBase += `**Step 7**: Receive account credentials via email within 24 hours\n\n`;

        knowledgeBase += `## Frequently Asked Questions\n\n`;
        knowledgeBase += `**Q: Are accounts fresh/new?**\n`;
        knowledgeBase += `A: Yes, all accounts are brand new with valid credentials.\n\n`;

        knowledgeBase += `**Q: How long does delivery take?**\n`;
        knowledgeBase += `A: Usually within 24 hours, often much faster during business hours.\n\n`;

        knowledgeBase += `**Q: What if account doesn't work?**\n`;
        knowledgeBase += `A: Contact us immediately on WhatsApp (+94-78-776-7869) and we'll provide a replacement.\n\n`;

        knowledgeBase += `**Q: Can I pay with card?**\n`;
        knowledgeBase += `A: Yes! Contact our support team and we'll send you a secure payment link.\n\n`;

        knowledgeBase += `**Q: Do you offer refunds?**\n`;
        knowledgeBase += `A: Digital products are non-refundable after delivery, but we provide replacements for any issues.\n\n`;

        knowledgeBase += `**Q: How do I contact support?**\n`;
        knowledgeBase += `A: WhatsApp: +94-78-776-7869 (fastest) or Email: hello@snippymart.com\n\n`;

        knowledgeBase += `## Social Media\n\n`;
        knowledgeBase += `**Instagram**: @snippymartofficial - Follow for updates and promotions\n`;
        knowledgeBase += `**WhatsApp**: +94-78-776-7869 - Direct support and orders\n\n`;

        knowledgeBase += `## Important Notes\n\n`;
        knowledgeBase += `• All prices are in Sri Lankan Rupees (LKR)\n`;
        knowledgeBase += `• We operate from Sri Lanka\n`;
        knowledgeBase += `• Delivery is 100% digital (no physical products)\n`;
        knowledgeBase += `• Accounts come with login credentials via email\n`;
        knowledgeBase += `• For urgent issues, WhatsApp is fastest (+94-78-776-7869)\n\n`;

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
                        content: `You are the Snippy Mart AI Assistant - a helpful, professional expert on digital services and subscription accounts.

${knowledgeBase}

**Response Guidelines**:
1. **Accuracy First**: Only use information from the knowledge base above - NEVER make up information
2. **Currency**: Always use LKR, never $ (this is critical!)
3. **Honesty**: If you don't know something, say "I don't have that specific information" and direct to support
4. **Formatting**: Use **bold** for emphasis, emojis for friendliness (✅🚀💻📧📱)
5. **Links**: Use markdown format [text](url) for all links
6. **Concise**: Keep responses clear and under 400 characters when possible
7. **Helpful**: Always end with a clear next step, question, or call-to-action

**For Product Questions**:
- Use exact prices from knowledge base (LKR only!)
- List all available plans/variants with prices
- Include product page link: [product name](https://snippymart.com/products/slug)
- Mention key features if relevant
- Example: "**Cursor Pro** 💻\n\n• 1 Month Shared: LKR 2,999\n• 1 Month Private: LKR 3,999\n\nOrder: [snippymart.com/products/cursor-pro](https://snippymart.com/products/cursor-pro)"

**For Ordering Questions**:
- Direct to [snippymart.com/products](https://snippymart.com/products)
- Mention payment methods: **Bank Transfer** & **Binance USDT** (instant)
- For card payment: "Contact support on WhatsApp for secure link"
- Explain the 7-step ordering process if asked

**For Contact/Support Questions**:
- **WhatsApp**: +94-78-776-7869 (primary, fastest)
- **Email**: hello@snippymart.com
- **Instagram**: @snippymartofficial
- **Support Hours**: 4-6 PM & 8-10 PM (Sri Lanka Time)
- Always mention WhatsApp is the fastest way to reach support

**For Policy Questions**:
- **Privacy**: We don't sell data, only use for orders/support. Link: [Privacy Policy](https://snippymart.com/privacy-policy)
- **Refunds**: No refunds after delivery, but we provide replacements. Link: [Refund Policy](https://snippymart.com/refund-policy)
- **Terms**: Personal use only, no reselling. Link: [Terms of Service](https://snippymart.com/terms-of-service)

**For FAQ-type Questions**:
- Check the FAQ section in knowledge base first
- Provide direct, clear answers
- Include relevant contact info if they need more help

**For Social Media Questions**:
- Instagram: @snippymartofficial
- WhatsApp: +94-78-776-7869
- Encourage following for updates and promotions

**If Completely Unsure**: 
"I don't have that specific detail. Please check [our products page](https://snippymart.com/products) or contact support on WhatsApp: +94-78-776-7869 📱"

**Tone**: Friendly, professional, helpful, and confident. Use emojis sparingly but effectively. Be conversational but authoritative.

**CRITICAL**: Never hallucinate prices, features, or policies. If it's not in the knowledge base, admit you don't know and direct to support.`
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

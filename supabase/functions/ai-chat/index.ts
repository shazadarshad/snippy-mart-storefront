import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatLkr(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (!Number.isFinite(n)) return "N/A";
  return `LKR ${n.toLocaleString("en-US")}`;
}

function stockLabel(status: string | null | undefined): string {
  switch (status) {
    case "in_stock":
      return "✅ IN STOCK — Available to order";
    case "limited":
      return "⚠️ LIMITED STOCK — Order soon";
    case "out_of_stock":
      return "❌ OUT OF STOCK — Currently unavailable";
    default:
      return status ? `Status: ${status}` : "Availability not listed";
  }
}

function requirementsLabel(req: any): string {
  if (!req || typeof req !== "object") {
    return "No special account credentials required at checkout (unless listed in description).";
  }
  const needEmail = !!req.require_email;
  const needPassword = !!req.require_password;
  const needUsername = !!req.require_username;
  if (!needEmail && !needPassword && !needUsername) {
    return "No customer account login required at checkout for this product.";
  }
  const parts: string[] = [];
  if (needEmail) parts.push("customer email");
  if (needPassword) parts.push("customer password");
  if (needUsername) parts.push("username");
  return `Checkout requires: ${parts.join(" + ")}. Customer provides these so we can fulfill on their account (or as described).`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Active catalog — include requirements & fulfillment for accurate answers
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select(`
                id,
                name,
                slug,
                description,
                category,
                price,
                old_price,
                stock_status,
                requirements,
                manual_fulfillment,
                is_featured,
                display_order,
                product_pricing_plans (
                    id,
                    name,
                    duration,
                    price,
                    old_price,
                    is_default,
                    product_pricing_plan_variants (
                        id,
                        name,
                        price,
                        old_price,
                        is_active,
                        stock_status
                    )
                )
            `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (productsError) {
      console.error("Products fetch error:", productsError);
    }

    // Product names for custom knowledge lookup
    const productNameById = new Map<string, string>();
    (products || []).forEach((p: any) => productNameById.set(p.id, p.name));

    let knowledgeBase = `# SNIPPY MART COMPLETE PRODUCT CATALOG\n\n`;
    knowledgeBase += `**Website**: https://snippymart.com\n`;
    knowledgeBase += `**Products list**: https://snippymart.com/products\n`;
    knowledgeBase += `**Currency**: Sri Lankan Rupees (LKR) ONLY — never quote USD unless the product name itself includes a $ credit amount.\n\n`;
    knowledgeBase += `**CRITICAL RULES**:\n`;
    knowledgeBase += `1. ONLY use information from this knowledge base\n`;
    knowledgeBase += `2. Prices are ALWAYS in LKR (e.g. LKR 2,599)\n`;
    knowledgeBase += `3. If a detail is missing, say you don't have it and suggest WhatsApp support\n`;
    knowledgeBase += `4. NEVER invent prices, plans, warranties, or requirements\n`;
    knowledgeBase += `5. Product page URL format: https://snippymart.com/product/{slug}\n\n`;

    if (products && products.length > 0) {
      knowledgeBase += `## Full Catalog (${products.length} active products)\n\n`;

      products.forEach((product: any) => {
        knowledgeBase += `### ${product.name}\n`;
        knowledgeBase += `**Category**: ${product.category || "Digital Services"}\n`;
        knowledgeBase += `**Slug**: ${product.slug}\n`;
        knowledgeBase += `**Product Page**: https://snippymart.com/product/${product.slug}\n`;
        knowledgeBase += `**Availability**: ${stockLabel(product.stock_status)}\n`;
        knowledgeBase += `**Checkout requirements**: ${requirementsLabel(product.requirements)}\n`;
        knowledgeBase += `**Fulfillment**: ${
          product.manual_fulfillment
            ? "Manual fulfillment (team processes after payment)"
            : "Automated / standard digital fulfillment where applicable"
        }\n`;

        if (product.is_featured) {
          knowledgeBase += `**Featured**: Yes\n`;
        }

        // Pricing — plans have NO is_active column; include all plans
        const plans = product.product_pricing_plans || [];
        if (plans.length > 0) {
          knowledgeBase += `**Pricing options**:\n`;
          plans.forEach((plan: any) => {
            const variants = (plan.product_pricing_plan_variants || []).filter(
              (v: any) => v.is_active !== false,
            );
            if (variants.length > 0) {
              variants.forEach((variant: any) => {
                knowledgeBase += `• ${plan.name || plan.duration || "Plan"} — ${variant.name}: ${formatLkr(variant.price)}\n`;
              });
            } else {
              const label = [plan.name, plan.duration].filter(Boolean).join(" · ") || "Plan";
              knowledgeBase += `• ${label}: ${formatLkr(plan.price)}\n`;
            }
          });
          // Also show base product price as starting reference if useful
          if (product.price != null) {
            knowledgeBase += `**Listed base price**: ${formatLkr(product.price)}\n`;
          }
        } else if (product.price != null) {
          knowledgeBase += `**Price**: ${formatLkr(product.price)}`;
          if (product.old_price) {
            knowledgeBase += ` (was ${formatLkr(product.old_price)})`;
          }
          knowledgeBase += `\n`;
        }

        if (product.description) {
          // Keep description but cap extreme length for prompt size
          const desc = String(product.description).trim();
          const clipped = desc.length > 1200 ? `${desc.slice(0, 1200)}…` : desc;
          knowledgeBase += `**Description**:\n${clipped}\n`;
        }

        knowledgeBase += `\n---\n\n`;
      });
    } else {
      knowledgeBase += `## Full Catalog\nNo active products loaded. Direct customers to https://snippymart.com/products\n\n`;
    }

    // Custom AI knowledge (admin training + auto-trained product notes)
    const { data: customKnowledge } = await supabaseClient
      .from("ai_knowledge_items")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (customKnowledge && customKnowledge.length > 0) {
      knowledgeBase += `## Custom / Trained Knowledge\n\n`;

      const productDetails = customKnowledge.filter((k) => k.category === "product_detail");
      const faqs = customKnowledge.filter((k) => k.category === "faq");
      const general = customKnowledge.filter((k) => k.category === "general" || k.category === "policy");

      if (productDetails.length > 0) {
        knowledgeBase += `### Product-specific training notes\n`;
        productDetails.forEach((item) => {
          const pname = item.product_id ? productNameById.get(item.product_id) : null;
          const prefix = pname ? `[${pname}] ` : "";
          knowledgeBase += `• ${prefix}${item.key}: ${item.value}\n`;
        });
        knowledgeBase += `\n`;
      }

      if (faqs.length > 0) {
        knowledgeBase += `### Custom FAQs\n`;
        faqs.forEach((item) => {
          if (item.question && item.answer) {
            const pname = item.product_id ? productNameById.get(item.product_id) : null;
            knowledgeBase += `Q${pname ? ` (${pname})` : ""}: ${item.question}\n`;
            knowledgeBase += `A: ${item.answer}\n\n`;
          } else if (item.key && item.value) {
            knowledgeBase += `• ${item.key}: ${item.value}\n`;
          }
        });
      }

      if (general.length > 0) {
        knowledgeBase += `### Store policies & general notes\n`;
        general.forEach((item) => {
          knowledgeBase += `• ${item.key}: ${item.value}\n`;
        });
        knowledgeBase += `\n`;
      }
    }

    knowledgeBase += `## Store Information\n\n`;
    knowledgeBase += `**Payment Methods**:\n`;
    knowledgeBase += `• Bank Transfer\n`;
    knowledgeBase += `• Binance USDT\n`;
    knowledgeBase += `• Card Payment (secure link via support / Dialog Genie when available)\n\n`;
    knowledgeBase += `**Delivery**: Digital delivery — often within hours; typically within 24 hours during support windows (some products note 7–10 days).\n`;
    knowledgeBase += `**Fulfillment types**: Private accounts, redeem codes, on-mail activation, or upgrade of customer's own account — depends on product.\n\n`;

    knowledgeBase += `## Contact Information\n\n`;
    knowledgeBase += `**WhatsApp**: +94-78-776-7869 (primary support)\n`;
    knowledgeBase += `**Email**: hello@snippymart.com\n`;
    knowledgeBase += `**Instagram**: @snippymartofficial\n`;
    knowledgeBase += `**Website**: https://snippymart.com\n\n`;
    knowledgeBase += `**Support Hours (Sri Lanka Time)**:\n`;
    knowledgeBase += `• 4:00 PM – 6:00 PM\n`;
    knowledgeBase += `• 8:00 PM – 10:00 PM\n`;
    knowledgeBase += `• Messages outside hours are reviewed in the next available slot\n\n`;

    knowledgeBase += `## Policies (summary)\n\n`;
    knowledgeBase += `**Privacy**: We collect order/contact data for fulfillment only; we do not sell data. Full: https://snippymart.com/privacy-policy\n`;
    knowledgeBase += `**Refunds**: Digital goods generally non-refundable after delivery; limited exceptions for non-delivery/major defects. Products marked Non Warranty / No Warranty are never refundable after delivery. Full: https://snippymart.com/refund-policy\n`;
    knowledgeBase += `**Terms**: Personal use; no reselling. Full: https://snippymart.com/terms-of-service\n\n`;

    knowledgeBase += `## How to Order\n\n`;
    knowledgeBase += `1. Browse https://snippymart.com/products\n`;
    knowledgeBase += `2. Open the product page and choose plan/variant if any\n`;
    knowledgeBase += `3. Checkout with name, WhatsApp, email\n`;
    knowledgeBase += `4. Provide any required account credentials if the product asks for them\n`;
    knowledgeBase += `5. Pay via Bank Transfer / USDT / Card\n`;
    knowledgeBase += `6. Wait for digital delivery / activation as listed for that product\n\n`;

    knowledgeBase += `## Quick FAQs\n\n`;
    knowledgeBase += `**Q: Are accounts fresh?** A: Many products are private/shared accounts or codes; follow each product description.\n`;
    knowledgeBase += `**Q: Delivery time?** A: Usually within 24 hours; some upgrades take longer if noted.\n`;
    knowledgeBase += `**Q: Account not working?** A: Contact WhatsApp +94-78-776-7869 for replacement/support.\n`;
    knowledgeBase += `**Q: Card payment?** A: Yes — support can share a secure payment link.\n`;
    knowledgeBase += `**Q: Refunds?** A: No refunds after successful digital delivery; we help with replacements for issues.\n\n`;

    const conversationMessages = history?.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are the Snippy Mart AI Assistant — expert on Snippy Mart digital products and subscriptions.

${knowledgeBase}

**Response Guidelines**:
1. **Accuracy**: Only use the knowledge base. Never invent prices or plans.
2. **Currency**: Always LKR for store prices (e.g. LKR 2,599).
3. **Honesty**: If unknown, say so and point to WhatsApp +94-78-776-7869.
4. **Formatting**: Use **bold**, short bullets, light emojis. Keep under ~450 characters when possible unless listing multiple plans.
5. **Links**: Markdown links. Product URL = https://snippymart.com/product/{slug}
6. **Requirements**: If a product needs email/password at checkout, state that clearly.
7. **CTA**: End with a next step (order link or WhatsApp).

**CRITICAL**: Never hallucinate. If it's not in the knowledge base, admit it.`,
          },
          ...conversationMessages,
          { role: "user", content: message },
        ],
        temperature: 0.25,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      throw new Error("OpenAI API error");
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Soft anti-hallucination: stray $ prices when KB is LKR-focused
    if (/\b\$\d/.test(aiResponse) && !/Credits|\$1,000|\$25|\$50|\$100|\$15/.test(aiResponse)) {
      return new Response(
        JSON.stringify({
          response:
            "Please check exact LKR pricing on our products page: https://snippymart.com/products — or WhatsApp +94-78-776-7869 for a quote. ✅",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Something went wrong",
        response:
          "Sorry — I'm having trouble right now. Please try again or WhatsApp +94-78-776-7869 📱",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});

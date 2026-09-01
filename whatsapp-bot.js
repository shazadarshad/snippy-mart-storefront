import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ type: "*/*" }));

// ================= CONFIG =================
const WASENDER_SESSION_KEY = process.env.WASENDER_SESSION_KEY;
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || "94787767869").split(",");
const SEND_URL = "https://api.wasenderapi.com/api/send-message";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Supabase
const SUPABASE_URL = "https://aioyoxnjukfibsogegdb.supabase.co/functions/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA0ODAsImV4cCI6MjEwMzgyNjQ4MH0.4XrFwZgyTQ00HSyUVlxpluKL9XFBs15hmMzOrIEtepc";

// Initialize OpenAI
let openai = null;
if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// State
const botUsers = new Set();
const handledMessages = new Map();
const conversationHistory = new Map();
const humanHandling = new Map();
const blockedUsers = new Set();
let productKnowledgeBase = "";

function isAdmin(phone) {
    return ADMIN_NUMBERS.includes(phone);
}

// Auto-cleanup
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [msgId, timestamp] of handledMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
            handledMessages.delete(msgId);
        }
    }

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [user, history] of conversationHistory.entries()) {
        if (history.lastUpdate < oneHourAgo) {
            conversationHistory.delete(user);
        }
    }

    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [user, timestamp] of humanHandling.entries()) {
        if (timestamp < twoHoursAgo) {
            humanHandling.delete(user);
        }
    }
}, 5 * 60 * 1000);

// ================= LOAD COMPLETE PRODUCT DATA WITH VARIANTS =================
async function loadProductKnowledge() {
    try {
        console.log("📚 Loading complete product data with variants...");

        const res = await fetch(`${SUPABASE_URL}/whatsapp-products`, {
            headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });

        if (!res.ok) {
            console.error("❌ Failed to load products");
            return;
        }

        const products = await res.json();

        if (!products || products.length === 0) {
            console.warn("⚠️ No WhatsApp-enabled products found");
            productKnowledgeBase = "No products available yet.";
            return;
        }

        let knowledge = `# Snippy Mart - Complete Product Catalog\n\n`;
        knowledge += `Below is COMPLETE and ACCURATE product information from snippymart.com database.\n`;
        knowledge += `You MUST use ONLY this information. DO NOT make assumptions or add details.\n\n`;

        products.forEach((product) => {
            knowledge += product.productInfo;
            knowledge += `\n${'='.repeat(70)}\n\n`;
        });

        knowledge += `## Store Information:\n\n`;
        knowledge += `**Website**: snippymart.com\n`;
        knowledge += `**Currency**: All prices in Sri Lankan Rupees (LKR)\n\n`;
        knowledge += `**Payment Methods**:\n`;
        knowledge += `• Bank Transfer (Available now)\n`;
        knowledge += `• Binance USDT (Available now)\n`;
        knowledge += `• Card Payment (Contact team for secure link)\n\n`;
        knowledge += `**Delivery**: Digital delivery within 24 hours (usually faster)\n`;
        knowledge += `**Account Type**: Fresh new accounts, no credential sharing\n`;
        knowledge += `**Support**: Available via WhatsApp\n\n`;

        knowledge += `## ⚠️ CRITICAL RULES:\n\n`;
        knowledge += `1. **ONLY use information from above** - NEVER make assumptions\n`;
        knowledge += `2. **Product links**: Use EXACT URLs from above (snippymart.com/product/SLUG)\n`;
        knowledge += `3. **Prices**: Use EXACT prices from above in LKR format with commas\n`;
        knowledge += `4. **Variants**: If product has variants, mention ALL pricing options\n`;
        knowledge += `5. **If info missing**: Say "I don't have that detail. Type *HUMAN* for our team!"\n`;
        knowledge += `6. **Formatting**: Use line breaks between points for readability\n`;
        knowledge += `7. **Be honest**: "I'm not sure" is better than guessing\n`;
        knowledge += `8. **Product not listed**: Say "We don't have that via WhatsApp. Type *HUMAN*!"\n`;

        productKnowledgeBase = knowledge;
        console.log("✅ Loaded", products.length, "products with complete variant data");

        global.allProducts = products;

    } catch (err) {
        console.error("❌ Knowledge error:", err.message);
    }
}

loadProductKnowledge();

// ================= AI EXPERT =================
async function askProductExpert(userPhone, userMessage) {
    if (!openai) {
        return "I'm in basic mode. Type *MENU* for products or *HUMAN* for support!";
    }

    try {
        const orderingKeywords = [
            'how to buy', 'how to order', 'how to purchase', 'how do i buy',
            'how can i order', 'payment', 'pay', 'checkout', 'card payment',
            'credit card', 'debit card', 'buy this', 'want to buy',
            'place order', 'how to get', 'payment methods', 'how can i pay'
        ];

        const lowerMsg = userMessage.toLowerCase();
        if (orderingKeywords.some(kw => lowerMsg.includes(kw))) {
            return "ORDER_INFO";
        }

        const escalationKeywords = [
            'human', 'person', 'talk to someone', 'speak to',
            'representative', 'agent', 'support', 'help me',
            'contact', 'admin', 'manager', 'real person',
            'not helpful', 'confused', "don't understand"
        ];

        if (escalationKeywords.some(kw => lowerMsg.includes(kw))) {
            return "ESCALATE";
        }

        if (!conversationHistory.has(userPhone)) {
            conversationHistory.set(userPhone, {
                messages: [],
                lastUpdate: Date.now()
            });
        }

        const conversation = conversationHistory.get(userPhone);
        conversation.lastUpdate = Date.now();

        const messages = [
            {
                role: "system",
                content: `You are a helpful product expert for Snippy Mart, Sri Lanka's digital service provider.

${productKnowledgeBase}

## Response Formatting Rules:
1. **Use line breaks** between different points for easy reading
2. **Bold** important info like prices and key features
3. **Emojis** to make it friendly (✅ 🚀 💻 📧 💳)
4. **Keep it organized** - one point per line when listing
5. **Maximum 400 characters** - be concise but complete
6. **Currency**: Always "LKR X,XXX" format (never $)

## How to Answer Questions:

**Price/Variant Questions:**
- Check product database above
- List ALL variant options if available
- Use EXACT prices from database
- If detail missing: "I don't have that info. Type *HUMAN*!"

**Feature Questions:**
- Use ONLY features listed in database
- Don't assume or add unlisted features
- If unsure: "For detailed features, type *HUMAN*!"

**Ordering Questions:**
- Direct to snippymart.com/products/
- Mention payment methods: Bank Transfer & Binance USDT (Instant)
- Card payment: Type *HUMAN* and our team will provide a secure payment link.

**Product Not Listed:**
- "We don't have that via WhatsApp. Type *HUMAN* to check!"

## Example Responses:

User: "How much is Cursor Pro?"
You: "**Cursor Pro** 💻

**Pricing Options:**
(List the options exactly as shown in the database above)

**Features:**
• Unlimited AI autocomplete
• Built-in chat
• Multi-file editing

Order at:
snippymart.com/products/cursor-pro 🚀

Reply *MENU* for more!"

User: "What's included in ChatGPT?"
You: "**ChatGPT Plus** ✅

(Use exact price and features from the database above)

**Requirements:** Email only 📧

Order at:
snippymart.com/products/chatgpt-plus

Reply *MENU* for more products!"

## Remember:
- **Never make up** information or prices not in database
- **Use line breaks** between different points
- **Be honest** when you don't know
- **Exact URLs** from database only (usually snippymart.com/products/slug)
- **End with action** (MENU, HUMAN, or product link)`
            },
            ...conversation.messages.slice(-4),
            {
                role: "user",
                content: userMessage
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.6,
            max_tokens: 250,
        });

        const aiResponse = completion.choices[0].message.content;

        conversation.messages.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: aiResponse }
        );

        if (conversation.messages.length > 8) {
            conversation.messages = conversation.messages.slice(-8);
        }

        console.log("🤖 AI:", aiResponse.substring(0, 60));
        return aiResponse;
    } catch (err) {
        console.error("❌ AI Error:", err.message);
        return null;
    }
}

// ================= HELPERS =================
function extractCore(body) {
    try {
        const msg = body?.data?.messages;
        if (!msg) return null;

        return {
            id: msg.id || msg?.key?.id,
            from: msg.cleanedSenderPn || msg?.key?.cleanedSenderPn,
            text: msg.message?.conversation || msg.messageBody || null,
            sessionId: body.sessionId || body.data?.sessionId,
            buttonResponse: msg.message?.buttonsResponseMessage?.selectedButtonId || null,
            fromMe: msg.key?.fromMe || msg.fromMe || false
        };
    } catch {
        return null;
    }
}

async function send(payload) {
    const res = await fetch(SEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WASENDER_SESSION_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    return res.ok;
}

async function sendText(sessionId, to, text) {
    return send({
        sessionId,
        to,
        type: "text",
        text
    });
}

async function sendWithButtons(sessionId, to, text, buttons) {
    const success = await send({
        sessionId,
        to,
        type: "buttons",
        text: text,
        buttons: buttons.map((btn, idx) => ({
            id: `btn_${idx}_${btn.id}`,
            text: btn.text
        }))
    });

    if (!success) {
        await sendText(sessionId, to, text);
    }

    return success;
}

// ================= API CALLS =================
async function getProducts() {
    try {
        if (global.allProducts && global.allProducts.length > 0) {
            return global.allProducts;
        }

        const res = await fetch(`${SUPABASE_URL}/whatsapp-products`, {
            headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });

        if (!res.ok) return null;
        const data = await res.json();

        global.allProducts = Array.isArray(data) ? data : null;
        return global.allProducts;
    } catch {
        return null;
    }
}

async function getProductFlow(productId) {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/whatsapp-product-flow?id=${productId}`,
            { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function logEvent(phone, event, productId = null, message = null) {
    try {
        await fetch(`${SUPABASE_URL}/whatsapp-log`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ phone, event, productId, message })
        });
    } catch { }
}

// ================= BOT ACTIONS =================
async function sendMenu(sessionId, to) {
    const products = await getProducts();

    if (!products || products.length === 0) {
        await sendText(sessionId, to, "⚠️ No products available. Type *HUMAN* for support.");
        return;
    }

    let menuText = "🛍️ *Snippy Mart Products*\n\n";
    menuText += "_Reply with number to view:_\n\n";

    products.forEach((p, index) => {
        menuText += `${index + 1}️⃣ ${p.menuTitle}\n`;
    });

    menuText += `\n💬 *Ask me anything!*\n`;
    menuText += "_Type *HUMAN* for support_";

    await sendWithButtons(sessionId, to, menuText, [
        { id: "human", text: "💬 Talk to Team" }
    ]);

    await logEvent(to, "MENU_REQUEST");
    if (!global.userProducts) global.userProducts = new Map();
    global.userProducts.set(to, products);
}

async function sendProductFlow(sessionId, to, productId) {
    const flow = await getProductFlow(productId);
    if (!flow) {
        await sendText(sessionId, to, "⚠️ Product not found. Type *MENU* to try again.");
        return;
    }

    await logEvent(to, "PRODUCT_VIEW", productId);

    for (const step of flow.flowSteps) {
        await sendText(sessionId, to, `*${step.title}*\n\n${step.message}`);
        if (step.delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, step.delayMs));
        }
    }

    if (flow.showOrderLink && flow.orderUrl) {
        await sendWithButtons(sessionId, to,
            `👉 *Order Now*\n${flow.orderUrl}\n\n_Questions? Just ask!_`,
            [
                { id: "menu", text: "🛍️ More Products" },
                { id: "human", text: "💬 Talk to Team" }
            ]
        );
        await logEvent(to, "ORDER_CLICK", productId);
    }
}

async function sendOrderingInfo(sessionId, to) {
    const orderMsg = "🛍️ *How to Order on Snippy Mart*\n\n" +
        "1️⃣ Visit our website:\n" +
        "🌐 *snippymart.com*\n\n" +
        "2️⃣ Choose your product and checkout\n\n" +
        "💳 *Payment Options:*\n\n" +
        "✅ Bank Transfer (Available now)\n" +
        "✅ Binance USDT (Available now)\n" +
        "💳 Card Payment (Contact us for secure link)\n\n" +
        "_For card payment, type *HUMAN* and our team will send you a secure payment link!_\n\n" +
        "Reply *MENU* to browse products! 🚀";

    await sendWithButtons(sessionId, to, orderMsg, [
        { id: "menu", text: "🛍️ View Products" },
        { id: "human", text: "💬 Card Payment" }
    ]);
}

async function escalateToHuman(sessionId, to) {
    humanHandling.set(to, Date.now());

    await sendText(
        sessionId,
        to,
        "👤 *Connecting to support...*\n\n" +
        "✅ Our team will respond shortly.\n\n" +
        "_Feel free to continue chatting!_"
    );

    await logEvent(to, "ESCALATION");
    console.log("🆘 Escalated:", to);
}

async function activateBot(sessionId, to) {
    botUsers.add(to);
    humanHandling.delete(to);

    const welcomeMsg = "🤖 *Snippy Mart AI Assistant*\n\n" +
        "✅ I'm here to help!\n\n" +
        "💬 *Ask me about:*\n" +
        "• Products & features\n" +
        "• Pricing (LKR)\n" +
        "• Requirements & delivery\n" +
        "• How to order\n\n" +
        "📱 *Commands:*\n" +
        "• *MENU* - Browse products\n" +
        "• *HUMAN* - Talk to team\n" +
        "• *STOP* - Exit bot";

    await sendWithButtons(sessionId, to, welcomeMsg, [
        { id: "menu", text: "🛍️ Products" },
        { id: "human", text: "💬 Support" }
    ]);

    console.log("✅ Activated:", to);
}

async function deactivateBot(sessionId, to) {
    botUsers.delete(to);
    humanHandling.delete(to);
    conversationHistory.delete(to);
    if (global.userProducts) global.userProducts.delete(to);

    await sendText(sessionId, to, "👋 *Bot Deactivated*\n\n_Send *SNIPPY* to reactivate_");
    console.log("✅ Deactivated:", to);
}

// ================= ADMIN COMMANDS =================
async function handleAdminCommand(sessionId, from, text) {
    const cmd = text.toLowerCase().trim();

    if (cmd.startsWith('/resume ')) {
        const targetPhone = cmd.split(' ')[1];
        humanHandling.delete(targetPhone);
        await sendText(sessionId, from, `✅ Bot resumed for ${targetPhone}`);
        await sendText(sessionId, targetPhone, "🤖 *Bot resumed!* Reply *MENU* for products!");
        return true;
    }

    if (cmd.startsWith('/block ')) {
        const targetPhone = cmd.split(' ')[1];
        blockedUsers.add(targetPhone);
        botUsers.delete(targetPhone);
        await sendText(sessionId, from, `🚫 Blocked ${targetPhone}`);
        return true;
    }

    if (cmd.startsWith('/unblock ')) {
        const targetPhone = cmd.split(' ')[1];
        blockedUsers.delete(targetPhone);
        await sendText(sessionId, from, `✅ Unblocked ${targetPhone}`);
        return true;
    }

    if (cmd.startsWith('/info ')) {
        const targetPhone = cmd.split(' ')[1];
        const info = `📊 *User: ${targetPhone}*\n\n` +
            `Bot Mode: ${botUsers.has(targetPhone) ? '✅' : '❌'}\n` +
            `Human: ${humanHandling.has(targetPhone) ? '✅' : '❌'}\n` +
            `Blocked: ${blockedUsers.has(targetPhone) ? '🚫' : '❌'}\n` +
            `AI Chat: ${conversationHistory.has(targetPhone) ? '✅' : '❌'}`;
        await sendText(sessionId, from, info);
        return true;
    }

    if (cmd === '/stats') {
        const stats = `📊 *Bot Stats*\n\n` +
            `👥 Active: ${botUsers.size}\n` +
            `🤝 Human: ${humanHandling.size}\n` +
            `🚫 Blocked: ${blockedUsers.size}\n` +
            `💬 Chats: ${conversationHistory.size}\n` +
            `🤖 AI: ${openai ? '✅' : '❌'}`;
        await sendText(sessionId, from, stats);
        return true;
    }

    if (cmd.startsWith('/broadcast ')) {
        const message = text.substring('/broadcast '.length);
        let sent = 0;
        for (const user of botUsers) {
            await sendText(sessionId, user, `📢 *Announcement*\n\n${message}`);
            sent++;
        }
        await sendText(sessionId, from, `✅ Sent to ${sent} users`);
        return true;
    }

    if (cmd === '/help' || cmd === '/commands') {
        const help = `🔧 *Admin Commands*\n\n` +
            `👤 User Control:\n` +
            `• /resume {phone}\n` +
            `• /block {phone}\n` +
            `• /unblock {phone}\n` +
            `• /info {phone}\n\n` +
            `📊 System:\n` +
            `• /stats\n` +
            `• /broadcast {msg}\n` +
            `• /reload\n` +
            `• /help`;
        await sendText(sessionId, from, help);
        return true;
    }

    if (cmd === '/reload') {
        await loadProductKnowledge();
        await sendText(sessionId, from, "✅ Products reloaded!");
        return true;
    }

    return false;
}

// ================= WEBHOOK =================
app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const core = extractCore(req.body);
    if (!core || !core.id || !core.from || core.fromMe) return;

    const now = Date.now();
    if (handledMessages.has(core.id)) {
        const age = now - handledMessages.get(core.id);
        if (age < 60000) return;
    }
    handledMessages.set(core.id, now);

    const { sessionId, from, text, buttonResponse } = core;

    if (isAdmin(from) && text && text.startsWith('/')) {
        const handled = await handleAdminCommand(sessionId, from, text);
        if (handled) return;
    }

    if (isAdmin(from) && text && !text.startsWith('/')) {
        return;
    }

    if (blockedUsers.has(from)) return;

    if (humanHandling.has(from)) {
        humanHandling.set(from, Date.now());
        return;
    }

    if (buttonResponse) {
        if (buttonResponse.includes('menu')) {
            await sendMenu(sessionId, from);
            return;
        }
        if (buttonResponse.includes('human')) {
            await escalateToHuman(sessionId, from);
            return;
        }
    }

    if (text) {
        const lowerText = text.toLowerCase().trim();

        if (lowerText === "snippy" || lowerText === "bot" || lowerText === "start") {
            await activateBot(sessionId, from);
            return;
        }

        if (lowerText === "stop" || lowerText === "exit") {
            await deactivateBot(sessionId, from);
            return;
        }

        if (lowerText === "human" || lowerText === "support" || lowerText === "help") {
            if (!botUsers.has(from)) botUsers.add(from);
            await escalateToHuman(sessionId, from);
            return;
        }
    }

    if (!botUsers.has(from)) return;
    if (!text) return;

    const lowerText = text.toLowerCase().trim();

    if (lowerText === "menu") {
        await sendMenu(sessionId, from);
        return;
    }

    const numberMatch = text.match(/^(\d+)$/);
    if (numberMatch && global.userProducts?.has(from)) {
        const index = parseInt(numberMatch[1]) - 1;
        const userProductList = global.userProducts.get(from);

        if (index >= 0 && index < userProductList.length) {
            await sendProductFlow(sessionId, from, userProductList[index].id);
            return;
        }
    }

    const products = await getProducts();
    if (products) {
        const match = products.find(p =>
            lowerText.includes(p.id.toLowerCase()) ||
            p.menuTitle.toLowerCase().includes(lowerText) ||
            (p.triggerKeywords && p.triggerKeywords.some(kw => lowerText.includes(kw.toLowerCase())))
        );

        if (match) {
            await sendProductFlow(sessionId, from, match.id);
            return;
        }
    }

    console.log("🤖 AI:", text.substring(0, 40));
    await logEvent(from, "AI_QUERY", null, text);

    const aiResponse = await askProductExpert(from, text);

    if (aiResponse === "ESCALATE") {
        await escalateToHuman(sessionId, from);
    } else if (aiResponse === "ORDER_INFO") {
        await sendOrderingInfo(sessionId, from);
    } else if (aiResponse) {
        await sendText(sessionId, from, aiResponse);
    } else {
        await sendText(sessionId, from, "I'm having trouble. Type *HUMAN* for support or *MENU* for products!");
    }
});

// ================= ENDPOINTS =================
app.get("/", (_, res) => {
    res.json({
        status: "online",
        service: "Snippy Mart AI Bot",
        version: "3.0.1",
        ai: openai ? "enabled" : "disabled",
        activeUsers: botUsers.size,
        humanHandling: humanHandling.size,
        products: global.allProducts?.length || 0,
        admins: ADMIN_NUMBERS.length
    });
});

app.post("/reload", async (req, res) => {
    await loadProductKnowledge();
    res.json({
        success: true,
        products: global.allProducts?.length || 0
    });
});

// ================= START =================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SNIPPY MART AI BOT - PRODUCTION v3.0.1");
    console.log(`📡 Port: ${PORT}`);
    console.log(`🤖 AI: ${openai ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`👥 Admins: ${ADMIN_NUMBERS.join(', ')}`);
    console.log(`📚 Products: ${global.allProducts?.length || 'Loading...'}`);
    console.log("✅ READY!");
});

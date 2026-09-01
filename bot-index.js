import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ type: "*/*" }));

// ============================================================================
// CONFIGURATION
// ============================================================================
const WASENDER_SESSION_KEY = process.env.WASENDER_SESSION_KEY;
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || "94787767869").split(",");
const SEND_URL = "https://api.wasenderapi.com/api/send-message";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Supabase
const SUPABASE_URL = "https://aioyoxnjukfibsogegdb.supabase.co/functions/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3lveG5qdWtmaWJzb2dlZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA0ODAsImV4cCI6MjEwMzgyNjQ4MH0.4XrFwZgyTQ00HSyUVlxpluKL9XFBs15hmMzOrIEtepc";

// OpenAI
let openai = null;
if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const botUsers = new Set();
const handledMessages = new Map();
const conversationHistory = new Map();
const humanHandling = new Map();
const blockedUsers = new Set();
const autoRepliedUsers = new Map(); // Track who got auto-reply in current offline window
let productKnowledgeBase = "";
let currentBusinessHoursState = null; // Track current business hours window

// ============================================================================
// BUSINESS HOURS LOGIC
// ============================================================================
function isWithinBusinessHours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

    // Business hours: 4:00 PM – 6:00 PM (16:00 - 18:00) and 8:00 PM – 10:00 PM (20:00 - 22:00)
    const slot1Start = 16 * 60; // 4:00 PM
    const slot1End = 18 * 60;   // 6:00 PM
    const slot2Start = 20 * 60; // 8:00 PM
    const slot2End = 22 * 60;   // 10:00 PM

    const isOnline = (currentTime >= slot1Start && currentTime < slot1End) ||
        (currentTime >= slot2Start && currentTime < slot2End);

    return isOnline;
}

function getCurrentBusinessWindow() {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 16 && hours < 18) return "slot1";
    if (hours >= 20 && hours < 22) return "slot2";
    return "offline";
}

// Reset auto-reply tracking when business hours change
function checkAndResetAutoReplies() {
    const currentWindow = getCurrentBusinessWindow();

    if (currentWindow !== currentBusinessHoursState) {
        if (currentWindow !== "offline") {
            // Business hours started - clear all auto-reply flags
            autoRepliedUsers.clear();
            console.log(`✅ Business hours started (${currentWindow}). Auto-reply tracking reset.`);
        }
        currentBusinessHoursState = currentWindow;
    }
}

// Check every minute
setInterval(checkAndResetAutoReplies, 60000);

function isAdmin(phone) {
    return ADMIN_NUMBERS.includes(phone);
}

// ============================================================================
// AUTO-CLEANUP
// ============================================================================
setInterval(() => {
    const now = Date.now();

    // Clear handled messages older than 5 minutes
    for (const [msgId, timestamp] of handledMessages.entries()) {
        if (now - timestamp > 300000) handledMessages.delete(msgId);
    }

    // Clear conversation history older than 1 hour
    for (const [user, history] of conversationHistory.entries()) {
        if (now - history.lastUpdate > 3600000) conversationHistory.delete(user);
    }

    // Clear human handling older than 2 hours
    for (const [user, timestamp] of humanHandling.entries()) {
        if (now - timestamp > 7200000) humanHandling.delete(user);
    }
}, 300000);

// ============================================================================
// PRODUCT KNOWLEDGE SYNC
// ============================================================================
async function loadProductKnowledge() {
    try {
        console.log("📚 Loading product data from Supabase...");

        const res = await fetch(`${SUPABASE_URL}/whatsapp-products`, {
            headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });

        if (!res.ok) throw new Error("Failed to fetch products");

        const products = await res.json();

        if (!products || products.length === 0) {
            productKnowledgeBase = "No products available.";
            return;
        }

        let knowledge = `# SNIPPY MART PRODUCT CATALOG\n\n`;
        knowledge += `**STRICT RULES**: ONLY use LKR. NEVER use $. NEVER guess prices.\n\n`;

        products.forEach((p) => {
            knowledge += p.productInfo;
            knowledge += `\n${'='.repeat(70)}\n\n`;
        });

        knowledge += `## Store Information\n\n`;
        knowledge += `**Website**: https://snippymart.com\n`;
        knowledge += `**Currency**: Sri Lankan Rupees (LKR) ONLY\n`;
        knowledge += `**Payment**: Bank Transfer, Binance USDT (instant)\n`;
        knowledge += `**Card Payment**: User must type *HUMAN* for secure link\n`;
        knowledge += `**Delivery**: Digital delivery within 24 hours\n\n`;

        productKnowledgeBase = knowledge;
        global.allProducts = products;

        console.log(`✅ Loaded ${products.length} products`);
    } catch (err) {
        console.error("❌ Product sync error:", err.message);
    }
}

loadProductKnowledge();

// ============================================================================
// AI EXPERT
// ============================================================================
async function askProductExpert(userPhone, userMessage) {
    if (!openai) return "I'm in basic mode. Type *MENU* for products!";

    try {
        const lowerMsg = userMessage.toLowerCase();

        // Quick intent detection
        if (['human', 'support', 'help', 'person'].some(k => lowerMsg.includes(k))) return "ESCALATE";
        if (['buy', 'order', 'pay', 'checkout'].some(k => lowerMsg.includes(k))) return "ORDER_INFO";

        if (!conversationHistory.has(userPhone)) {
            conversationHistory.set(userPhone, { messages: [], lastUpdate: Date.now() });
        }

        const conversation = conversationHistory.get(userPhone);
        conversation.lastUpdate = Date.now();

        const systemPrompt = `You are the Snippy Mart Product Expert.

${productKnowledgeBase}

**CRITICAL RULES**:
1. If a price/feature is NOT in the database above, say "I don't have that info. Type *HUMAN*!"
2. NEVER use $ - ONLY LKR
3. NEVER guess or hallucinate prices
4. Use URLs: snippymart.com/products/slug
5. Payment: Bank/Binance instant, Card needs *HUMAN*

**Style**: Professional, use **bold**, emojis (✅🚀💻), line breaks for clarity.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...conversation.messages.slice(-4),
            { role: "user", content: userMessage }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.3,
            max_tokens: 300,
        });

        let aiResponse = completion.choices[0].message.content;

        // Anti-hallucination check
        if (aiResponse.includes("$") && !productKnowledgeBase.includes("$")) {
            return "I don't have exact pricing for that. Type *HUMAN* for our team! ✅";
        }

        conversation.messages.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: aiResponse }
        );

        if (conversation.messages.length > 8) {
            conversation.messages = conversation.messages.slice(-8);
        }

        return aiResponse;
    } catch (err) {
        console.error("❌ AI Error:", err.message);
        return null;
    }
}

// ============================================================================
// WHATSAPP API HELPERS
// ============================================================================
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
    } catch { return null; }
}

async function send(payload) {
    try {
        const res = await fetch(SEND_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${WASENDER_SESSION_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        return res.ok;
    } catch { return false; }
}

async function sendText(sessionId, to, text) {
    return send({ sessionId, to, type: "text", text });
}

async function sendWithButtons(sessionId, to, text, buttons) {
    const success = await send({
        sessionId, to, type: "buttons", text,
        buttons: buttons.map((btn, idx) => ({ id: `btn_${idx}_${btn.id}`, text: btn.text }))
    });
    if (!success) await sendText(sessionId, to, text);
    return success;
}

// ============================================================================
// AUTO-REPLY SYSTEM (BUSINESS HOURS ENFORCEMENT)
// ============================================================================
async function sendOfflineAutoReply(sessionId, from) {
    // Check if already sent auto-reply in this offline window
    if (autoRepliedUsers.has(from)) {
        console.log(`⏭️ Skipping auto-reply for ${from} - already sent in this window`);
        return false;
    }

    const autoReplyMessage = `Hi 👋

Thanks for reaching out.

We're currently *offline* and operate strictly during fixed support hours to ensure quality service.

🕓 *Support Hours:*
• 4:00 PM – 6:00 PM
• 8:00 PM – 10:00 PM

Messages sent outside these hours will be reviewed during the next available slot.
Repeated messages won't speed up responses.

🛒 *To place new orders, please visit:*
https://snippymart.com

🤖 *For service details, FAQs, and instant answers, please use the AI Chat on our website* — it's available 24/7 and explains everything clearly.

Thank you for your patience.`;

    const success = await sendText(sessionId, from, autoReplyMessage);

    if (success) {
        autoRepliedUsers.set(from, Date.now());
        console.log(`✅ Auto-reply sent to ${from}`);
    }

    return success;
}

// ============================================================================
// BOT ACTIONS
// ============================================================================
async function sendMenu(sessionId, to) {
    if (!global.allProducts || global.allProducts.length === 0) await loadProductKnowledge();
    const products = global.allProducts;

    if (!products || products.length === 0) {
        return sendText(sessionId, to, "⚠️ Catalog updating. Type *HUMAN* for help!");
    }

    let menuText = "🛍️ *Snippy Mart - Product Catalog*\n\n";
    menuText += "_Reply with number to view:_\n\n";

    products.forEach((p, index) => {
        menuText += `${index + 1}️⃣ ${p.menuTitle}\n`;
    });

    menuText += `\n💬 *Ask me anything!*\n`;
    menuText += "_Type *HUMAN* for support_";

    await sendWithButtons(sessionId, to, menuText, [{ id: "human", text: "💬 Talk to Team" }]);

    if (!global.userProducts) global.userProducts = new Map();
    global.userProducts.set(to, products);
}

async function escalateToHuman(sessionId, to) {
    humanHandling.set(to, Date.now());

    await sendText(sessionId, to,
        "👤 *Connecting to support...*\n\n" +
        "✅ Our team will respond shortly.\n\n" +
        "_Feel free to continue chatting!_"
    );

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

// ============================================================================
// ADMIN COMMANDS
// ============================================================================
async function handleAdminCommand(sessionId, from, text) {
    const cmd = text.toLowerCase().trim();
    const parts = text.split(' ');

    if (cmd === '/reload') {
        await loadProductKnowledge();
        await sendText(sessionId, from, "✅ Products reloaded!");
        return true;
    }

    if (cmd === '/stats') {
        const stats = `📊 *Bot Stats*\n\n` +
            `👥 Active: ${botUsers.size}\n` +
            `🤝 Human: ${humanHandling.size}\n` +
            `🚫 Blocked: ${blockedUsers.size}\n` +
            `💬 Chats: ${conversationHistory.size}\n` +
            `🤖 AI: ${openai ? '✅' : '❌'}\n` +
            `🕓 Business Hours: ${isWithinBusinessHours() ? 'ONLINE' : 'OFFLINE'}\n` +
            `📧 Auto-replied: ${autoRepliedUsers.size}`;
        await sendText(sessionId, from, stats);
        return true;
    }

    if (cmd.startsWith('/resume ')) {
        const target = parts[1];
        humanHandling.delete(target);
        await sendText(sessionId, from, `✅ Bot resumed for ${target}`);
        await sendText(sessionId, target, "🤖 *Bot resumed!* Reply *MENU* for products!");
        return true;
    }

    if (cmd.startsWith('/block ')) {
        const target = parts[1];
        blockedUsers.add(target);
        botUsers.delete(target);
        await sendText(sessionId, from, `🚫 Blocked ${target}`);
        return true;
    }

    if (cmd.startsWith('/unblock ')) {
        const target = parts[1];
        blockedUsers.delete(target);
        await sendText(sessionId, from, `✅ Unblocked ${target}`);
        return true;
    }

    if (cmd.startsWith('/info ')) {
        const target = parts[1];
        const info = `📊 *User: ${target}*\n\n` +
            `Bot Mode: ${botUsers.has(target) ? '✅' : '❌'}\n` +
            `Human: ${humanHandling.has(target) ? '✅' : '❌'}\n` +
            `Blocked: ${blockedUsers.has(target) ? '🚫' : '❌'}\n` +
            `AI Chat: ${conversationHistory.has(target) ? '✅' : '❌'}\n` +
            `Auto-replied: ${autoRepliedUsers.has(target) ? '✅' : '❌'}`;
        await sendText(sessionId, from, info);
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

    return false;
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================
app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const core = extractCore(req.body);
    if (!core || !core.id || !core.from || core.fromMe) return;

    // Deduplication
    if (handledMessages.has(core.id)) return;
    handledMessages.set(core.id, Date.now());

    const { sessionId, from, text, buttonResponse } = core;

    // Check business hours state
    checkAndResetAutoReplies();
    const isOnline = isWithinBusinessHours();

    // Admin commands (always work)
    if (isAdmin(from) && text && text.startsWith('/')) {
        const handled = await handleAdminCommand(sessionId, from, text);
        if (handled) return;
    }

    // Admin manual chat (don't interfere)
    if (isAdmin(from) && text && !text.startsWith('/')) return;

    // Blocked users
    if (blockedUsers.has(from)) return;

    // OFFLINE MODE - Send auto-reply once per window
    if (!isOnline && !isAdmin(from)) {
        await sendOfflineAutoReply(sessionId, from);
        return; // Stop processing - no bot interaction outside business hours
    }

    // ONLINE MODE - Normal bot operation
    if (humanHandling.has(from)) {
        humanHandling.set(from, Date.now());
        return;
    }

    // Button responses
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

    // Text commands
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

    // Number selection
    const numberMatch = text.match(/^(\d+)$/);
    if (numberMatch && global.userProducts?.has(from)) {
        const index = parseInt(numberMatch[1]) - 1;
        const userProductList = global.userProducts.get(from);

        if (index >= 0 && index < userProductList.length) {
            await sendText(sessionId, from, userProductList[index].productInfo);
            return;
        }
    }

    // Product keyword matching
    const products = global.allProducts;
    if (products) {
        const match = products.find(p =>
            lowerText.includes(p.id.toLowerCase()) ||
            p.menuTitle.toLowerCase().includes(lowerText) ||
            (p.triggerKeywords && p.triggerKeywords.some(kw => lowerText.includes(kw.toLowerCase())))
        );

        if (match) {
            await sendText(sessionId, from, match.productInfo);
            return;
        }
    }

    // AI query
    console.log("🤖 AI:", text.substring(0, 40));
    const aiResponse = await askProductExpert(from, text);

    if (aiResponse === "ESCALATE") {
        await escalateToHuman(sessionId, from);
    } else if (aiResponse === "ORDER_INFO") {
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

        await sendWithButtons(sessionId, from, orderMsg, [
            { id: "menu", text: "🛍️ View Products" },
            { id: "human", text: "💬 Card Payment" }
        ]);
    } else if (aiResponse) {
        await sendText(sessionId, from, aiResponse);
    } else {
        await sendText(sessionId, from, "I'm having trouble. Type *HUMAN* for support or *MENU* for products!");
    }
});

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================
app.get("/", (_, res) => {
    res.json({
        status: "online",
        service: "Snippy Mart WhatsApp Bot",
        version: "4.0.0 - Business Hours Edition",
        ai: openai ? "enabled" : "disabled",
        activeUsers: botUsers.size,
        humanHandling: humanHandling.size,
        products: global.allProducts?.length || 0,
        businessHours: isWithinBusinessHours() ? "ONLINE" : "OFFLINE",
        autoRepliedToday: autoRepliedUsers.size
    });
});

app.post("/reload", async (req, res) => {
    await loadProductKnowledge();
    res.json({
        success: true,
        products: global.allProducts?.length || 0
    });
});

// ============================================================================
// SERVER START
// ============================================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("🚀 SNIPPY MART WHATSAPP BOT v4.0.0");
    console.log(`📡 Port: ${PORT}`);
    console.log(`🤖 AI: ${openai ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`👥 Admins: ${ADMIN_NUMBERS.join(', ')}`);
    console.log(`🕓 Business Hours: ${isWithinBusinessHours() ? 'ONLINE ✅' : 'OFFLINE ⏰'}`);
    console.log(`📚 Products: ${global.allProducts?.length || 'Loading...'}`);
    console.log("✅ READY!");
});

// Cursor Smart Recovery - High Logic Background Worker
// "Service Worker Inactive" Fix: We use Alarms to keep logic fresh and top-level listeners.

const API_BASE = "https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/cursor-api";

// 1. TOP LEVEL LISTENERS (Crucial for Wake-Up)
chrome.runtime.onInstalled.addListener(setupHeartbeat);
chrome.runtime.onStartup.addListener(setupHeartbeat);

// 2. HEARTBEAT (Keep-Alive Logic)
function setupHeartbeat() {
    console.log("[Background] Starting Heartbeat...");
    // Clear existing to avoid dupes
    chrome.alarms.clearAll(() => {
        // Create alarm to wake up every 4 minutes (below 5min limit)
        chrome.alarms.create("HEARTBEAT_WAKEUP", { periodInMinutes: 4 });
    });
    syncRemoteConfig();
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "HEARTBEAT_WAKEUP") {
        console.log("[Background] Heartbeat - I am awake.");
        // Optional: meaningful background check here
        // checkStatusSilent(); 
    }
});

// 3. MESSAGE BUS (The Core)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Return true ensures we can sendResponse asynchronously
    // This keeps the message port open until we are done.

    if (request.type === "RESTORE_ACCESS") {
        console.log("[Background] Received Restore Command for:", request.email);
        performRestore(request.email).then(sendResponse);
        return true;
    }

    if (request.type === "CHECK_STATUS") {
        checkUserStatus(request.email).then(sendResponse);
        return true;
    }

    if (request.type === "REPORT_STATUS") {
        // Just fire and forget, but return simple success
        handleStatusReport(request.email, request.status);
        sendResponse({ received: true });
        return false; // No async wait needed
    }

    if (request.type === "EMAIL_DISCOVERED") {
        console.log("[Background] Auto-Config via Email:", request.email);
        // We know the email now. We could run a check.
        // checkUserStatus(request.email); 
        sendResponse({ received: true });
        return false;
    }
});

// 4. WORKER FUNCTIONS
async function performRestore(email) {
    try {
        // 60s Timeout for Cold Starts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        console.log("[Background] Calling API...");
        const response = await fetch(`${API_BASE}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        console.log("[Background] API Response:", data);

        // Handle Business Logic
        if (data.invite_link) {
            // SUCCESS FLOW

            // A. Open Tab
            const tab = await chrome.tabs.create({ url: data.invite_link, active: true });

            // B. Flash Window
            chrome.windows.update(tab.windowId, { focused: true, drawAttention: true });

            // C. Notify
            showNotification(`Restoring Access: Joining ${data.team_name || 'Team'}...`);

            return { success: true, team_name: data.team_name };
        } else if (data.error === 'already_active') {
            return { success: true, team_name: data.team_name, message: "Already active" };
        } else {
            return { success: false, message: data.error || "Unknown error" };
        }

    } catch (err) {
        console.error("[Background] Critical Error:", err);
        return { success: false, message: err.name === 'AbortError' ? "Server Timed Out" : "Network Error" };
    }
}

async function checkUserStatus(email) {
    try {
        const res = await fetch(`${API_BASE}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        return { success: true, data };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function handleStatusReport(email, status) {
    const endpoint = status === 'removed' ? '/removed' : '/joined';
    fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).catch(console.error);

    // USER ALERT LOGIC
    if (status === 'removed') {
        // 1. Flash Taskbar
        chrome.windows.getCurrent((win) => {
            if (win) chrome.windows.update(win.id, { drawAttention: true });
        });

        // 2. Notification
        showNotification("Cursor Access Lost! Click extension to fix.");

        // 3. Update Badge
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
}

// 5. UTILS
function showNotification(msg) {
    // Disabled until icon128.png is present to prevent errors
    // console.log("[Notification]", msg);
}


// --- 6. AUTO-SCAN LOGIC (The "Invisible Hand") ---
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "HEARTBEAT_WAKEUP") {
        console.log("[Background] Heartbeat - Checking Status...");
        performInvisibleScan();
    }
});

async function performInvisibleScan() {
    // 1. Check if we have an email
    const { cursor_recovery_email } = await chrome.storage.local.get('cursor_recovery_email');
    if (!cursor_recovery_email) return;

    // 2. Open Dashboard in Background (Inactive Tab)
    // We can't really scan "Closed" pages, so we open it, scan it, close it?
    // BETTER: Use fetch/XHR to check dashboard status if cursor allows it? 
    // Most reliable: Open tab, let content script run, have content script send "Removed" signal.

    // For now, relying on User being on the dashboard is safer vs opening tabs randomly.
    // BUT user asked for "Scan every 3-5 mins".

    // "Hidden" Tab Strategy
    chrome.tabs.create({ url: "https://cursor.com/settings", active: false }, (tab) => {
        // Content script will run 'scanPage()' automatically.
        // It will detect 'Free' -> Send 'REPORT_STATUS' -> Background receives it.
        // If "Free", Background triggers Restore.

        // Auto-close this checker tab after 15 seconds to avoid clutter
        setTimeout(() => {
            chrome.tabs.remove(tab.id);
        }, 15000);
    });
}
// ---------------------------------------------------

async function syncRemoteConfig() {
    // Silent sync
    try {
        const r = await fetch(`${API_BASE}/config`);
        if (r.ok) {
            const d = await r.json();
            if (d.config) chrome.storage.local.set({ 'extension_config': d.config });
        }
    } catch (e) { console.warn("Config sync skipped", e); }
}

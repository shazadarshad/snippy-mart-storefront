// Content Script: Detects Status & Handles User Interaction

const STORAGE_KEY = 'cursor_recovery_email';
const COOLDOWN_MS = 3 * 60 * 1000; // 3 Minutes Cooldown for checks/reporting
let lastStatus = null;
let lastCheckTime = 0;

// 1. Get Email (Helper)
const getEmailFromStorage = async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return stored[STORAGE_KEY];
};

// 2. In-Page Shadow DOM Notification (Modern UI)
const createOverlay = () => {
    // ID Check to prevent duplicates
    if (document.getElementById('cursor-recovery-host')) return;

    // Create Host
    const host = document.createElement('div');
    host.id = 'cursor-recovery-host';
    document.body.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Styles (Injected directly to be self-contained)
    const style = document.createElement('style');
    style.textContent = `
        .cr-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #09090b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
        }
        @keyframes slideIn {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .cr-icon-box {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .cr-content {
            flex: 1;
        }
        .cr-title {
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px 0;
        }
        .cr-desc {
            color: #a1a1aa;
            font-size: 12px;
            margin: 0;
            line-height: 1.4;
        }
        .cr-actions {
            display: flex;
            gap: 8px;
        }
        .cr-btn {
            background: #fff;
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .cr-btn:hover { opacity: 0.9; }
        .cr-btn:disabled { opacity: 0.5; cursor: wait; }
    `;
    shadow.appendChild(style);

    // Structure
    const container = document.createElement('div');
    container.className = 'cr-toast';
    container.innerHTML = `
        <div class="cr-icon-box">⚠️</div>
        <div class="cr-content">
            <h3 class="cr-title">Cursor Access Lost</h3>
            <p class="cr-desc">You are on the Free Plan. restore access now.</p>
        </div>
        <div class="cr-actions">
            <button id="cr-fix-btn" class="cr-btn">FIX IT NOW</button>
        </div>
    `;
    shadow.appendChild(container);

    // Logic
    const btn = container.querySelector('#cr-fix-btn');
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerText = "Processing...";

        const email = await getEmailFromStorage();
        if (email) {
            chrome.runtime.sendMessage({ type: "RESTORE_ACCESS", email });
            btn.innerText = "Opening...";
            setTimeout(() => { host.remove(); }, 3000);
        } else {
            alert("Extension error: No email found. Please open extension popup.");
            host.remove();
        }
    });

    // Auto-Close after 60s to not be annoying? No, user wants notification.
    // We leave it until they fix.
};

const hideOverlay = () => {
    const host = document.getElementById('cursor-recovery-host');
    if (host) host.remove();
};



// --- Remote Config Logic ---
let remoteConfig = {
    email_selectors: ['meta[name="user-email"]', 'div[data-testid="user-email"]'],
    free_plan_triggers: ['current plan: free', 'upgrade to pro'],
    upgrade_btn_selectors: ['button[data-testid="upgrade-button"]'],
    cooldown_ms: 180000
};

const updateConfig = async () => {
    // Try to get from storage first
    const stored = await chrome.storage.local.get('extension_config');
    if (stored.extension_config) {
        remoteConfig = { ...remoteConfig, ...stored.extension_config };
    }
    // Background script fetches fresh config and saves it to storage
};

// 3. Scan Logic
const scanPage = async () => {
    await updateConfig(); // Ensure latest rules

    const bodyText = document.body.innerText;
    const bodyLower = bodyText.toLowerCase();

    // 0. Check Login State
    const isLoginPage = window.location.href.includes('/login') ||
        !!document.querySelector('a[href*="/login"]') ||
        (bodyLower.includes("log in") && bodyLower.includes("continue with"));

    // If explicitly on login page or logged out, maybe notify once?
    // We don't want to spam. But if we need to recover, we can't if logged out.
    if (isLoginPage && !lastStatus) {
        // Graceful: Do nothing until they log in. 
        // Or if they wanted recovery, maybe a small hint?
        console.log("[CursorRecovery] User appears logged out. Waiting.");
        return;
    }

    // A. Email Auto-Discovery (Dynamic)
    let myEmail = await getEmailFromStorage();
    if (!myEmail) {
        // 1. Selector Search
        for (let sel of remoteConfig.email_selectors) {
            const el = document.querySelector(sel);
            if (el) {
                const txt = el.innerText || el.content;
                if (txt && txt.includes('@') && txt.length < 50) {
                    myEmail = txt;
                    break;
                }
            }
        }

        // 2. Regex Fallback (if still null)
        if (!myEmail) {
            // Look for email-like strings in visible text (careful not to pick up garbage)
            const matches = bodyText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (matches && matches[0] && !matches[0].includes('cursor.com')) { // avoid support emails
                myEmail = matches[0];
            }
        }

        if (myEmail) {
            chrome.storage.local.set({ [STORAGE_KEY]: myEmail });
            console.log("[CursorRecovery] ✨ Auto-discovered email:", myEmail);

            // Notify background to close tab if it was opened for this purpose
            // We can send a message
            chrome.runtime.sendMessage({ type: "EMAIL_DISCOVERED", email: myEmail });
        }
    }

    // B. Status Detection (Dynamic)
    // Aggressive "Free" Detection
    let isFree = false;

    // Check Text Triggers
    if (remoteConfig.free_plan_triggers.some(trigger => bodyLower.includes(trigger))) {
        isFree = true;
    }
    // Check Element/Button Triggers
    if (!isFree) {
        if (remoteConfig.upgrade_btn_selectors.some(sel => !!document.querySelector(sel))) {
            isFree = true;
        }
    }
    // Fallback: Check for 'upgrade' button broadly if config allows or failed
    if (!isFree) {
        isFree = Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('upgrade'));
    }

    const status = isFree ? 'removed' : 'active';
    console.log(`[CursorRecovery] Scan Result: ${status.toUpperCase()} (Email: ${myEmail || 'Pending'})`);

    // C. Reporting & Acting
    // Only act if status CHANGED or it's been a while (Heartbeat every 3 mins)
    const now = Date.now();
    const shouldReport = (status !== lastStatus) || (now - lastCheckTime > remoteConfig.cooldown_ms);

    if (shouldReport && myEmail) {
        lastStatus = status;
        lastCheckTime = now;
        chrome.storage.local.set({ 'last_known_status': status });

        chrome.runtime.sendMessage({ type: "REPORT_STATUS", email: myEmail, status });

        if (status === 'removed') {
            // We do NOT auto-restore anymore. The background script handles the Notification/Flash.
            // We just show the local overlay as a visual cue if they are on the page.
            createOverlay();
        } else {
            hideOverlay();
        }
    }
};

// 4. Scheduling
// "Auto scan every 3 to 5 minutes" -> let's do 3 minutes (180s)
setInterval(scanPage, 180 * 1000);

// Also use Observer for instant reaction to page loads/changes
let observerTimeout;
const observer = new MutationObserver(() => {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(scanPage, 1000); // 1s Debounce
});
observer.observe(document.body, { childList: true, subtree: true });

// Run once immediately
scanPage();

// Inject Styles
const link = document.createElement("link");
link.href = chrome.runtime.getURL("style.css");
link.type = "text/css";
link.rel = "stylesheet";
document.head.appendChild(link);

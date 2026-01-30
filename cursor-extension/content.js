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

// 2. Overlay UI
const createOverlay = () => {
    if (document.getElementById('cursor-recovery-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cursor-recovery-overlay';
    overlay.innerHTML = `
    <div class="cr-container">
      <div class="cr-icon">⚠️</div>
      <div class="cr-content">
        <h3>Cursor Access Lost</h3>
        <p>You have been removed from your team.</p>
      </div>
      <button id="cr-restore-btn">Restore Access (1-Click)</button>
    </div>
  `;
    document.body.appendChild(overlay);

    const btn = document.getElementById('cr-restore-btn');
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerText = "Restoring...";
        const email = await getEmailFromStorage();
        if (email) {
            chrome.runtime.sendMessage({ type: "RESTORE_ACCESS", email });
            // The background script will open the new tab, which auto-joins.
            // We can close this overlay optimistically or wait.
            btn.innerText = "Opening Invite...";
            setTimeout(() => { overlay.remove(); }, 2000);
        } else {
            alert("Please set your email in the extension popup first!");
            btn.disabled = false;
        }
    });
};

const hideOverlay = () => {
    const overlay = document.getElementById('cursor-recovery-overlay');
    if (overlay) overlay.remove();
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

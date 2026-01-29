// Content Script for Cursor Dashboard Detection

let lastStatus = null;
let lastEventTime = 0;
const COOLDOWN_MS = 10000; // 10s cooldown
const STORAGE_KEY = 'cursor_recovery_email';

// --- UI Overlay ---
const createOverlay = () => {
    if (document.getElementById('cursor-recovery-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cursor-recovery-overlay';
    overlay.innerHTML = `
    <div class="cr-container">
      <div class="cr-icon">⚠️</div>
      <div class="cr-content">
        <h3>Access Interrupted</h3>
        <p>You have been removed from your team.</p>
      </div>
      <button id="cr-restore-btn">Restore Access</button>
    </div>
  `;
    document.body.appendChild(overlay);

    document.getElementById('cr-restore-btn').addEventListener('click', () => {
        const btn = document.getElementById('cr-restore-btn');
        btn.disabled = true;
        btn.innerText = "Restoring...";

        getEmail().then(email => {
            if (!email) {
                alert("No email found. Please configure extension.");
                btn.disabled = false;
                btn.innerText = "Restore Access";
                return;
            }

            chrome.runtime.sendMessage({ type: "RESTORE_ACCESS", email }, (response) => {
                if (response && response.error) {
                    alert(`Error: ${response.message}`);
                    btn.disabled = false;
                    btn.innerText = "Restore Access";
                } else {
                    // Success - tab opens, maybe hide overlay temporarily
                    overlay.style.display = 'none';
                    setTimeout(() => { overlay.style.display = 'flex'; btn.disabled = false; btn.innerText = "Restore Access"; }, 5000);
                }
            });
        });
    });
};

const hideOverlay = () => {
    const overlay = document.getElementById('cursor-recovery-overlay');
    if (overlay) overlay.remove();
};

// --- Detection Logic ---
const checkStatus = async () => {
    // Simple heuristic: Search for "Free" plan indicator or "Upgrade" button in specific billing/settings areas
    // Or checking if the current workspace indicates "Free"
    // Since we don't know the exact Cursor DOM, we assume text content checks on body for "Your plan: Free" or similar.
    // ADJUST THIS SELECTOR BASED ON REAL CURSOR DOM
    const bodyText = document.body.innerText;
    const isFree = bodyText.includes("Current Plan: Free") || bodyText.includes("Upgrade to Pro") || document.querySelector('.upgrade-button-selector-mock');
    // For demo/dev purposes, we might check for a specific hidden element or manual trigger? 
    // Let's assume a safe default: IF we find "Team" in logic, we are active.

    // Real implementation needs precise selectors. 
    // Logic: 
    // If (User has no team OR User is on Free plan) => REMOVED
    // Else => ACTIVE

    const status = isFree ? 'removed' : 'active';

    // State Memory & Cooldown
    const now = Date.now();
    if (status !== lastStatus && (now - lastEventTime > COOLDOWN_MS)) {
        console.log(`[CursorRecovery] Status changed: ${lastStatus} -> ${status}`);

        const email = await getEmail();
        if (email) {
            // Report to backend
            chrome.runtime.sendMessage({ type: "REPORT_STATUS", email, status });
            lastEventTime = now;
        }

        if (status === 'removed') {
            createOverlay();
            // Notification
            if (Notification.permission === "granted") {
                new Notification("Cursor Access Interrupted", { body: "Click to restore access." });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        } else {
            hideOverlay();
        }

        lastStatus = status;
        // Persist status
        chrome.storage.local.set({ ['last_known_status']: status });
    }
};

// --- Email logic ---
const getEmail = async () => {
    // 1. Try storage
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    if (stored[STORAGE_KEY]) return stored[STORAGE_KEY];

    // 2. Scrape (Mock selector)
    const emailEl = document.querySelector('meta[name="user-email"]') || document.querySelector('.user-profile-email');
    if (emailEl) {
        const email = emailEl.content || emailEl.innerText;
        if (email.includes('@')) {
            chrome.storage.local.set({ [STORAGE_KEY]: email });
            return email;
        }
    }

    // 3. Last Resort: Prompt (Only once)
    const input = prompt("Cursor Recovery: Please enter your email to enable automatic recovery:");
    if (input && input.includes('@')) {
        chrome.storage.local.set({ [STORAGE_KEY]: input });
        return input;
    }
    return null;
};

// --- Loop ---
setInterval(checkStatus, 3000); // Check every 3s
checkStatus(); // Initial check

// Inject CSS
const link = document.createElement("link");
link.href = chrome.runtime.getURL("style.css");
link.type = "text/css";
link.rel = "stylesheet";
document.head.appendChild(link);

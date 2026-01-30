// Cursor Auto-Join: The "Backup" Clicker
// This script runs automatically on any page matching *://cursor.com/team-invite*

console.log("[Auto-Join] Content Script Loaded. Searching for Accept buttons...");

const findAndClickParams = () => {
    const elements = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
    const target = elements.find(el => {
        const text = el.innerText?.toLowerCase() || "";
        return (text.includes('accept') || text.includes('join') || text.includes('continue'))
            && !text.includes('decline')
            && !text.includes('cancel');
    });

    if (target) {
        if (target.disabled || target.getAttribute('aria-disabled') === 'true') {
            console.log("[Auto-Join] Found target but disabled. Waiting...");
            return false;
        }
        console.log("[Auto-Join] Clicking:", target);
        target.focus();
        target.click();
        return true;
    }
    return false;
};

// Retry Loop (Independent of Background Script)
const interval = setInterval(() => {
    // 1. Check for Expiration Strings
    const bodyText = document.body.innerText.toLowerCase();
    if (bodyText.includes('invite code expired') || bodyText.includes('error accepting invite')) {
        console.log("[Auto-Join] 🚨 Detected EXPIRED Invite!");
        clearInterval(interval);
        chrome.runtime.sendMessage({ type: "INVITE_EXPIRED", url: window.location.href });
        return;
    }

    // 2. Try to Click
    if (findAndClickParams()) {
        console.log("[Auto-Join] Success. Stopping scanner.");
        clearInterval(interval);
    }
}, 800);

// Stop after 60s
setTimeout(() => clearInterval(interval), 60000);

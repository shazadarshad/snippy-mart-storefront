// Fast Auto Joiner
const attemptJoin = () => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        const txt = btn.innerText.toLowerCase();
        if (txt.includes("join team") || txt.includes("accept invite")) {
            console.log("[CursorAutoJoin] ⚡ CLICKING BUTTON NOW");
            btn.click();
            window.close(); // Try close immediately 
            return true;
        }
    }
    return false;
};

// Aggressive Polling (Every 50ms)
const timer = setInterval(() => {
    if (attemptJoin()) {
        clearInterval(timer);
    }
}, 50);

// Also use Observer
const observer = new MutationObserver(attemptJoin);
observer.observe(document.documentElement, { childList: true, subtree: true });

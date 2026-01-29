// Background Service Worker

// Config - Update this with your production URL or Vercel URL
const API_BASE = "https://snippymart.com/api/cursor";
// Or point directly to Supabase if preferred, but user said "Use Snippy Mart backend API" (proxy).

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "RESTORE_ACCESS") {
        handleRestore(request.email).then(sendResponse);
        return true; // Keep channel open for async response
    }

    if (request.type === "REPORT_STATUS") {
        handleStatusReport(request.email, request.status).then(sendResponse);
        return true;
    }
});

async function handleRestore(email) {
    try {
        const response = await fetch(`${API_BASE}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.status === 503) {
            return { error: 'maintenance', message: 'System is currently under maintenance.' };
        }

        if (!response.ok) {
            return { error: 'api_error', message: data.error || 'Failed to restore access.' };
        }

        if (data.success && data.invite_link) {
            // Open the new invite link
            chrome.tabs.create({ url: data.invite_link });
            return { success: true };
        } else if (data.error === 'already_active') {
            return { success: true, message: 'You are already active!' };
        } else {
            return { error: 'unknown', message: 'No invite link received.' };
        }

    } catch (err) {
        console.error("Restore Error:", err);
        return { error: 'network_error', message: 'Network error occurred.' };
    }
}

async function handleStatusReport(email, status) {
    const endpoint = status === 'removed' ? '/removed' : '/joined';
    try {
        await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return { success: true };
    } catch (err) {
        console.error("Report Error:", err);
        return { success: false };
    }
}

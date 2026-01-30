document.addEventListener('DOMContentLoaded', async () => {
    const emailInput = document.getElementById('emailInput');
    const restoreBtn = document.getElementById('restoreBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusValue = document.getElementById('statusValue');
    const teamValue = document.getElementById('teamValue');
    const messageEl = document.getElementById('message');
    const successOverlay = document.getElementById('successOverlay');

    // UI Helper
    const updateUI = (status, team) => {
        statusValue.textContent = status ? status.toUpperCase() : 'UNKNOWN';
        statusValue.style.color = (status === 'active') ? '#4ade80' : (status === 'removed' ? '#ef4444' : '#fff');

        teamValue.textContent = team || '--';
        teamValue.style.color = team ? '#fff' : '#a1a1aa';
    };

    // Initialize & Version Check
    const API_BASE = "https://vuffzfuklzzcnfnubtzx.supabase.co/functions/v1/cursor-api";
    const MANIFEST = chrome.runtime.getManifest();

    // Check Version
    try {
        const r = await fetch(`${API_BASE}/config`);
        const d = await r.json();

        if (d.version) {
            const current = MANIFEST.version;

            // Simple Semver Check (Assumption: simple x.y.z format)
            if (current < d.version.min) {
                // LOCK UI
                document.body.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <h2 style="color:#ef4444">UPDATE REQUIRED</h2>
                    <p style="color:#fff; font-size:14px; margin-bottom:20px;">
                        This version (${current}) is outdated. Minimum required: ${d.version.min}
                    </p>
                    <a href="${d.version.download_url}" target="_blank" style="
                        display:block; padding:12px; background:#fff; color:#000; 
                        text-decoration:none; font-weight:bold; border-radius:6px;">
                        DOWNLOAD UPDATE
                    </a>
                </div>`;
                return; // Stop execution
            }
        }
    } catch (e) { console.warn("Version check skipped", e); }

    const stored = await chrome.storage.local.get(['cursor_recovery_email', 'last_known_status', 'last_team']);
    if (stored.cursor_recovery_email) emailInput.value = stored.cursor_recovery_email;
    updateUI(stored.last_known_status, stored.last_team);

    const getEmail = async () => {
        let email = emailInput.value.trim();
        if (!email) {
            const s = await chrome.storage.local.get('cursor_recovery_email');
            email = s.cursor_recovery_email;
        }
        if (email && email.includes('@')) {
            chrome.storage.local.set({ 'cursor_recovery_email': email });
            return email;
        }
        return null;
    };

    // Hero Restore Action
    restoreBtn.addEventListener('click', async () => {
        const email = await getEmail();
        if (!email) {
            messageEl.textContent = "Please enter email.";
            return;
        }

        // Loading State
        restoreBtn.disabled = true;
        const originalHtml = restoreBtn.innerHTML;
        restoreBtn.innerHTML = `<div class="hero-text">...</div>`; // Simple loading
        messageEl.textContent = "";

        // Timeout Safety
        const failTimer = setTimeout(() => {
            if (restoreBtn.disabled) {
                restoreBtn.disabled = false;
                restoreBtn.innerHTML = originalHtml;
                messageEl.textContent = "Server waking up... Try again.";
            }
        }, 15000);

        chrome.runtime.sendMessage({ type: "RESTORE_ACCESS", email }, (response) => {
            clearTimeout(failTimer);
            restoreBtn.disabled = false;
            restoreBtn.innerHTML = originalHtml;

            if (chrome.runtime.lastError) {
                messageEl.textContent = "Extension Error. Reload.";
                return;
            }

            if (response && response.success) {
                // BOOM SUCCESS
                successOverlay.style.display = 'flex';

                // Update Storage
                if (response.team_name) {
                    chrome.storage.local.set({
                        'last_known_status': 'active',
                        'last_team': response.team_name
                    });
                    updateUI('active', response.team_name);
                }

                // Close overlay after 2s
                setTimeout(() => {
                    successOverlay.style.display = 'none';
                    // Optional: Close popup? 
                    // window.close(); 
                }, 2500);

            } else {
                messageEl.textContent = response?.message || "Failed.";
            }
        });
    });

    // Refresh Action
    refreshBtn.addEventListener('click', async () => {
        const email = await getEmail();
        if (!email) return;

        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerText = "SYNCING...";

        chrome.runtime.sendMessage({ type: "CHECK_STATUS", email }, (response) => {
            refreshBtn.innerHTML = originalText;
            if (response && response.success) {
                updateUI(response.data.status, response.data.team_name);
                chrome.storage.local.set({
                    'last_known_status': response.data.status,
                    'last_team': response.data.team_name
                });
            } else {
                messageEl.textContent = "Check failed.";
            }
        });
    });
});

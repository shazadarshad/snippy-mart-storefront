# Cursor Smart Recovery: Rebuild Plan (A-Z)

## Objective
Build a "High Logic, Very Fast, Smooth, and Accurate" system to recover Cursor team access. Fix "Service Worker Inactive" and "Restore Timeout" issues.

## 1. Database & Backend (The Engine)
**Goal:** Zero-friction invite claiming.
- [x] **RPC Function (`claim_invite_transaction`)**: Already simplified to "No Locking" mode for speed.
- [ ] **Edge Function (`cursor-api`)**:
    -   **Action**: Strip down to bare mental.
    -   **Fix**: Ensure `CORS` headers are *always* returned, even on error.
    -   **Optimization**: Remove any unnecessary sleeps/delays.

## 2. Chrome Extension (The Agent)
**Goal:** Always-ready background agent that wakes up instantly.
- [ ] **Manifest V3 Service Worker Fix**:
    -   Problem: Workers sleep after 30s.
    -   Fix: Use `chrome.alarms` to create a "Heartbeat" that wakes the worker every 4.9 minutes (Chrome limit is 5, safety margin).
    -   Fix: Ensure all `chrome.runtime.onMessage` listeners are synchronous at the top level.
- [ ] **Communication Architecture**:
    -   **Popup**: Acts as the "Remote Control". It doesn't do work; it signals the Background Worker.
    -   **Background**: Handles *all* API calls to ensure they continue even if popup closes.

## 3. The "Restore" Flow (Zero Friction)
1.  **User Clicks Restore** (Popup) OR **Auto-Trigger** (Content Script).
2.  **Signal**: Message sent to Background.
3.  **Background**:
    -   Wakes up.
    -   Fetches API (with 60s timeout).
    -   **Success**:
        -   Opens Invite Link in New Tab.
        -   **Focuses Window** (Force attention).
        -   Sends Notification: "Welcome back!".
    -   **Failure**: Notifies User.

## 4. Implementation Steps (Immediate)
1.  **Reset `background.js`**: Implement robust "Wake-Up" pattern.
2.  **Reset `popup.js`**: Simplified UI that just listens for status updates.
3.  **Verify Edge Function**: Ensure it's bulletproof.

Let's build.

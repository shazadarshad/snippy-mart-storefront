# Cursor Smart Recovery - System Checklist & Fix Plan

## 1. Extension Configuration (Auto-Discovery)
- [x] **Background Startup**: Extension checks for email on browser open.
- [ ] **Stealth Discovery**: If missing, opens settings, finds email, saves it, and closes tab.
- [ ] **Popup Sync**: Popup input auto-fills from storage immediately.

## 2. Status Detection (Cursor Dashboard)
- [x] **Remote Config**: Selectors are loaded from Database (not hardcoded).
- [ ] **Login Check**: specific "Logged Out" state detection prevents errors.
- [ ] **Free Plan Detection**: Accurate detection of "Free" badge or "Upgrade" buttons.

## 3. Restore Flow (The "Click")
- [ ] **Popup Restore**: Clicking "Force Restore" sends valid email to background.
- [ ] **Overlay Restore**: Clicking "One-Click Restore" on the warning overlay works.
- [ ] **Background Processing**: `background.js` calls API `/restore` correctly.
- [ ] **API Response**: correctly handles "Success", "Already Active", or "No Invites".

## 4. Database & API (Backend)
- [x] **Team Selection**: Smart shuffling + Cooldowns + Exists Check (Fixed).
- [x] **Concurrency**: Row locking prevents double-booking.
- [ ] **Invites Management**: Admin panel correctly uploads and tracks invites.

## 5. Auto-Join (The Finish Line)
- [ ] **Invite Page**: Detects `cursor.com/team/accept-invite` URL.
- [ ] **Button Click**: Automate clicking "Join Team".
- [ ] **Success UI**: Show "Boom back in team" overlay.

## Status: IN PROGRESS
I am now verifying and fixing items 1, 2, and 3 to ensure the "Restore doesn't work" issue is resolved.

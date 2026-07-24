# Snippy Admin Android APK (Capacitor + FCM)

Installable Android app for **admin order push** when the app is closed.  
**Does not change** the public website or the existing web/PWA admin panel.

| Surface | Behavior |
|---------|----------|
| snippymart.com storefront | Unchanged |
| Web /admin | Unchanged (toast + beep + browser alerts) |
| Admin APK | Same UI via live site + **FCM push** when closed |

Order checkout is **not delayed**: `create-order` fires push with `fetch` and **does not await** it.

---

## Architecture

```
Customer checkout
  → create-order (saves order, returns immediately)
  → fire-and-forget → push-admin-order edge function
  → FCM → your phone notification shade
```

Token registration only runs when `Capacitor.isNativePlatform()` is true.

---

## One-time setup

### 1. Supabase migration

Run in SQL editor (or CLI):

`supabase/migrations/20260723_admin_push_tokens.sql`

### 2. Deploy edge functions

```bash
supabase functions deploy push-admin-order
supabase functions deploy create-order
```

### 3. Firebase (FCM)

1. Create a Firebase project (or use existing).
2. Add an **Android** app with package name: `com.snippymart.admin`
3. Download **`google-services.json`** → place at `android/app/google-services.json` after `cap add android`
4. Project settings → Service accounts → Generate new private key (JSON)
5. Set Supabase secrets:

```bash
supabase secrets set FCM_PROJECT_ID=your-firebase-project-id
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Paste the **entire** service account JSON as one string for `FCM_SERVICE_ACCOUNT_JSON`.

If FCM secrets are missing, push is **skipped** (orders still succeed).

### 4. Install Capacitor deps & Android project

On a machine with **Node + Android Studio + JDK**:

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications @capacitor/app @capacitor/splash-screen
npx cap add android
# copy google-services.json into android/app/
npx cap sync android
npx cap open android
```

In Android Studio:

- Set applicationId `com.snippymart.admin` (matches capacitor `appId`)
- Ensure Google Services plugin is applied (Capacitor/Firebase docs)
- Create notification channel if prompted (plugin usually handles)
- **Build → Generate Signed Bundle / APK**

---

## Build APK without Android Studio (recommended)

GitHub Actions builds a **debug APK** for you.

### One-time: add Firebase JSON as a GitHub secret

1. Open [repo Settings → Secrets and variables → Actions](https://github.com/shazadarshad/snippy-mart-storefront/settings/secrets/actions)
2. New repository secret:
   - Name: `GOOGLE_SERVICES_JSON`
   - Value: **entire contents** of your `google-services.json` (raw JSON)

Or from a PC that has the file:

```bash
gh secret set GOOGLE_SERVICES_JSON < android/app/google-services.json
```

### Run the build

1. GitHub → **Actions** → **Build Admin APK** → **Run workflow**
2. Wait ~5–10 minutes
3. Open the run → **Artifacts** → download **snippy-admin-apk**
4. Unzip if needed → install `app-debug.apk` on your phone  
   (allow Install unknown apps)

### After install

1. Open **Snippy Admin**
2. Log in at `/admin`
3. Allow **notifications**
4. Confirm a row appears in Supabase table `admin_push_tokens`
5. Place a test order → shade notification (needs FCM secrets on Supabase — below)

### Optional: local Android Studio

Only if you want; not required when using Actions.

---

## What stays the same

- Existing PWA banner / browser alerts / beep on web admin  
- No storefront UI changes  
- No change to product pages, checkout UX (except non-blocking background push call)

---

## Updating the admin UI later

The APK loads **https://snippymart.com** live.  
Deploy frontend to Vercel as usual — **no APK rebuild** for most UI changes.  
Rebuild APK only when changing native plugins / Capacitor version / package id.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| No push | FCM secrets set? Token in `admin_push_tokens`? Function logs? |
| Order slow | Should not be — push is fire-and-forget; check you're on latest `create-order` |
| Web admin broken | Unrelated — native hook is no-op on web |
| Permission denied on token insert | User must be admin in `user_roles`; migration RLS applied |

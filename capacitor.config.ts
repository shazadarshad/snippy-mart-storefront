import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Snippy Admin Android shell (Capacitor).
 *
 * Loads the LIVE website (https://snippymart.com) so:
 * - Storefront & web admin are unchanged
 * - UI deploys via Vercel without rebuilding the APK
 * - Only native push + installable app shell come from Capacitor
 *
 * Build docs: docs/ADMIN_ANDROID_APP.md
 */
const config: CapacitorConfig = {
  appId: 'com.snippymart.admin',
  appName: 'Snippy Admin',
  webDir: 'dist',
  server: {
    // Live site — no dual codebase for UI
    url: 'https://snippymart.com',
    cleartext: false,
    allowNavigation: [
      'snippymart.com',
      'www.snippymart.com',
      '*.supabase.co',
      'vuffzfuklzzcnfnubtzx.supabase.co',
    ],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0f172a',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
};

export default config;

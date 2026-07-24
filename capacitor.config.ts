import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Snippy Admin Android shell (Capacitor).
 *
 * Loads the LIVE admin panel (https://snippymart.com/admin) so:
 * - Storefront is unchanged
 * - Admin UI deploys via Vercel without rebuilding the APK
 * - Only native push + installable app shell come from Capacitor
 *
 * Build docs: docs/ADMIN_ANDROID_APP.md
 */
const config: CapacitorConfig = {
  appId: 'com.snippymart.admin',
  appName: 'Snippy Admin',
  webDir: 'dist',
  server: {
    // Open admin panel (not storefront homepage)
    url: 'https://snippymart.com/admin/dashboard',
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

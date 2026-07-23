/**
 * Capacitor / Android APK only.
 * Web admin, storefront, and existing realtime toast/beep are untouched.
 * When running inside the native shell, registers FCM token for closed-app pushes.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function isCapacitorNative(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    return !!cap?.isNativePlatform?.();
  } catch {
    return false;
  }
}

async function saveAdminPushToken(token: string) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;

  // Table may not be in generated types yet — use untyped client path
  const client = supabase as unknown as {
    from: (t: string) => {
      upsert: (
        row: Record<string, unknown>,
        opts?: { onConflict?: string },
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await client.from('admin_push_tokens').upsert(
    {
      user_id: uid,
      token,
      platform: 'android',
      device_label: 'Snippy Admin APK',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );

  if (error) {
    console.error('[admin-push] save token', error.message);
  } else {
    console.log('[admin-push] token saved');
  }
}

/**
 * Register FCM device token while admin is logged in (native APK only).
 * Safe no-op on web / PWA.
 */
export function useAdminNativePush(enabled: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return;
    if (registered.current) return;

    let cancelled = false;
    const removeFns: Array<() => Promise<void> | void> = [];

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { App } = await import('@capacitor/app');

        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;
        if (status === 'prompt' || status === 'prompt-with-rationale') {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }
        if (status !== 'granted') {
          console.warn('[admin-push] permission not granted');
          return;
        }

        await PushNotifications.register();

        const regHandle = await PushNotifications.addListener('registration', (t) => {
          if (cancelled) return;
          registered.current = true;
          void saveAdminPushToken(t.value);
        });
        removeFns.push(() => regHandle.remove());

        const errHandle = await PushNotifications.addListener('registrationError', (e) => {
          console.error('[admin-push] registrationError', e);
        });
        removeFns.push(() => errHandle.remove());

        const actionHandle = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const data = action.notification.data as { url?: string } | undefined;
            const url = data?.url || '/admin/orders';
            if (url.startsWith('/')) {
              window.location.assign(url);
            }
          },
        );
        removeFns.push(() => actionHandle.remove());

        // Warm App plugin (deep link / resume) — no storefront impact
        await App.addListener('appStateChange', () => {
          /* keep session warm */
        }).then((h) => removeFns.push(() => h.remove()));
      } catch (e) {
        console.warn('[admin-push] native setup skipped (web build is fine)', e);
      }
    })();

    return () => {
      cancelled = true;
      removeFns.forEach((fn) => {
        try {
          void fn();
        } catch {
          /* ignore */
        }
      });
    };
  }, [enabled]);
}

export { isCapacitorNative };

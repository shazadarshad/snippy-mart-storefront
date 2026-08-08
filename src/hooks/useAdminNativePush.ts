/**
 * Capacitor / Android APK only.
 * Web admin, storefront, and existing realtime toast/beep are untouched.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const NATIVE_NOTIFY_KEY = 'snippy_admin_native_push';

export function isCapacitorNative(): boolean {
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
  if (!uid) {
    console.warn('[admin-push] no user — log in first');
    return false;
  }

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
    return false;
  }
  console.log('[admin-push] token saved');
  try {
    localStorage.setItem(NATIVE_NOTIFY_KEY, '1');
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * Request permission + register FCM. Call from Alerts button on APK.
 */
export async function enableNativeAdminPush(): Promise<
  | { ok: true }
  | { ok: false; reason: 'not_native' | 'denied' | 'register_failed' | 'not_logged_in' | 'error'; message?: string }
> {
  if (!isCapacitorNative()) {
    return { ok: false, reason: 'not_native' };
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id) {
      return { ok: false, reason: 'not_logged_in' };
    }

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const perm = await PushNotifications.checkPermissions();
    let status = perm.receive;
    if (status !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      status = req.receive;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    // Wait for registration token (with timeout)
    const tokenPromise = new Promise<string>((resolve, reject) => {
      let done = false;
      const finish = (fn: () => void) => {
        if (done) return;
        done = true;
        fn();
      };

      void PushNotifications.addListener('registration', (t) => {
        finish(() => resolve(t.value));
      });
      void PushNotifications.addListener('registrationError', (e) => {
        finish(() => reject(new Error(String((e as { error?: string }).error || e))));
      });

      setTimeout(() => {
        finish(() => reject(new Error('Push registration timed out')));
      }, 15000);
    });

    // Register notification channel & action buttons for notification shade tray
    try {
      await PushNotifications.createChannel({
        id: 'admin_orders',
        name: 'Admin Order Alerts',
        description: 'Notifications for new customer orders',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
      });
      await PushNotifications.registerActionTypes({
        types: [
          {
            id: 'NEW_ORDER_ACTIONS',
            actions: [
              {
                id: 'APPROVE_ORDER',
                title: '✅ Approve',
                foreground: false,
              },
              {
                id: 'VIEW_ORDER',
                title: '👁️ View Order',
                foreground: true,
              },
            ],
          },
        ],
      });
    } catch (actErr) {
      console.warn('[admin-push] Channel / Action types registration warning:', actErr);
    }

    await PushNotifications.register();
    const token = await tokenPromise;
    const saved = await saveAdminPushToken(token);
    if (!saved) {
      return { ok: false, reason: 'register_failed', message: 'Could not save device token' };
    }

    // Tap notification action or body
    await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      const data = action.notification.data as { order_id?: string; order_number?: string; url?: string } | undefined;
      const actionId = action.actionId;

      if (actionId === 'APPROVE_ORDER' && data?.order_id) {
        console.log('[admin-push] Approving order directly from notification tray:', data.order_id);
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'processing', // Payment Confirmed
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.order_id);

        if (!error) {
          alert(`✅ Payment Confirmed for Order ${data.order_number || ''}!`);
        } else {
          console.error('[admin-push] Failed to approve order:', error.message);
          alert(`❌ Failed to approve order ${data.order_number || ''}: ${error.message}`);
        }
      } else {
        const url = data?.url || '/admin/orders';
        if (url.startsWith('/')) window.location.assign(url);
      }
    });

    return { ok: true };
  } catch (e) {
    console.error('[admin-push] enableNativeAdminPush', e);
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function isNativePushEnabled(): boolean {
  try {
    return localStorage.getItem(NATIVE_NOTIFY_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Auto-register when admin is logged in on APK (if permission already granted).
 */
export function useAdminNativePush(enabled: boolean) {
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || !isCapacitorNative() || started.current) return;
    started.current = true;

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') return;

        // Register channel & action buttons
        try {
          await PushNotifications.createChannel({
            id: 'admin_orders',
            name: 'Admin Order Alerts',
            description: 'Notifications for new customer orders',
            importance: 5,
            visibility: 1,
            sound: 'default',
            vibration: true,
          });
          await PushNotifications.registerActionTypes({
            types: [
              {
                id: 'NEW_ORDER_ACTIONS',
                actions: [
                  { id: 'APPROVE_ORDER', title: '✅ Approve', foreground: false },
                  { id: 'VIEW_ORDER', title: '👁️ View Order', foreground: true },
                ],
              },
            ],
          });
        } catch {
          /* ignore */
        }

        // Tap notification listener
        await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
          const data = action.notification.data as { order_id?: string; order_number?: string; url?: string } | undefined;
          const actionId = action.actionId;

          if (actionId === 'APPROVE_ORDER' && data?.order_id) {
            console.log('[admin-push] Auto-hook approving order:', data.order_id);
            const { error } = await supabase
              .from('orders')
              .update({
                status: 'processing',
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.order_id);

            if (!error) {
              alert(`✅ Payment Confirmed for Order ${data.order_number || ''}!`);
            } else {
              alert(`❌ Failed to approve order: ${error.message}`);
            }
          } else {
            const url = data?.url || '/admin/orders';
            if (url.startsWith('/')) window.location.assign(url);
          }
        });

        // Already allowed — re-register token quietly
        const reg = await new Promise<string | null>((resolve) => {
          let done = false;
          void PushNotifications.addListener('registration', (t) => {
            if (!done) {
              done = true;
              resolve(t.value);
            }
          });
          void PushNotifications.register().catch(() => resolve(null));
          setTimeout(() => {
            if (!done) {
              done = true;
              resolve(null);
            }
          }, 12000);
        });
        if (reg) await saveAdminPushToken(reg);
      } catch (e) {
        console.warn('[admin-push] auto setup', e);
      }
    })();
  }, [enabled]);
}

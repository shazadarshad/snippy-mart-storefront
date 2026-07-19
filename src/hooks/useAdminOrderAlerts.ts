import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showAdminOrderNotification } from '@/hooks/useAdminPwa';
import { useToast } from '@/hooks/use-toast';

const NOTIFY_KEY = 'snippy_admin_notify_orders';

function notificationsWanted(): boolean {
  try {
    return localStorage.getItem(NOTIFY_KEY) === '1' && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * While admin is logged in, listen for new orders and alert via toast + system notification.
 * Works best with the Admin PWA open or in background (Android). Fully closed apps need Web Push later.
 */
export function useAdminOrderAlerts(enabled: boolean) {
  const { toast } = useToast();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const row = payload.new as {
            id?: string;
            order_number?: string;
            customer_name?: string;
            total_amount?: number;
            status?: string;
          };
          const id = String(row.id || row.order_number || '');
          if (!id || seen.current.has(id)) return;
          seen.current.add(id);

          const num = row.order_number || id.slice(0, 8);
          const name = row.customer_name || 'Customer';
          const total =
            row.total_amount != null ? `Rs. ${Number(row.total_amount).toLocaleString()}` : '';

          toast({
            title: 'New order received',
            description: `${num} · ${name}${total ? ` · ${total}` : ''}`,
          });

          if (notificationsWanted()) {
            void showAdminOrderNotification({
              title: '🛒 New Snippy order',
              body: `${num} — ${name}${total ? ` · ${total}` : ''}. Tap to open Orders.`,
              orderId: id,
            });
          }

          // Optional sound (soft) when tab visible
          try {
            if (document.visibilityState === 'visible') {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.frequency.value = 880;
              g.gain.value = 0.04;
              o.start();
              setTimeout(() => {
                o.stop();
                ctx.close();
              }, 120);
            }
          } catch {
            /* ignore */
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, toast]);
}

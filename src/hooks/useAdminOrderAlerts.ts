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

/** Shared AudioContext so beeps work after one admin tap (mobile browsers unlock). */
let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new AC();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Call once on first user gesture so later order beeps are allowed. */
export function unlockAdminAlertAudio() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
}

/**
 * Clear two-tone “new order” beep — works in open admin tab / PWA foreground.
 * Android system notifications use the OS default sound separately.
 */
export function playAdminOrderBeep() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const run = () => {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      master.connect(ctx.destination);

      // Ding–dong (pleasant, easy to hear on phone speakers)
      const notes = [
        { f: 880, t: 0, d: 0.14 },
        { f: 1174.66, t: 0.14, d: 0.22 },
      ];

      for (const n of notes) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(n.f, now + n.t);
        g.gain.setValueAtTime(0.0001, now + n.t);
        g.gain.exponentialRampToValueAtTime(0.85, now + n.t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
        o.connect(g);
        g.connect(master);
        o.start(now + n.t);
        o.stop(now + n.t + n.d + 0.02);
      }
    };

    if (ctx.state === 'suspended') {
      void ctx.resume().then(run).catch(() => undefined);
    } else {
      run();
    }
  } catch {
    /* ignore autoplay blocks */
  }
}

/**
 * While admin is logged in, listen for new orders:
 * toast + beep + optional system notification (PWA / browser).
 */
export function useAdminOrderAlerts(enabled: boolean) {
  const { toast } = useToast();
  const seen = useRef<Set<string>>(new Set());

  // Unlock Web Audio on first tap/click so mobile PWA can beep later
  useEffect(() => {
    if (!enabled) return;
    const unlock = () => unlockAdminAlertAudio();
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

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

          // Always try beep when admin session is live (foreground / PWA open)
          playAdminOrderBeep();

          if (notificationsWanted()) {
            void showAdminOrderNotification({
              title: '🛒 New Snippy order',
              body: `${num} — ${name}${total ? ` · ${total}` : ''}. Tap to open Orders.`,
              orderId: id,
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, toast]);
}

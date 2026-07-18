import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'snippy_vid';
const HEARTBEAT_MS = 25_000;

function getOrCreateSessionKey(): string {
  try {
    let k = localStorage.getItem(SESSION_KEY);
    if (k && k.length >= 8) return k;
    k =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(SESSION_KEY, k);
    return k;
  } catch {
    return `v_tmp_${Date.now()}`;
  }
}

function detectDevice(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return 'mobile';
  return 'desktop';
}

async function sendVisit(opts: { path: string; isNewPage: boolean }) {
  if (typeof window === 'undefined') return;
  if (opts.path.startsWith('/admin')) return;

  const session_key = getOrCreateSessionKey();
  try {
    await (supabase as any).rpc('track_site_visit', {
      p_session_key: session_key,
      p_path: opts.path.slice(0, 500),
      p_title: (document.title || '').slice(0, 300),
      p_referrer: (document.referrer || '').slice(0, 500) || null,
      p_user_agent: (navigator.userAgent || '').slice(0, 400) || null,
      p_device: detectDevice(),
      p_language: (navigator.language || '').slice(0, 40) || null,
      p_screen:
        typeof screen !== 'undefined'
          ? `${screen.width}x${screen.height}`
          : null,
      p_is_new_page: opts.isNewPage,
    });
  } catch {
    // Never break the storefront for analytics
  }
}

/**
 * Tracks public storefront page views + presence heartbeats.
 * Skips /admin routes.
 */
export function useSiteVisitorTracking() {
  const location = useLocation();
  const lastPath = useRef<string>('');

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}` || '/';
    if (path.startsWith('/admin')) return;

    const isNewPage = lastPath.current !== path;
    lastPath.current = path;
    void sendVisit({ path, isNewPage });

    const beat = window.setInterval(() => {
      void sendVisit({ path: lastPath.current || path, isNewPage: false });
    }, HEARTBEAT_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void sendVisit({ path: lastPath.current || path, isNewPage: false });
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearInterval(beat);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [location.pathname, location.search]);
}

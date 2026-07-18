import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SiteSession = {
  id: string;
  session_key: string;
  first_seen_at: string;
  last_seen_at: string;
  page_path: string | null;
  page_title: string | null;
  referrer: string | null;
  user_agent: string | null;
  device_type: string | null;
  language: string | null;
  screen: string | null;
  page_views: number;
};

export type SitePageView = {
  id: string;
  session_key: string;
  path: string;
  title: string | null;
  referrer: string | null;
  created_at: string;
};

const LIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function useLiveSessions() {
  return useQuery({
    queryKey: ['site-visitors', 'live'],
    queryFn: async () => {
      const since = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
      const { data, error } = await (supabase as any)
        .from('site_sessions')
        .select('*')
        .gte('last_seen_at', since)
        .order('last_seen_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as SiteSession[];
    },
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useRecentSessions(limit = 50) {
  return useQuery({
    queryKey: ['site-visitors', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_sessions')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SiteSession[];
    },
    refetchInterval: 30_000,
  });
}

export function useRecentPageViews(limit = 80) {
  return useQuery({
    queryKey: ['site-visitors', 'pageviews', limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SitePageView[];
    },
    refetchInterval: 20_000,
  });
}

export function useVisitorStats() {
  return useQuery({
    queryKey: ['site-visitors', 'stats'],
    queryFn: async () => {
      const today = startOfTodayIso();
      const week = daysAgoIso(7);
      const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();

      const [liveRes, todaySessRes, weekSessRes, todayViewsRes, weekViewsRes, topPagesRes] =
        await Promise.all([
          (supabase as any)
            .from('site_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('last_seen_at', liveSince),
          (supabase as any)
            .from('site_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('first_seen_at', today),
          (supabase as any)
            .from('site_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('first_seen_at', week),
          (supabase as any)
            .from('site_page_views')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today),
          (supabase as any)
            .from('site_page_views')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', week),
          (supabase as any)
            .from('site_page_views')
            .select('path')
            .gte('created_at', week)
            .limit(2000),
        ]);

      const topMap = new Map<string, number>();
      for (const row of topPagesRes.data || []) {
        const p = String(row.path || '/');
        topMap.set(p, (topMap.get(p) || 0) + 1);
      }
      const topPages = Array.from(topMap.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        live: liveRes.count ?? 0,
        visitorsToday: todaySessRes.count ?? 0,
        visitorsWeek: weekSessRes.count ?? 0,
        viewsToday: todayViewsRes.count ?? 0,
        viewsWeek: weekViewsRes.count ?? 0,
        topPages,
        error:
          liveRes.error ||
          todaySessRes.error ||
          weekSessRes.error ||
          todayViewsRes.error ||
          weekViewsRes.error ||
          topPagesRes.error,
      };
    },
    refetchInterval: 15_000,
  });
}

export function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return new Date(iso).toLocaleString();
}

export function shortSessionId(key: string): string {
  return key.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function referrerHost(ref: string | null | undefined): string {
  if (!ref) return 'Direct';
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, '') || 'Direct';
  } catch {
    return ref.slice(0, 40);
  }
}

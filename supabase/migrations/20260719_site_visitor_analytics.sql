-- =====================================================
-- SITE VISITOR ANALYTICS (live + history)
-- Privacy-light: session cookie only, no PII required
-- =====================================================

CREATE TABLE IF NOT EXISTS public.site_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  language TEXT,
  screen TEXT,
  page_views INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_sessions_last_seen
  ON public.site_sessions (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_sessions_first_seen
  ON public.site_sessions (first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_page_views_created
  ON public.site_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_page_views_path
  ON public.site_page_views (path);
CREATE INDEX IF NOT EXISTS idx_site_page_views_session
  ON public.site_page_views (session_key);

ALTER TABLE public.site_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read site_sessions" ON public.site_sessions;
CREATE POLICY "Admins read site_sessions"
  ON public.site_sessions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read site_page_views" ON public.site_page_views;
CREATE POLICY "Admins read site_page_views"
  ON public.site_page_views
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct client inserts — only via SECURITY DEFINER RPC

CREATE OR REPLACE FUNCTION public.track_site_visit(
  p_session_key TEXT,
  p_path TEXT,
  p_title TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_screen TEXT DEFAULT NULL,
  p_is_new_page BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
  v_key TEXT;
BEGIN
  v_key := left(trim(coalesce(p_session_key, '')), 64);
  IF length(v_key) < 8 THEN
    RETURN;
  END IF;

  v_path := left(coalesce(nullif(trim(p_path), ''), '/'), 500);

  -- Never track admin panel
  IF v_path ILIKE '/admin%' THEN
    RETURN;
  END IF;

  INSERT INTO public.site_sessions (
    session_key,
    first_seen_at,
    last_seen_at,
    page_path,
    page_title,
    referrer,
    user_agent,
    device_type,
    language,
    screen,
    page_views
  ) VALUES (
    v_key,
    now(),
    now(),
    v_path,
    left(nullif(trim(p_title), ''), 300),
    left(nullif(trim(p_referrer), ''), 500),
    left(nullif(trim(p_user_agent), ''), 400),
    left(nullif(trim(p_device), ''), 40),
    left(nullif(trim(p_language), ''), 40),
    left(nullif(trim(p_screen), ''), 40),
    CASE WHEN coalesce(p_is_new_page, true) THEN 1 ELSE 0 END
  )
  ON CONFLICT (session_key) DO UPDATE SET
    last_seen_at = now(),
    page_path = EXCLUDED.page_path,
    page_title = COALESCE(EXCLUDED.page_title, public.site_sessions.page_title),
    referrer = COALESCE(EXCLUDED.referrer, public.site_sessions.referrer),
    user_agent = COALESCE(EXCLUDED.user_agent, public.site_sessions.user_agent),
    device_type = COALESCE(EXCLUDED.device_type, public.site_sessions.device_type),
    language = COALESCE(EXCLUDED.language, public.site_sessions.language),
    screen = COALESCE(EXCLUDED.screen, public.site_sessions.screen),
    page_views = public.site_sessions.page_views
      + CASE WHEN coalesce(p_is_new_page, true) THEN 1 ELSE 0 END;

  IF coalesce(p_is_new_page, true) THEN
    INSERT INTO public.site_page_views (session_key, path, title, referrer)
    VALUES (
      v_key,
      v_path,
      left(nullif(trim(p_title), ''), 300),
      left(nullif(trim(p_referrer), ''), 500)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_site_visit(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

COMMENT ON TABLE public.site_sessions IS
  'Anonymous browser sessions for live visitor analytics (admin only read).';
COMMENT ON TABLE public.site_page_views IS
  'Page view log for site analytics (admin only read).';

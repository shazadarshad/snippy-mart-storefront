-- =====================================================
-- LINK SHORTENER
-- snippymart.com/{slug} → destination URL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.short_links (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    destination_url text NOT NULL,
    title text,
    click_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT short_links_slug_format CHECK (
        slug ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$'
    )
);

CREATE INDEX IF NOT EXISTS short_links_slug_idx ON public.short_links (slug);
CREATE INDEX IF NOT EXISTS short_links_active_idx ON public.short_links (is_active);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage all short links
CREATE POLICY "Admins can manage short links"
ON public.short_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can resolve active short links (needed for redirect page)
CREATE POLICY "Public can view active short links"
ON public.short_links
FOR SELECT
USING (is_active = true);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_short_links_updated_at ON public.short_links;
CREATE TRIGGER update_short_links_updated_at
BEFORE UPDATE ON public.short_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic click counter (callable by anyone for active links)
CREATE OR REPLACE FUNCTION public.increment_short_link_clicks(link_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.short_links
    SET click_count = click_count + 1
    WHERE slug = link_slug
      AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_short_link_clicks(text) TO anon, authenticated;

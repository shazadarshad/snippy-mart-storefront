import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Resolves snippymart.com/{slug} short links and redirects to the destination URL.
 * Falls back to a 404 UI when the slug is missing or inactive.
 */
const ShortLinkRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [status, setStatus] = useState<'loading' | 'not_found' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const slug = (shortCode || '').trim().toLowerCase();
      if (!slug) {
        setStatus('not_found');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('short_links')
          .select('destination_url, is_active')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data?.destination_url) {
          setStatus('not_found');
          return;
        }

        // Fire-and-forget click counter
        void supabase.rpc('increment_short_link_clicks', { link_slug: slug });

        // Full navigation so external destinations work reliably
        window.location.replace(data.destination_url);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [shortCode]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-6">
        <h1 className="mb-4 text-4xl font-bold">
          {status === 'error' ? 'Something went wrong' : '404'}
        </h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {status === 'error'
            ? 'We could not open that short link. Please try again.'
            : 'This short link does not exist or is no longer active.'}
        </p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default ShortLinkRedirect;

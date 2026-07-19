import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { saveAffiliateRef } from '@/lib/affiliate';

/** Captures ?ref=CODE on any public page and stores for 30 days */
export default function AffiliateRefCapture() {
  const [params] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const ref =
      params.get('ref') ||
      params.get('affiliate') ||
      params.get('aff');
    if (ref) saveAffiliateRef(ref);
  }, [params, location.pathname]);

  return null;
}

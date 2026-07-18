import { useSiteVisitorTracking } from '@/hooks/useSiteVisitorTracking';

/** Mount once under BrowserRouter on public routes */
export default function SiteVisitorTracker() {
  useSiteVisitorTracking();
  return null;
}

import { isCapacitorNative } from '@/hooks/useAdminNativePush';

/** Open a blank tab in the same tap so iOS/Android allow WhatsApp after an await. */
export function preserveOpenGesture(): Window | null {
  if (typeof window === 'undefined') return null;
  if (isCapacitorNative()) return null;
  try {
    const w = window.open('about:blank', '_blank');
    return w && !w.closed ? w : null;
  } catch {
    return null;
  }
}

export function openExternalUrl(url: string, popup?: Window | null) {
  if (!url) return;
  if (popup && !popup.closed) {
    popup.location.href = url;
    return;
  }
  if (isCapacitorNative()) {
    window.open(url, '_system');
    window.location.href = url;
    return;
  }
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) window.location.href = url;
}

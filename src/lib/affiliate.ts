const STORAGE_KEY = 'snippy_affiliate_ref';
const COOKIE_DAYS = 30;

export function normalizeAffiliateCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const c = String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length >= 2 ? c.slice(0, 16) : null;
}

export function saveAffiliateRef(code: string) {
  const c = normalizeAffiliateCode(code);
  if (!c) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: c, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
  try {
    const maxAge = COOKIE_DAYS * 24 * 60 * 60;
    document.cookie = `snippy_ref=${encodeURIComponent(c)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function getAffiliateRef(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { code?: string; at?: number };
      if (parsed?.code && parsed.at) {
        const age = Date.now() - parsed.at;
        if (age < COOKIE_DAYS * 24 * 60 * 60 * 1000) {
          return normalizeAffiliateCode(parsed.code);
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const m = document.cookie.match(/(?:^|;\s*)snippy_ref=([^;]+)/);
    if (m?.[1]) return normalizeAffiliateCode(decodeURIComponent(m[1]));
  } catch {
    /* ignore */
  }
  return null;
}

export function clearAffiliateRef() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = 'snippy_ref=; path=/; max-age=0';
  } catch {
    /* ignore */
  }
}

export function buildAffiliateLink(code: string, path = '/'): string {
  const c = normalizeAffiliateCode(code) || code;
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://snippymart.com';
  const clean = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(clean, base);
  url.searchParams.set('ref', c);
  return url.toString();
}

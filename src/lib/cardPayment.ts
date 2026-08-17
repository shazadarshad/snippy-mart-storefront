export const CARD_PAYMENT_PATH = '/payment';

export function cardPaymentPagePath(orderNumber: string): string {
  return `${CARD_PAYMENT_PATH}/${encodeURIComponent(String(orderNumber || '').trim())}`;
}

export function cardPaymentPageUrl(orderNumber: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://snippymart.com');
  return `${base.replace(/\/$/, '')}${cardPaymentPagePath(orderNumber)}`;
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

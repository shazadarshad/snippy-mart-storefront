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

export type CardInboxState = 'needs_link' | 'waiting_pay' | 'marked_paid' | 'done';

export type CardInboxOrder = {
  status?: string | null;
  payment_method?: string | null;
  card_checkout_url?: string | null;
  card_marked_paid_at?: string | null;
  payment_proof_url?: string | null;
};

export function cardInboxState(order: CardInboxOrder): CardInboxState {
  const status = String(order.status || 'pending');
  if (status !== 'pending') return 'done';
  if (order.card_marked_paid_at || order.payment_proof_url) return 'marked_paid';
  if (String(order.card_checkout_url || '').trim()) return 'waiting_pay';
  return 'needs_link';
}

export function cardInboxRank(order: CardInboxOrder): number {
  switch (cardInboxState(order)) {
    case 'marked_paid':
      return 0;
    case 'needs_link':
      return 1;
    case 'waiting_pay':
      return 2;
    default:
      return 3;
  }
}

export function cardInboxLabel(state: CardInboxState): string {
  switch (state) {
    case 'needs_link':
      return 'Send link';
    case 'waiting_pay':
      return 'Waiting';
    case 'marked_paid':
      return 'They paid';
    default:
      return 'Done';
  }
}

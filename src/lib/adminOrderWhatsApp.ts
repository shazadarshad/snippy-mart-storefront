/**
 * Scenario-aware prefilled WhatsApp messages for admin order ops.
 * Never dump raw credentials — Track Order is the source of truth for Auto products.
 */

import { buildWhatsAppUrl, toWhatsAppDigits } from '@/lib/phoneWhatsApp';
import { cardPaymentPageUrl } from '@/lib/cardPayment';

const TRACK_BASE = 'https://snippymart.com/track-order';

export type WhatsAppScenario =
  | 'auto_ready'
  | 'auto_processing'
  | 'manual_ready'
  | 'pending_payment'
  | 'card_link'
  | 'payment_rejected'
  | 'generic_support';

export type OrderForWhatsApp = {
  order_number: string;
  customer_name?: string | null;
  customer_whatsapp?: string | null;
  customer_country?: string | null;
  status?: string | null;
  payment_method?: string | null;
  total_amount?: number | null;
  order_items?: Array<{
    product_name?: string | null;
    products?: { reseller_product_id?: string | null } | null;
  }> | null;
};

export type DeliveryRowLite = {
  status?: string | null;
  delivered_data?: string | null;
};

function trackUrl(orderNumber: string) {
  return `${TRACK_BASE}?orderId=${encodeURIComponent(orderNumber)}`;
}

function firstName(name?: string | null) {
  const n = String(name || '').trim();
  if (!n || n.toLowerCase() === 'customer') return 'there';
  return n.split(/\s+/)[0] || 'there';
}

export function orderHasAutoItems(order: OrderForWhatsApp): boolean {
  return (order.order_items || []).some(
    (i) => i.products?.reseller_product_id && String(i.products.reseller_product_id).trim(),
  );
}

export function hasSuccessfulAutoDelivery(deliveries: DeliveryRowLite[]): boolean {
  return (deliveries || []).some(
    (d) => d.status === 'delivered' && !!String(d.delivered_data || '').trim(),
  );
}

/** Pick best default scenario for one-tap admin action */
export function detectWhatsAppScenario(
  order: OrderForWhatsApp,
  deliveries: DeliveryRowLite[] = [],
): WhatsAppScenario {
  const status = String(order.status || 'pending');
  const isAuto = orderHasAutoItems(order) || deliveries.length > 0;
  const ready = hasSuccessfulAutoDelivery(deliveries);

  if (status === 'cancelled' || status === 'refunded' || status === 'on_hold') {
    return 'payment_rejected';
  }
  if (status === 'pending' && order.payment_method === 'card') {
    return 'card_link';
  }
  if (status === 'pending') {
    return 'pending_payment';
  }
  if (isAuto && ready) {
    return 'auto_ready';
  }
  if (isAuto && (status === 'processing' || status === 'shipping')) {
    return 'auto_processing';
  }
  if (status === 'completed' || status === 'delivered') {
    return isAuto ? 'auto_ready' : 'manual_ready';
  }
  if (isAuto) {
    return 'auto_processing';
  }
  return 'generic_support';
}

export function buildOrderWhatsAppMessage(
  scenario: WhatsAppScenario,
  order: OrderForWhatsApp,
  opts?: { mixedCart?: boolean; cardPaymentLink?: string | null; amountLabel?: string | null },
): string {
  const name = firstName(order.customer_name);
  const id = order.order_number;
  const url = trackUrl(id);
  const mixedNote = opts?.mixedCart
    ? '\n(Note: Auto products are on Track Order; any other items may take a bit longer.)\n'
    : '';

  switch (scenario) {
    case 'auto_ready':
      return [
        `Hi ${name}! ✅`,
        '',
        'Your Snippy Mart order is ready.',
        '',
        `Order ID: *${id}*`,
        mixedNote,
        'How to get your product:',
        `1. Open: ${url}`,
        '2. Tap *Track* (Order ID is in the link — or paste it if needed)',
        '3. Copy your code / link / login from the page',
        '',
        'Save this message so you can reopen Track Order anytime.',
        'Questions? Reply here.',
      ]
        .filter((l) => l !== undefined)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');

    case 'auto_processing':
      return [
        `Hi ${name}! 👍`,
        '',
        'Payment confirmed — we are delivering your Auto product.',
        '',
        `Order ID: *${id}*`,
        '',
        'Usually ready within about *30 minutes*.',
        '',
        'When ready, open Track Order:',
        url,
        '',
        'Keep this Order ID safe. Reply here if you need help.',
      ].join('\n');

    case 'manual_ready':
      return [
        `Hi ${name}! ✅`,
        '',
        'Your Snippy Mart order is complete.',
        '',
        `Order ID: *${id}*`,
        '',
        'You can check status anytime:',
        url,
        '',
        'Reply here if you need anything.',
      ].join('\n');

    case 'card_link': {
      const amount = opts?.amountLabel ? `\nAmount: *${opts.amountLabel}*` : '';
      const payPage =
        String(opts?.cardPaymentLink || '').trim() || cardPaymentPageUrl(id);
      return [
        `Hi ${name}!`,
        '',
        'Pay securely for your Snippy Mart order.',
        '',
        `Order ID: *${id}*${amount}`,
        '',
        'Open this Snippy Mart page:',
        payPage,
        '',
        '1. Tap *Proceed to payment*',
        '2. Pay with Visa / Mastercard',
        '3. Come back and upload the confirmation on the same page',
        '',
        'Track order:',
        url,
        '',
        'Reply here if you need help.',
      ].join('\n');
    }

    case 'pending_payment':
      return [
        `Hi ${name},`,
        '',
        'We received your Snippy Mart order and are waiting for payment confirmation.',
        '',
        `Order ID: *${id}*`,
        '',
        'Please complete payment and include the Order ID in the transfer note / proof.',
        'Track status:',
        url,
        '',
        'Reply here after you pay or if you need help.',
      ].join('\n');

    case 'payment_rejected':
      return [
        `Hi ${name},`,
        '',
        'There is an issue with payment for your order.',
        '',
        `Order ID: *${id}*`,
        '',
        'Please send a clear payment screenshot or try again, then reply here.',
        'Track order:',
        url,
      ].join('\n');

    case 'generic_support':
    default:
      return [
        `Hi ${name}!`,
        '',
        `Regarding your Snippy Mart order *${id}*.`,
        '',
        'Track order:',
        url,
        '',
        'How can we help?',
      ].join('\n');
  }
}

export function scenarioLabel(scenario: WhatsAppScenario): string {
  switch (scenario) {
    case 'auto_ready':
      return 'Product ready (Track Order steps)';
    case 'auto_processing':
      return 'Payment OK — wait for delivery';
    case 'manual_ready':
      return 'Order complete';
    case 'pending_payment':
      return 'Pending payment';
    case 'card_link':
      return 'Send card payment link';
    case 'payment_rejected':
      return 'Payment issue';
    default:
      return 'Support message';
  }
}

export function getOrderWhatsAppLink(
  order: OrderForWhatsApp,
  scenario?: WhatsAppScenario,
  deliveries: DeliveryRowLite[] = [],
  extras?: { cardPaymentLink?: string | null; amountLabel?: string | null },
): { url: string | null; digits: string; display: string; ok: boolean; fixed: boolean; message: string; scenario: WhatsAppScenario } {
  const sc = scenario || detectWhatsAppScenario(order, deliveries);
  const isAuto = orderHasAutoItems(order) || deliveries.length > 0;
  const mixed =
    isAuto &&
    (order.order_items || []).some(
      (i) => !i.products?.reseller_product_id || !String(i.products.reseller_product_id).trim(),
    ) &&
    (order.order_items || []).length > 1;

  const message = buildOrderWhatsAppMessage(sc, order, {
    mixedCart: mixed,
    cardPaymentLink: extras?.cardPaymentLink,
    amountLabel: extras?.amountLabel,
  });
  const phone = toWhatsAppDigits(order.customer_whatsapp || '', {
    defaultCountry: 'LK',
    countryHint: order.customer_country,
  });
  const url = phone.ok ? buildWhatsAppUrl(phone.digits, message) : null;

  return {
    url,
    digits: phone.digits,
    display: phone.e164Display,
    ok: phone.ok,
    fixed: phone.fixed,
    message,
    scenario: sc,
  };
}

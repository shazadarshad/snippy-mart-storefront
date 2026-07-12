import type { Order, OrderItem, OrderStatus } from '@/hooks/useOrders';

export type ClaudeWorkflowStage =
  | 'deposit_pending'
  | 'deposit_verified'
  | 'balance_paid'
  | 'activated';

/** full = 100% now · reserve = 50% hold, 50% at activation */
export type ClaudePaymentMode = 'full' | 'reserve';

export const CLAUDE_RESERVE_RATE = 0.5;

export interface ClaudePreOrderInfo {
  isClaude: boolean;
  plan: string;
  fullPrice: number | null;
  /** Amount paid / due now on this order */
  deposit: number | null;
  remaining: number | null;
  claudeEmail: string | null;
  stage: ClaudeWorkflowStage;
  productName: string | null;
  variantName: string | null;
  paymentMode: ClaudePaymentMode;
  isFullPayment: boolean;
}

const WORKFLOW_BLOCK = '=== CLAUDE WORKFLOW ===';
const PREORDER_MARKER = 'CLAUDE PRE-ORDER';

const STAGE_LABELS: Record<ClaudeWorkflowStage, string> = {
  deposit_pending: 'Payment pending',
  deposit_verified: 'Payment verified',
  balance_paid: 'Balance paid',
  activated: 'Activated',
};

const STAGE_ORDER: ClaudeWorkflowStage[] = [
  'deposit_pending',
  'deposit_verified',
  'balance_paid',
  'activated',
];

export const claudeStageLabel = (
  stage: ClaudeWorkflowStage,
  paymentMode: ClaudePaymentMode = 'reserve'
) => {
  if (paymentMode === 'full') {
    if (stage === 'deposit_pending') return 'Payment pending';
    if (stage === 'deposit_verified') return 'Payment verified';
    if (stage === 'balance_paid') return 'Ready to activate';
    if (stage === 'activated') return 'Activated';
  }
  if (stage === 'deposit_pending') return 'Deposit pending';
  if (stage === 'deposit_verified') return 'Deposit verified';
  return STAGE_LABELS[stage];
};

export const claudeStageOrder = STAGE_ORDER;

/** Stages to show in UI for a given payment mode */
export const stagesForPaymentMode = (mode: ClaudePaymentMode): ClaudeWorkflowStage[] => {
  if (mode === 'full') {
    return ['deposit_pending', 'deposit_verified', 'activated'];
  }
  return STAGE_ORDER;
};

export const amountDueNow = (fullPrice: number, mode: ClaudePaymentMode) => {
  if (mode === 'full') return fullPrice;
  return Math.round(fullPrice * CLAUDE_RESERVE_RATE);
};

export const remainingBalance = (fullPrice: number, mode: ClaudePaymentMode) => {
  if (mode === 'full') return 0;
  return fullPrice - amountDueNow(fullPrice, mode);
};

const parseLkrAmount = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const extractNoteLine = (notes: string | null | undefined, prefix: string): string | null => {
  if (!notes) return null;
  const line = notes.split('\n').find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!line) return null;
  return line.slice(prefix.length).trim() || null;
};

export const isClaudePreOrder = (order: Pick<Order, 'notes' | 'order_items'>): boolean => {
  const notes = order.notes || '';
  if (notes.includes(PREORDER_MARKER) || notes.toLowerCase().includes('claude team')) {
    return true;
  }

  return (order.order_items || []).some((item) => {
    const name = (item.product_name || '').toLowerCase();
    const creds = item.customer_credentials as Record<string, unknown> | null | undefined;
    return (
      name.includes('claude') ||
      creds?.service === 'claude' ||
      creds?.preorder === true
    );
  });
};

const stageFromNotes = (notes: string | null | undefined): ClaudeWorkflowStage | null => {
  if (!notes) return null;
  const match = notes.match(/stage:\s*(deposit_pending|deposit_verified|balance_paid|activated)/i);
  if (!match) return null;
  return match[1].toLowerCase() as ClaudeWorkflowStage;
};

const stageFromStatus = (status: OrderStatus | string): ClaudeWorkflowStage => {
  if (status === 'completed' || status === 'delivered') return 'activated';
  if (status === 'shipping') return 'balance_paid';
  if (status === 'processing') return 'deposit_verified';
  return 'deposit_pending';
};

const pickClaudeItem = (items: OrderItem[] | undefined): OrderItem | null => {
  if (!items?.length) return null;
  return (
    items.find((i) => {
      const name = (i.product_name || '').toLowerCase();
      const creds = i.customer_credentials as Record<string, unknown> | null | undefined;
      return name.includes('claude') || creds?.service === 'claude' || creds?.preorder === true;
    }) || items[0]
  );
};

const parsePaymentMode = (
  notes: string | null | undefined,
  creds: Record<string, unknown>
): ClaudePaymentMode => {
  const fromNotes = extractNoteLine(notes, 'Payment mode:');
  if (fromNotes) {
    const lower = fromNotes.toLowerCase();
    if (lower.includes('full') || lower.includes('100')) return 'full';
    if (lower.includes('reserve') || lower.includes('50') || lower.includes('deposit')) return 'reserve';
  }
  if (creds.payment_mode === 'full' || creds.full_payment === true) return 'full';
  if (creds.payment_mode === 'reserve') return 'reserve';

  // Legacy 30% notes still count as reserve
  if (notes?.includes('Deposit paid (30%)') || notes?.includes('Deposit paid (50%)')) {
    return 'reserve';
  }

  // If remaining is 0 and total ≈ full price → full
  const fullPrice =
    parseLkrAmount(extractNoteLine(notes, 'Full price:')) ??
    (typeof creds.full_price === 'number' ? creds.full_price : null);
  const remaining =
    parseLkrAmount(extractNoteLine(notes, 'Balance due on activation')) ??
    parseLkrAmount(extractNoteLine(notes, 'Balance due:')) ??
    (typeof creds.remaining_amount === 'number' ? creds.remaining_amount : null);

  if (remaining === 0 && fullPrice != null) return 'full';
  if (notes?.toLowerCase().includes('full payment')) return 'full';

  return 'reserve';
};

export const parseClaudePreOrder = (order: Order): ClaudePreOrderInfo | null => {
  if (!isClaudePreOrder(order)) return null;

  const item = pickClaudeItem(order.order_items);
  const creds = (item?.customer_credentials || {}) as Record<string, unknown>;

  const planFromNotes = extractNoteLine(order.notes, 'Plan:');
  const plan =
    planFromNotes ||
    item?.variant_name ||
    (typeof creds.plan === 'string' ? creds.plan : null) ||
    item?.plan_name ||
    'Claude Team';

  const fullPrice =
    parseLkrAmount(extractNoteLine(order.notes, 'Full price:')) ??
    (typeof creds.full_price === 'number' ? creds.full_price : null);

  const paymentMode = parsePaymentMode(order.notes, creds);

  const deposit =
    parseLkrAmount(extractNoteLine(order.notes, 'Amount paid now:')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Deposit paid (50%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Deposit paid (30%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Deposit paid:')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Full payment:')) ??
    (typeof creds.deposit_amount === 'number' ? creds.deposit_amount : null) ??
    (typeof order.total_amount === 'number' ? order.total_amount : null);

  let remaining =
    parseLkrAmount(extractNoteLine(order.notes, 'Balance due on activation (50%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Balance due on activation (70%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Balance due:')) ??
    (typeof creds.remaining_amount === 'number' ? creds.remaining_amount : null);

  if (remaining == null && fullPrice != null && deposit != null) {
    remaining = Math.max(0, fullPrice - deposit);
  }
  if (paymentMode === 'full') remaining = 0;

  const claudeEmail =
    extractNoteLine(order.notes, 'Claude account email:') ||
    (typeof creds.email === 'string' ? creds.email : null) ||
    null;

  let stage = stageFromNotes(order.notes) || stageFromStatus(order.status);
  // Full payment never needs balance_paid stage — map shipping to ready (deposit_verified path)
  if (paymentMode === 'full' && stage === 'balance_paid') {
    stage = 'deposit_verified';
  }

  return {
    isClaude: true,
    plan: String(plan),
    fullPrice,
    deposit,
    remaining,
    claudeEmail,
    stage,
    productName: item?.product_name || 'Claude Team Plan',
    variantName: item?.variant_name || null,
    paymentMode,
    isFullPayment: paymentMode === 'full',
  };
};

export const applyClaudeWorkflowToNotes = (
  notes: string | null | undefined,
  stage: ClaudeWorkflowStage
): string => {
  const base = (notes || '').replace(/\n?=== CLAUDE WORKFLOW ===[\s\S]*?(?=\n===|$)/g, '').trimEnd();
  const block = [
    WORKFLOW_BLOCK,
    `stage: ${stage}`,
    `updated_at: ${new Date().toISOString()}`,
  ].join('\n');

  return base ? `${base}\n\n${block}` : block;
};

export const statusForClaudeStage = (
  stage: ClaudeWorkflowStage,
  paymentMode: ClaudePaymentMode = 'reserve'
): OrderStatus | null => {
  switch (stage) {
    case 'deposit_pending':
      return 'pending';
    case 'deposit_verified':
      // Full pay: verified means ready for invite → still processing until activated
      return paymentMode === 'full' ? 'processing' : 'processing';
    case 'balance_paid':
      return 'shipping';
    case 'activated':
      return 'completed';
    default:
      return null;
  }
};

export const formatLkrAdmin = (amount: number | null | undefined) => {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `LKR ${Number(amount).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
};

export interface ClaudeWhatsAppOrderPayload {
  orderId: string;
  name: string;
  customerWhatsapp: string;
  claudeEmail: string;
  plan: string;
  paymentMode: ClaudePaymentMode;
  fullPrice: number;
  amountPaid: number;
  remaining: number;
  bankName?: string;
}

/** Prefilled message customer sends you after placing a Claude order */
export const buildClaudeOrderWhatsAppMessage = (p: ClaudeWhatsAppOrderPayload): string => {
  const isFull = p.paymentMode === 'full';
  const lines = [
    `Hi Snippy Mart! 👋`,
    ``,
    `I just placed a *Claude Team* order on the website.`,
    ``,
    `*Order ID:* ${p.orderId}`,
    `*Name:* ${p.name}`,
    `*My WhatsApp:* ${p.customerWhatsapp}`,
    `*Claude account email:* ${p.claudeEmail}`,
    `*Plan:* ${p.plan}`,
    `*Payment:* ${isFull ? 'Full payment (100%)' : '50% reserve'}`,
    `*Full price:* ${formatLkrAdmin(p.fullPrice)}`,
    `*Paid now:* ${formatLkrAdmin(p.amountPaid)}`,
    isFull
      ? `*Balance due:* None`
      : `*Balance due at activation:* ${formatLkrAdmin(p.remaining)}`,
    `*Method:* Bank transfer`,
    `*Receipt:* Uploaded on website ✅`,
    `*Delivery:* Private workspace invite (Pro/Max)`,
    ``,
    `Please confirm payment and process my seat. Thank you!`,
  ];
  return lines.join('\n');
};

export const buildClaudeOrderWhatsAppUrl = (
  storeWhatsappDigits: string,
  payload: ClaudeWhatsAppOrderPayload
): string => {
  const digits = storeWhatsappDigits.replace(/\D/g, '') || '94787767869';
  const text = buildClaudeOrderWhatsAppMessage(payload);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

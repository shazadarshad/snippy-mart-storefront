import type { Order, OrderItem, OrderStatus } from '@/hooks/useOrders';

export type ClaudeWorkflowStage =
  | 'deposit_pending'
  | 'deposit_verified'
  | 'balance_paid'
  | 'activated';

export interface ClaudePreOrderInfo {
  isClaude: boolean;
  plan: string;
  fullPrice: number | null;
  deposit: number | null;
  remaining: number | null;
  claudeEmail: string | null;
  stage: ClaudeWorkflowStage;
  productName: string | null;
  variantName: string | null;
}

const WORKFLOW_BLOCK = '=== CLAUDE WORKFLOW ===';
const PREORDER_MARKER = 'CLAUDE PRE-ORDER';

const STAGE_LABELS: Record<ClaudeWorkflowStage, string> = {
  deposit_pending: 'Deposit pending',
  deposit_verified: 'Deposit verified',
  balance_paid: 'Balance paid',
  activated: 'Activated',
};

const STAGE_ORDER: ClaudeWorkflowStage[] = [
  'deposit_pending',
  'deposit_verified',
  'balance_paid',
  'activated',
];

export const claudeStageLabel = (stage: ClaudeWorkflowStage) => STAGE_LABELS[stage];
export const claudeStageOrder = STAGE_ORDER;

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
  if (status === 'processing' || status === 'shipping') return 'deposit_verified';
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

  const deposit =
    parseLkrAmount(extractNoteLine(order.notes, 'Deposit paid (30%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Deposit paid:')) ??
    (typeof creds.deposit_amount === 'number' ? creds.deposit_amount : null) ??
    (typeof order.total_amount === 'number' ? order.total_amount : null);

  const remaining =
    parseLkrAmount(extractNoteLine(order.notes, 'Balance due on activation (70%):')) ??
    parseLkrAmount(extractNoteLine(order.notes, 'Balance due:')) ??
    (typeof creds.remaining_amount === 'number' ? creds.remaining_amount : null) ??
    (fullPrice != null && deposit != null ? fullPrice - deposit : null);

  const claudeEmail =
    extractNoteLine(order.notes, 'Claude account email:') ||
    (typeof creds.email === 'string' ? creds.email : null) ||
    null;

  const stage = stageFromNotes(order.notes) || stageFromStatus(order.status);

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

export const statusForClaudeStage = (stage: ClaudeWorkflowStage): OrderStatus | null => {
  switch (stage) {
    case 'deposit_pending':
      return 'pending';
    case 'deposit_verified':
      return 'processing';
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

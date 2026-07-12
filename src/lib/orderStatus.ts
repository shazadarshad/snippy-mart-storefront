import type { OrderStatus } from '@/hooks/useOrders';
import {
  Clock,
  BadgeCheck,
  Loader2,
  Rocket,
  CheckCircle2,
  PauseCircle,
  XCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

/** Happy-path steps shown on track order (1–4) */
export type TrackStepId =
  | 'placed'
  | 'payment_confirmed'
  | 'processing'
  | 'completed';

export interface TrackStep {
  id: TrackStepId;
  /** Maps to progress 1–4 */
  step: number;
  shortLabel: string;
  fullLabel: string;
  description: string;
  icon: LucideIcon;
}

export interface OrderStatusDisplay {
  /** Customer-facing title */
  title: string;
  /** Short badge label */
  badge: string;
  description: string;
  color: string;
  icon: LucideIcon;
  /** 0 = terminal/special, 1–4 = pipeline */
  step: number;
  isTerminal: boolean;
  isNegative: boolean;
}

/** Admin dropdown: value → label customers effectively see */
export const ORDER_STATUS_ADMIN_OPTIONS: {
  value: OrderStatus;
  label: string;
  hint: string;
}[] = [
  {
    value: 'pending',
    label: 'Pending payment',
    hint: 'Order placed — waiting for payment confirmation',
  },
  {
    value: 'processing',
    label: 'Payment confirmed',
    hint: 'Payment verified — order confirmed, preparing',
  },
  {
    value: 'shipping',
    label: 'Order processing',
    hint: 'Fulfilling / activating access',
  },
  {
    value: 'completed',
    label: 'Completed',
    hint: 'Delivered / access ready',
  },
  {
    value: 'on_hold',
    label: 'On hold',
    hint: 'Paused — needs review',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    hint: 'Order cancelled',
  },
  {
    value: 'refunded',
    label: 'Refunded',
    hint: 'Payment refunded',
  },
];

export const TRACK_PIPELINE: TrackStep[] = [
  {
    id: 'placed',
    step: 1,
    shortLabel: 'Placed',
    fullLabel: 'Order placed',
    description: 'We received your order',
    icon: Clock,
  },
  {
    id: 'payment_confirmed',
    step: 2,
    shortLabel: 'Payment',
    fullLabel: 'Payment confirmed',
    description: 'Payment verified by our team',
    icon: BadgeCheck,
  },
  {
    id: 'processing',
    step: 3,
    shortLabel: 'Processing',
    fullLabel: 'Order processing',
    description: 'Preparing / activating your product',
    icon: Rocket,
  },
  {
    id: 'completed',
    step: 4,
    shortLabel: 'Done',
    fullLabel: 'Completed',
    description: 'Access ready / order complete',
    icon: CheckCircle2,
  },
];

export function getOrderStatusDisplay(status: string | null | undefined): OrderStatusDisplay {
  const s = (status || 'pending') as OrderStatus;

  switch (s) {
    case 'pending':
      return {
        title: 'Awaiting payment confirmation',
        badge: 'Pending payment',
        description:
          'Your order is placed. We are verifying your payment / bank transfer. This usually takes a short time after you upload the receipt.',
        color: 'text-warning bg-warning/10 border-warning/25',
        icon: Clock,
        step: 1,
        isTerminal: false,
        isNegative: false,
      };
    case 'processing':
      return {
        title: 'Payment confirmed',
        badge: 'Payment confirmed',
        description:
          'Your payment is verified and the order is confirmed. We are preparing your product or seat next.',
        color: 'text-primary bg-primary/10 border-primary/25',
        icon: BadgeCheck,
        step: 2,
        isTerminal: false,
        isNegative: false,
      };
    case 'shipping':
      return {
        title: 'Order processing',
        badge: 'Processing',
        description:
          'We are fulfilling your order — activating access, assigning inventory, or sending your invite.',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
        icon: Loader2,
        step: 3,
        isTerminal: false,
        isNegative: false,
      };
    case 'completed':
      return {
        title: 'Order completed',
        badge: 'Completed',
        description:
          'Your order is complete. Access details (if any) appear below or were sent via WhatsApp / email.',
        color: 'text-success bg-success/10 border-success/25',
        icon: CheckCircle2,
        step: 4,
        isTerminal: true,
        isNegative: false,
      };
    case 'on_hold':
      return {
        title: 'Order on hold',
        badge: 'On hold',
        description:
          'Your order is temporarily paused. Please contact support on WhatsApp with your Order ID.',
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/25',
        icon: PauseCircle,
        step: 2,
        isTerminal: false,
        isNegative: false,
      };
    case 'cancelled':
      return {
        title: 'Order cancelled',
        badge: 'Cancelled',
        description: 'This order was cancelled. Contact support if you need help.',
        color: 'text-destructive bg-destructive/10 border-destructive/25',
        icon: XCircle,
        step: 0,
        isTerminal: true,
        isNegative: true,
      };
    case 'refunded':
      return {
        title: 'Order refunded',
        badge: 'Refunded',
        description: 'This order was refunded. Contact support for questions about the refund.',
        color: 'text-muted-foreground bg-muted border-border',
        icon: RefreshCw,
        step: 0,
        isTerminal: true,
        isNegative: true,
      };
    default:
      return {
        title: 'Order status unknown',
        badge: String(status || 'Unknown'),
        description: 'Please contact support with your Order ID.',
        color: 'text-muted-foreground bg-muted border-border',
        icon: Clock,
        step: 1,
        isTerminal: false,
        isNegative: false,
      };
  }
}

/** Which pipeline steps are completed for a status */
export function isTrackStepDone(status: string | null | undefined, step: number): boolean {
  const info = getOrderStatusDisplay(status);
  if (info.step === 0) return false;
  if (status === 'on_hold') {
    // On hold: order placed + payment may be mid-review — show step 1 done only
    return step <= 1;
  }
  return info.step >= step;
}

export function isTrackStepCurrent(status: string | null | undefined, step: number): boolean {
  const info = getOrderStatusDisplay(status);
  if (info.step === 0) return false;
  if (status === 'on_hold' && step === 1) return false;
  if (status === 'on_hold') return step === 2; // show pause around payment/processing
  return info.step === step;
}

export function getDefaultStatusMessage(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Your order is received. We are waiting to confirm your payment.';
    case 'processing':
      return 'Payment confirmed! Your order is confirmed and we are preparing it now.';
    case 'shipping':
      return 'Your order is being processed — fulfillment / activation is in progress.';
    case 'completed':
      return 'Your order is complete! Check this page or WhatsApp for access details.';
    case 'on_hold':
      return 'Your order is on hold. Please contact us on WhatsApp with your Order ID.';
    case 'cancelled':
      return 'Your order has been cancelled. Contact support if you have questions.';
    case 'refunded':
      return 'Your order has been refunded. Contact support if you need more details.';
    default:
      return `Your order status has been updated to ${status}.`;
  }
}

export function adminStatusLabel(status: string | null | undefined): string {
  const opt = ORDER_STATUS_ADMIN_OPTIONS.find((o) => o.value === status);
  return opt?.label || (status || 'Unknown');
}

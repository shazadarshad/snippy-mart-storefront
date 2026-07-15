import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  CheckCircle2,
  Search,
  Home,
  ExternalLink,
  Users,
  Loader2,
  Copy,
  ShieldCheck,
  Package,
  Clock3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { useTrackOrder } from '@/hooks/useOrders';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { FormattedDescription } from '@/components/products/FormattedDescription';
import { buildClaudeOrderWhatsAppUrl } from '@/lib/claudePreorder';
import { cn } from '@/lib/utils';
import SEO from '@/components/seo/SEO';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/EB9hDAkQBmcHEjlTMLYXBh';

interface OrderData {
  orderId: string;
  whatsapp: string;
  name?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  discount?: number;
  isPreOrder?: boolean;
  whatsappConfirmUrl?: string;
  preOrder?: {
    service: string;
    plan: string;
    fullPrice: number;
    deposit: number;
    remaining: number;
    claudeEmail: string;
    depositRate: number;
    paymentMode?: 'full' | 'reserve';
    isFullPayment?: boolean;
  };
}

function buildStandardOrderWhatsAppMessage(
  order: OrderData,
  total: number,
  formatPrice: (n: number) => string
): string {
  const lines = [
    'Hello Snippy Mart! ✅ I just placed an order.',
    '',
    `Order ID: ${order.orderId}`,
    `Name: ${order.name || 'Customer'}`,
    `WhatsApp: ${order.whatsapp}`,
  ];

  if (order.items?.length) {
    lines.push('', 'Items:');
    order.items.forEach((item) => {
      lines.push(
        `• ${item.name} ×${item.quantity} — ${formatPrice(item.price * item.quantity)}`
      );
    });
  }

  lines.push('', `Total: ${formatPrice(total)}`, '', 'Payment proof uploaded. Please confirm. 🙏');
  return lines.join('\n');
}

function resolveWhatsAppConfirmUrl(
  order: OrderData | null,
  storeWhatsapp?: string | null,
  formatPrice?: (n: number) => string,
  liveTotal?: number
): string | null {
  if (!order) return null;
  if (order.whatsappConfirmUrl) return order.whatsappConfirmUrl;

  if (order.isPreOrder && order.preOrder) {
    return buildClaudeOrderWhatsAppUrl(storeWhatsapp || '94787767869', {
      orderId: order.orderId,
      name: order.name || 'Customer',
      customerWhatsapp: order.whatsapp,
      claudeEmail: order.preOrder.claudeEmail,
      plan: order.preOrder.plan,
      paymentMode:
        order.preOrder.paymentMode || (order.preOrder.isFullPayment ? 'full' : 'reserve'),
      fullPrice: order.preOrder.fullPrice,
      amountPaid: order.preOrder.deposit,
      remaining: order.preOrder.remaining,
    });
  }

  const number = (storeWhatsapp || '94787767869').replace(/\D/g, '');
  const total = liveTotal ?? order.total ?? 0;
  const message = formatPrice
    ? buildStandardOrderWhatsAppMessage(order, total, formatPrice)
    : `Hello! I just placed an order. Order ID: ${order.orderId}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const OrderSuccessPage = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionOrder, setSessionOrder] = useState<OrderData | null>(null);
  const { data: settings, isLoading: isSettingsLoading } = useSiteSettings();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('lastOrder');
    if (storedOrder) {
      try {
        setSessionOrder(JSON.parse(storedOrder));
      } catch {
        /* ignore */
      }
    }
    sessionStorage.removeItem('waNeedsRetry');
    sessionStorage.removeItem('autoOpenWhatsApp');
  }, [navigate]);

  const { data: liveOrder, isLoading: isLiveOrderLoading } = useTrackOrder(
    sessionOrder?.orderId || ''
  );
  const { assignment, isLoading: isAutomationLoading } = useOrderAutomation(liveOrder?.id);

  const copyToClipboard = (text: string, label: string = 'ID') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: 'Copied to clipboard.',
    });
  };

  // Only wait while we actually have an order id to look up
  if (sessionOrder?.orderId && isLiveOrderLoading) {
    return (
      <div className="min-h-dvh page-mesh pt-28 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading your order…</p>
        </div>
      </div>
    );
  }

  if (!sessionOrder && !liveOrder) {
    return (
      <div className="min-h-dvh page-mesh pt-28 pb-20 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="font-display text-xl font-bold mb-2">No order to show</p>
          <p className="text-sm text-muted-foreground mb-6">
            Place an order or track an existing one.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild className="rounded-xl">
              <Link to="/products">Browse products</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/track-order">Track order</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orderId = liveOrder?.order_number || sessionOrder?.orderId || '';
  const total = liveOrder?.total_amount || sessionOrder?.total || 0;
  const items = sessionOrder?.items || [];
  const isCompleted = liveOrder?.status === 'completed' || liveOrder?.status === 'delivered';
  const isPending = !liveOrder?.status || liveOrder?.status === 'pending';
  const showAutomation = assignment && (isCompleted || liveOrder?.status === 'processing');

  const getWhatsAppLink = () => {
    if (sessionOrder) {
      const rich = resolveWhatsAppConfirmUrl(
        sessionOrder,
        settings?.whatsapp_number,
        formatPrice,
        total
      );
      if (rich) return rich;
    }
    const number = settings?.whatsapp_number || '94787767869';
    const message = `Hello Snippy Mart! I just placed order ${orderId}. Please confirm.`;
    return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const whatsAppHref = getWhatsAppLink();
  const showWhatsAppCta = !isCompleted;

  const getServiceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('netflix')) return '🍿';
    if (t.includes('prime')) return '📦';
    if (t.includes('spotify')) return '🎵';
    if (t.includes('cursor')) return '🖱️';
    if (t.includes('adobe')) return '🎨';
    return '🔑';
  };

  return (
    <div className="min-h-dvh page-mesh pt-24 sm:pt-28 pb-safe pb-16 sm:pb-20">
      <SEO title="Order confirmed" description="Your Snippy Mart order was placed successfully." />
      <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
        {/* Success header — tighter on mobile */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="relative inline-flex mb-3 sm:mb-5">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150" />
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-1.5 sm:mb-2">
            {sessionOrder?.isPreOrder ? 'Pre-order locked in' : 'Order confirmed'}
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed px-1">
            Thanks{sessionOrder?.name ? `, ${sessionOrder.name}` : ''}! Tap WhatsApp below to send
            your order details and finish confirmation.
          </p>
        </div>

        {/* Order ID card */}
        <div className="surface-card p-3.5 sm:p-5 mb-3 sm:mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Order ID
            </p>
            <p className="font-mono text-base sm:text-xl font-bold text-primary break-all">{orderId}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0 h-10 text-foreground"
            onClick={() => copyToClipboard(orderId, 'Order ID')}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy ID
          </Button>
        </div>

        {/* Status + total */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-5">
          <div className="surface-card p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Status
            </p>
            <p
              className={cn(
                'text-sm font-bold capitalize',
                isCompleted && 'text-emerald-600',
                isPending && 'text-amber-600',
                !isCompleted && !isPending && 'text-primary'
              )}
            >
              {(liveOrder?.status || 'pending').replace(/_/g, ' ')}
            </p>
          </div>
          <div className="surface-card p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Total paid
            </p>
            <p className="text-sm sm:text-base font-bold text-foreground tabular-nums">
              {formatPrice(total)}
            </p>
            {(liveOrder?.discount_amount > 0 || (sessionOrder?.discount || 0) > 0) && (
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                Saved {formatPrice(liveOrder?.discount_amount || sessionOrder?.discount || 0)}
              </p>
            )}
          </div>
        </div>

        {/* Primary CTA — right under order summary so it's above the fold on mobile */}
        {showWhatsAppCta && (
          <div className="mb-4 sm:mb-5 space-y-2">
            <Button
              variant="whatsapp"
              size="xl"
              className="w-full min-h-14 h-14 rounded-2xl text-base font-bold shadow-lg shadow-[#25D366]/30 touch-manipulation text-white"
              asChild
              disabled={isSettingsLoading}
            >
              <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                {isSettingsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                )}
                {sessionOrder?.isPreOrder ? 'Send order on WhatsApp' : 'Confirm order on WhatsApp'}
              </a>
            </Button>
            <p className="text-center text-[11px] sm:text-xs text-foreground/70 px-2">
              Opens WhatsApp with your order details prefilled — one tap to send us.
            </p>
          </div>
        )}

        {/* Items summary */}
        {items.length > 0 && (
          <div className="surface-card p-4 sm:p-5 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Order items</h2>
            </div>
            <ul className="space-y-2.5">
              {items.map((item, i) => (
                <li
                  key={`${item.name}-${i}`}
                  className="flex items-start justify-between gap-3 text-sm border-b border-border/50 last:border-0 pb-2.5 last:pb-0"
                >
                  <span className="text-foreground font-medium leading-snug">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-muted-foreground font-normal"> ×{item.quantity}</span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Claude pre-order block */}
        {sessionOrder?.isPreOrder && sessionOrder.preOrder && (
          <div className="surface-card p-4 sm:p-5 mb-4 sm:mb-5 border-orange-500/25">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/60">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/15 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {sessionOrder.preOrder.service} pre-order
                </h3>
                <p className="text-xs text-orange-600 font-semibold">
                  {sessionOrder.preOrder.plan} ·{' '}
                  {sessionOrder.preOrder.isFullPayment || sessionOrder.preOrder.paymentMode === 'full'
                    ? 'Full payment'
                    : 'Reserve deposit'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-secondary/70 p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Full</p>
                <p className="text-xs sm:text-sm font-bold tabular-nums">
                  {sessionOrder.preOrder.fullPrice.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-center border border-orange-500/20">
                <p className="text-[10px] uppercase font-semibold text-orange-600">Paid</p>
                <p className="text-xs sm:text-sm font-bold tabular-nums">
                  {sessionOrder.preOrder.deposit.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/70 p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Due</p>
                <p className="text-xs sm:text-sm font-bold tabular-nums">
                  {(sessionOrder.preOrder.remaining ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5">
                  Claude email
                </p>
                <p className="font-mono text-xs sm:text-sm font-bold break-all">
                  {sessionOrder.preOrder.claudeEmail}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => copyToClipboard(sessionOrder.preOrder!.claudeEmail, 'Email')}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Instant delivery credentials */}
        {isAutomationLoading ? (
          <div className="surface-card p-6 mb-4 sm:mb-5 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Checking delivery…</span>
          </div>
        ) : showAutomation ? (
          <div className="surface-card p-4 sm:p-5 mb-4 sm:mb-5 border-primary/25">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/60">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
                {getServiceIcon(assignment.service_type || 'default')}
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {assignment.service_type || 'Account'} access
                </h3>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Instant delivery ready
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                  Username / email
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold break-all">{assignment.email}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(assignment.email, 'Email')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                  Password
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold">••••••••</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(assignment.password, 'Password')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            {assignment.rules_template && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Important rules
                </p>
                <div className="text-sm text-muted-foreground">
                  <FormattedDescription description={assignment.rules_template} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="surface-card p-4 sm:p-5 mb-4 sm:mb-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-0.5">
                {sessionOrder?.isPreOrder
                  ? 'Next: payment check → workspace invite'
                  : 'Delivery: usually 1–24 hours'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {sessionOrder?.isPreOrder
                  ? 'We verify payment, then invite your email to a private Claude Team workspace.'
                  : 'After we confirm payment, credentials go to WhatsApp (and email if provided).'}
              </p>
            </div>
          </div>
        )}

        {/* Secondary actions */}
        <div className="space-y-3 mb-5 sm:mb-6">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Button
              variant={isCompleted ? 'default' : 'outline'}
              size="lg"
              className="h-11 sm:h-12 rounded-2xl font-semibold text-foreground"
              asChild
            >
              <Link to={`/track-order?orderId=${orderId}`}>
                <Search className="w-4 h-4 mr-1.5 sm:mr-2" />
                Track
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 sm:h-12 rounded-2xl font-semibold text-foreground"
              asChild
            >
              <Link to="/products">
                <Sparkles className="w-4 h-4 mr-1.5 sm:mr-2" />
                Shop more
              </Link>
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="w-full text-foreground/70" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </div>

        {/* WhatsApp community group */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#25D366]/25 bg-gradient-to-br from-[#25D366]/12 via-card to-card p-5 sm:p-6 shadow-sm">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#25D366]/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-md shadow-[#25D366]/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg">
                  Join our WhatsApp group
                </h3>
                <p className="text-xs text-muted-foreground">Deals · updates · support</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Get flash sales, new product drops, and help from the Snippy Mart community.
            </p>
            <Button
              variant="whatsapp"
              size="lg"
              className="w-full sm:w-auto rounded-2xl font-bold px-6 h-11 shadow-md shadow-[#25D366]/25"
              asChild
            >
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
                Join group
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>

        {!isCompleted && (
          <p className="text-center text-xs text-muted-foreground mt-6 mb-2">
            Need help?{' '}
            <a
              href={`https://wa.me/${(settings?.whatsapp_number || '94787767869').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Message support
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;

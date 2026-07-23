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
  Clock3,
  Sparkles,
  Zap,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { useTrackOrder } from '@/hooks/useOrders';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { useOrderResellerDeliveries } from '@/hooks/useResellerApi';
import { FormattedDescription } from '@/components/products/FormattedDescription';
import { DeliveryPayloadCard } from '@/components/delivery/DeliveryPayloadCard';
import { buildClaudeOrderWhatsAppUrl } from '@/lib/claudePreorder';
import { getOrderStatusDisplay } from '@/lib/orderStatus';
import { cn } from '@/lib/utils';
import SEO from '@/components/seo/SEO';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/EB9hDAkQBmcHEjlTMLYXBh';
const TRUSTPILOT_URL = 'https://www.trustpilot.com/review/snippymart.com';

interface OrderData {
  orderId: string;
  whatsapp: string;
  name?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    productId?: string;
    isAuto?: boolean;
  }[];
  total: number;
  discount?: number;
  isPreOrder?: boolean;
  whatsappConfirmUrl?: string;
  hasAutoItems?: boolean;
  allAutoItems?: boolean;
  paymentMethod?: string;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] xs:text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground mb-1.5 sm:mb-2 px-0.5">
      {children}
    </p>
  );
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
  const { data: resellerDeliveries = [] } = useOrderResellerDeliveries(liveOrder?.id, {
    pollWhileWaiting: true,
  });

  const copyToClipboard = (text: string, label: string = 'ID') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: 'Copied to clipboard.',
    });
  };

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
  const isCompleted = liveOrder?.status === 'completed';
  const isPending = !liveOrder?.status || liveOrder?.status === 'pending';
  const showAutomation = assignment && (isCompleted || liveOrder?.status === 'processing');
  const hasAutoItems =
    !!sessionOrder?.hasAutoItems ||
    !!sessionOrder?.allAutoItems ||
    items.some((i) => i.isAuto) ||
    resellerDeliveries.length > 0;
  const allAutoItems =
    !!sessionOrder?.allAutoItems ||
    (items.length > 0 && items.every((i) => i.isAuto));
  const hasResellerCodes = resellerDeliveries.some((d) => d.delivered_data);
  const isPreOrder = !!sessionOrder?.isPreOrder;
  const isMixedCart = hasAutoItems && !allAutoItems;
  const productReady = hasResellerCodes || !!showAutomation;
  const waitingForAuto = hasAutoItems && !isPreOrder && !hasResellerCodes && !showAutomation;

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
    const message = hasAutoItems
      ? `Hello Snippy Mart! I paid for Auto order ${orderId}. Please confirm payment so I get my product on Track Order.`
      : `Hello Snippy Mart! I just placed order ${orderId}. Please confirm.`;
    return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const whatsAppHref = getWhatsAppLink();
  const showPrimaryWhatsApp = !isCompleted && !allAutoItems;

  const getServiceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('netflix')) return '🍿';
    if (t.includes('prime')) return '📦';
    if (t.includes('spotify')) return '🎵';
    if (t.includes('cursor')) return '🖱️';
    if (t.includes('adobe')) return '🎨';
    return '🔑';
  };

  const statusDisplay = getOrderStatusDisplay(liveOrder?.status || 'pending');
  const StatusIcon = statusDisplay.icon;

  const headerTitle = isPreOrder
    ? 'Pre-order locked in'
    : productReady
      ? "You're all set"
      : waitingForAuto
        ? 'Order received'
        : 'Order placed';

  const headerSub = isPreOrder
    ? `Thanks${sessionOrder?.name ? `, ${sessionOrder.name}` : ''}! Send details on WhatsApp so we can process your pre-order.`
    : productReady
      ? `Thanks${sessionOrder?.name ? `, ${sessionOrder.name}` : ''}! Your product is ready below. You can also open Track Order anytime with your Order ID.`
      : waitingForAuto
        ? `Thanks${sessionOrder?.name ? `, ${sessionOrder.name}` : ''}! Do these 3 simple steps to get your product.`
        : `Thanks${sessionOrder?.name ? `, ${sessionOrder.name}` : ''}! Save your Order ID. We deliver after payment is confirmed.`;

  return (
    <div
      className={cn(
        'min-h-dvh page-mesh overflow-x-hidden pt-[max(4.5rem,env(safe-area-inset-top,0px)+3.5rem)] sm:pt-28',
        waitingForAuto
          ? 'pb-[max(7.5rem,env(safe-area-inset-bottom,0px)+6.5rem)] sm:pb-20'
          : 'pb-[max(4rem,env(safe-area-inset-bottom,0px)+2.5rem)] sm:pb-20',
      )}
    >
      <SEO
        title="Order confirmed"
        description="Your Snippy Mart order was placed successfully. Save your Order ID and track delivery."
        noindex
        path="/order-success"
      />
      <div className="mx-auto w-full max-w-2xl px-3 xs:px-4 sm:px-5 space-y-4 sm:space-y-6">
        {/* ── 1. Header ── */}
        <header className="text-center px-0.5">
          <div className="relative inline-flex mb-2.5 sm:mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150" />
            <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
              <CheckCircle2 className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-[1.35rem] leading-tight xs:text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground mb-1.5">
            {headerTitle}
          </h1>
          <p className="text-[13px] xs:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {headerSub}
          </p>
        </header>

        {/* ── 2. Order ID (always first action) ── */}
        <section className="min-w-0">
          <SectionLabel>Your Order ID</SectionLabel>
          <div className="surface-card p-3.5 xs:p-4 sm:p-5 border-2 border-primary/25 shadow-md overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="font-mono text-base xs:text-lg sm:text-2xl font-black text-foreground break-all leading-snug">
                  {orderId}
                </p>
                <p className="text-[11px] xs:text-xs text-muted-foreground mt-1.5 leading-snug">
                  {waitingForAuto
                    ? 'Copy or screenshot this. You need it to collect your product on Track Order.'
                    : 'Keep this ID to track your order anytime.'}
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                className="rounded-xl shrink-0 min-h-12 h-12 px-5 font-bold w-full sm:w-auto touch-manipulation active:scale-[0.98]"
                onClick={() => copyToClipboard(orderId, 'Order ID')}
              >
                <Copy className="w-4 h-4 mr-2 shrink-0" />
                Copy Order ID
              </Button>
            </div>
          </div>
        </section>

        {/* ── 3. Status + total (compact facts) ── */}
        <section>
          <SectionLabel>Order snapshot</SectionLabel>
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3">
            <div className="surface-card p-3 xs:p-3.5 sm:p-4 min-w-0 overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Status
              </p>
              <div className="flex items-start gap-1.5 xs:gap-2 min-w-0">
                <StatusIcon
                  className={cn(
                    'w-4 h-4 shrink-0 mt-0.5',
                    isCompleted && 'text-emerald-600',
                    isPending && 'text-amber-600',
                    !isCompleted && !isPending && 'text-primary',
                  )}
                />
                <p
                  className={cn(
                    'text-[11px] xs:text-xs sm:text-sm font-bold leading-snug break-words',
                    isCompleted && 'text-emerald-600',
                    isPending && 'text-amber-600',
                    !isCompleted && !isPending && 'text-primary',
                  )}
                  title={statusDisplay.title}
                >
                  {statusDisplay.badge || statusDisplay.title}
                </p>
              </div>
            </div>
            <div className="surface-card p-3 xs:p-3.5 sm:p-4 min-w-0 overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Total
              </p>
              <p className="text-sm xs:text-base sm:text-lg font-black text-foreground tabular-nums break-all leading-snug">
                {formatPrice(total)}
              </p>
              {(liveOrder?.discount_amount > 0 || (sessionOrder?.discount || 0) > 0) && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Saved {formatPrice(liveOrder?.discount_amount || sessionOrder?.discount || 0)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. What to do next (main path) ── */}
        <section>
          <SectionLabel>What to do next</SectionLabel>

          {/* Auto waiting — 3 steps */}
          {waitingForAuto && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.09] to-card p-3.5 xs:p-4 sm:p-5 shadow-sm overflow-hidden">
              <div className="flex items-start gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] xs:text-base font-bold text-foreground leading-snug">
                    Get your Auto product
                  </h2>
                  <p className="text-[11px] xs:text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Delivered on <strong className="text-foreground">Track Order</strong> only — not
                    WhatsApp
                  </p>
                </div>
              </div>

              <div className="mt-3.5 sm:mt-4 space-y-0">
                {[
                  {
                    n: 1,
                    title: 'Save your Order ID',
                    body: 'Use the Copy button above, or take a screenshot of this page.',
                  },
                  {
                    n: 2,
                    title: 'Wait about 30 minutes',
                    body: 'We confirm payment, then the system delivers automatically. Busy times may take a little longer.',
                  },
                  {
                    n: 3,
                    title: 'Open Track Order and enter your ID',
                    body: 'Paste the Order ID, tap Track, and your code / link / login will show there.',
                  },
                ].map((step, idx) => (
                  <div key={step.n} className="flex gap-2.5 xs:gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-black">
                        {step.n}
                      </span>
                      {idx < 2 && (
                        <span className="w-0.5 flex-1 min-h-[12px] bg-emerald-500/30 my-1" />
                      )}
                    </div>
                    <div className={cn('pb-3.5 xs:pb-4 min-w-0', idx === 2 && 'pb-1')}>
                      <p className="text-[13px] xs:text-sm font-bold text-foreground pt-1 leading-snug">
                        {step.title}
                      </p>
                      <p className="text-[11px] xs:text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {step.body}
                      </p>
                      {step.n === 3 && (
                        <p className="mt-2 font-mono text-[11px] xs:text-xs font-bold text-foreground bg-background/90 border border-border rounded-lg px-2.5 py-2 break-all">
                          {orderId}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isMixedCart && (
                <div className="mt-2 mb-3.5 rounded-xl bg-background/80 border border-border p-3">
                  <p className="text-xs font-bold text-foreground mb-1">You also bought non-Auto items</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Auto items use Track Order (steps above). Other items may take 1–24 hours and may
                    use WhatsApp for support.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 mt-2">
                <Button
                  variant="default"
                  size="xl"
                  className="w-full min-h-12 h-auto py-3.5 rounded-2xl text-sm xs:text-[15px] font-bold shadow-lg shadow-primary/20 touch-manipulation active:scale-[0.99]"
                  asChild
                >
                  <Link to={`/track-order?orderId=${encodeURIComponent(orderId)}`}>
                    <Search className="w-5 h-5 mr-2 shrink-0" />
                    <span className="text-left leading-snug">Open Track Order</span>
                    <ArrowRight className="w-4 h-4 ml-2 shrink-0 opacity-80" />
                  </Link>
                </Button>
                <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-1">
                  If the product is not ready yet, come back in about 30 minutes with the same Order
                  ID.
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-11 h-11 rounded-2xl font-semibold touch-manipulation"
                  asChild
                  disabled={isSettingsLoading}
                >
                  <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                    Need help? WhatsApp us
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Auto / inventory already delivered */}
          {productReady && !isPreOrder && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Your product is ready</h2>
                  <p className="text-xs text-muted-foreground">
                    Scroll down for codes / logins, or open Track Order anytime.
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full h-12 rounded-2xl font-bold touch-manipulation"
                asChild
              >
                <Link to={`/track-order?orderId=${encodeURIComponent(orderId)}`}>
                  <Search className="w-4 h-4 mr-2" />
                  Open Track Order
                </Link>
              </Button>
            </div>
          )}

          {/* Manual / pre-order path */}
          {!waitingForAuto && !productReady && (
            <div className="surface-card p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {isPreOrder
                      ? 'Next: WhatsApp + payment check'
                      : 'Delivery usually takes 1–24 hours'}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {isPreOrder
                      ? 'Send your order on WhatsApp. We verify payment, then invite your email to the Claude workspace.'
                      : 'After we confirm payment, we deliver your order. Use Track Order with your Order ID anytime.'}
                  </p>
                </div>
              </div>
              {showPrimaryWhatsApp && (
                <Button
                  variant="whatsapp"
                  size="xl"
                  className="w-full min-h-[3.25rem] h-auto py-3.5 rounded-2xl text-[15px] font-bold shadow-lg shadow-[#25D366]/25 touch-manipulation text-white"
                  asChild
                  disabled={isSettingsLoading}
                >
                  <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                    {isSettingsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                    )}
                    {isPreOrder ? 'Send order on WhatsApp' : 'Confirm on WhatsApp'}
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-11 rounded-2xl font-semibold touch-manipulation"
                asChild
              >
                <Link to={`/track-order?orderId=${encodeURIComponent(orderId)}`}>
                  <Search className="w-4 h-4 mr-2" />
                  Track this order
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* ── 5. Your product (when ready) ── */}
        {(hasResellerCodes || showAutomation || isAutomationLoading) && (
          <section>
            <SectionLabel>Your product</SectionLabel>

            {hasResellerCodes && (
              <div className="space-y-3 mb-3">
                {resellerDeliveries.map((d) =>
                  d.delivered_data ? (
                    <DeliveryPayloadCard
                      key={d.id}
                      deliveredData={d.delivered_data}
                      productName={d.product_name}
                      vendorOrderId={d.vendor_order_id}
                    />
                  ) : null,
                )}
                <p className="text-[11px] text-muted-foreground px-0.5">
                  Reopen Track Order with{' '}
                  <span className="font-mono font-bold text-foreground">{orderId}</span> anytime to
                  see this again.
                </p>
              </div>
            )}

            {isAutomationLoading && !hasResellerCodes ? (
              <div className="surface-card p-6 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Checking delivery…</span>
              </div>
            ) : showAutomation ? (
              <div className="surface-card p-4 sm:p-5 border-primary/25">
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
                      Ready to use
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
            ) : null}
          </section>
        )}

        {/* ── 6. Pre-order details ── */}
        {isPreOrder && sessionOrder?.preOrder && (
          <section>
            <SectionLabel>Pre-order details</SectionLabel>
            <div className="surface-card p-4 sm:p-5 border-orange-500/25">
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
                    {sessionOrder.preOrder.isFullPayment ||
                    sessionOrder.preOrder.paymentMode === 'full'
                      ? 'Full payment'
                      : 'Reserve deposit'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 mb-3">
                <div className="rounded-xl bg-secondary/70 p-2 xs:p-2.5 text-center min-w-0">
                  <p className="text-[9px] xs:text-[10px] uppercase font-semibold text-muted-foreground">Full</p>
                  <p className="text-[11px] xs:text-xs sm:text-sm font-bold tabular-nums break-all leading-snug">
                    {sessionOrder.preOrder.fullPrice.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-orange-500/10 p-2 xs:p-2.5 text-center border border-orange-500/20 min-w-0">
                  <p className="text-[9px] xs:text-[10px] uppercase font-semibold text-orange-600">Paid</p>
                  <p className="text-[11px] xs:text-xs sm:text-sm font-bold tabular-nums break-all leading-snug">
                    {sessionOrder.preOrder.deposit.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/70 p-2 xs:p-2.5 text-center min-w-0">
                  <p className="text-[9px] xs:text-[10px] uppercase font-semibold text-muted-foreground">Due</p>
                  <p className="text-[11px] xs:text-xs sm:text-sm font-bold tabular-nums break-all leading-snug">
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
          </section>
        )}

        {/* ── 7. Order items (secondary) ── */}
        {items.length > 0 && (
          <section>
            <SectionLabel>Items in this order</SectionLabel>
            <div className="surface-card p-4 sm:p-5">
              <ul className="space-y-2.5">
                {items.map((item, i) => (
                  <li
                    key={`${item.name}-${i}`}
                    className="flex items-start justify-between gap-3 text-sm border-b border-border/50 last:border-0 pb-2.5 last:pb-0"
                  >
                    <span className="text-foreground font-medium leading-snug min-w-0">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {item.name}
                        {item.isAuto && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                            Auto
                          </span>
                        )}
                      </span>
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
          </section>
        )}

        {/* ── 8. More actions ── */}
        <section>
          <SectionLabel>More</SectionLabel>
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
            <Button
              variant="outline"
              size="lg"
              className="min-h-12 h-12 rounded-2xl font-semibold touch-manipulation text-sm"
              asChild
            >
              <Link to="/products">
                <Sparkles className="w-4 h-4 mr-1.5 xs:mr-2 shrink-0" />
                Shop more
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="min-h-12 h-12 rounded-2xl font-semibold text-foreground/80 touch-manipulation border border-border text-sm"
              asChild
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-1.5 xs:mr-2 shrink-0" />
                Home
              </Link>
            </Button>
          </div>
        </section>

        {/* ── 9. Community + review ── */}
        <section className="space-y-2.5 xs:space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-[#25D366]/25 bg-gradient-to-br from-[#25D366]/10 via-card to-card p-3.5 xs:p-4 sm:p-5">
            <div className="flex items-start gap-2.5 xs:gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-md shadow-[#25D366]/30 shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-[13px] xs:text-sm leading-snug">
                  Want more deals?
                </h3>
                <p className="text-[11px] xs:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Join our WhatsApp group for flash sales, new drops, and exclusive offers.
                </p>
              </div>
            </div>
            <Button
              variant="whatsapp"
              size="lg"
              className="w-full rounded-2xl font-bold min-h-11 h-11 touch-manipulation"
              asChild
            >
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
                Join for more deals
                <ExternalLink className="w-4 h-4 ml-2 shrink-0" />
              </a>
            </Button>
          </div>

          <div className="rounded-2xl border border-[#00B67A]/30 bg-gradient-to-br from-[#00B67A]/10 via-card to-card p-3.5 xs:p-4 sm:p-5">
            <div className="flex items-start gap-2.5 xs:gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00B67A] flex items-center justify-center shadow-md shadow-[#00B67A]/25 shrink-0">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-[13px] xs:text-sm leading-snug">
                  Happy with your order?
                </h3>
                <p className="text-[11px] xs:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Leave a short Trustpilot review — it helps other customers a lot.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full rounded-2xl font-bold min-h-11 h-11 touch-manipulation bg-[#00B67A] hover:bg-[#00a06c] text-white text-[13px] xs:text-sm"
              asChild
            >
              <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer">
                <Star className="w-4 h-4 mr-2 fill-white shrink-0" />
                <span className="truncate">Leave a review on Trustpilot</span>
                <ExternalLink className="w-4 h-4 ml-2 opacity-90 shrink-0" />
              </a>
            </Button>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-1 px-2">
          Need help?{' '}
          <a
            href={`https://wa.me/${(settings?.whatsapp_number || '94787767869').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline inline-block py-1"
          >
            Message support
          </a>
        </p>
      </div>

      {/* Mobile sticky for waiting Auto */}
      {waitingForAuto && (
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-border/80 bg-background/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <p className="text-[10px] text-center text-muted-foreground mb-1.5 font-medium leading-snug">
            1. Copy ID · 2. Wait ~30 min · 3. Track Order
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            <Button
              variant="outline"
              className="min-h-12 h-12 rounded-xl font-bold touch-manipulation active:scale-[0.98]"
              type="button"
              onClick={() => copyToClipboard(orderId, 'Order ID')}
            >
              <Copy className="w-4 h-4 mr-1.5 shrink-0" />
              Copy ID
            </Button>
            <Button
              variant="default"
              className="min-h-12 h-12 rounded-xl font-bold touch-manipulation active:scale-[0.98]"
              asChild
            >
              <Link to={`/track-order?orderId=${encodeURIComponent(orderId)}`}>
                <Search className="w-4 h-4 mr-1.5 shrink-0" />
                Track
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;

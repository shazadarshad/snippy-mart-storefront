import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  User,
  CreditCard,
  Copy,
  Check,
  Clock,
  FileText,
  Zap,
  Bookmark,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder } from '@/hooks/useOrders';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDateTime, cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { useOrderResellerDeliveries } from '@/hooks/useResellerApi';
import SEO from '@/components/seo/SEO';
import { FormattedDescription } from '@/components/products/FormattedDescription';
import { DeliveryPayloadCard } from '@/components/delivery/DeliveryPayloadCard';
import { useToast } from '@/hooks/use-toast';
import {
  TRACK_PIPELINE,
  getOrderStatusDisplay,
  isTrackStepCurrent,
  isTrackStepDone,
} from '@/lib/orderStatus';
import { isClaudePreOrder, parseClaudePreOrder, formatLkrAdmin } from '@/lib/claudePreorder';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground mb-2 px-0.5">
      {children}
    </p>
  );
}

const TrackOrderPage = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [searchId, setSearchId] = useState(searchParams.get('orderId') || '');
  const {
    data: order,
    isLoading,
    isFetched,
    refetch,
    isFetching,
  } = useTrackOrder(searchId);
  const { data: settings } = useSiteSettings();
  const automation = useOrderAutomation(order?.id);
  const waitingForAutoDelivery =
    !!order &&
    (order.status === 'pending' ||
      order.status === 'processing' ||
      order.status === 'shipping');
  const { data: resellerDeliveries = [], refetch: refetchResellerDeliveries } =
    useOrderResellerDeliveries(order?.id, {
      pollWhileWaiting: waitingForAutoDelivery,
    });

  useEffect(() => {
    const id = searchParams.get('orderId');
    const ref = searchParams.get('ref');
    if (id) {
      setOrderId(id);
      setSearchId(id);
    } else if (ref) {
      setOrderId(ref);
      setSearchId(ref);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) setSearchId(orderId.trim());
  };

  const getServiceIcon = (type?: string | null) => {
    if (!type) return '🔑';
    const t = type.toLowerCase();
    if (t.includes('netflix')) return '🍿';
    if (t.includes('prime')) return '📦';
    if (t.includes('spotify')) return '🎵';
    if (t.includes('youtube')) return '📺';
    if (t.includes('adobe') || t.includes('canva')) return '🎨';
    if (t.includes('cursor')) return '🖱️';
    if (t.includes('claude')) return '⚡';
    return '🔑';
  };

  const getWhatsAppLink = (withOrder?: string) => {
    const phone = settings?.whatsapp_number || '94787767869';
    const digits = phone.replace(/\D/g, '');
    if (withOrder) {
      const msg = encodeURIComponent(
        `Hi! I need help with my order.\nOrder ID: ${withOrder}`
      );
      return `https://wa.me/${digits}?text=${msg}`;
    }
    return `https://wa.me/${digits}`;
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied` });
  };

  const statusInfo = order ? getOrderStatusDisplay(order.status) : null;
  const StatusIcon = statusInfo?.icon || Clock;
  const claude = order && isClaudePreOrder(order as any) ? parseClaudePreOrder(order as any) : null;

  const hasAutoLine = (order?.order_items || []).some(
    (item: any) => item.products?.reseller_product_id,
  );
  const hasResellerReady = resellerDeliveries.some((d) => d.delivered_data);
  const hasInventoryReady =
    order?.status === 'completed' && !!automation?.assignment;

  const formatMoney = (amount: number) => {
    if (order?.currency_code && order?.currency_rate) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: order.currency_code,
        minimumFractionDigits:
          order.currency_code === 'LKR' || order.currency_code === 'INR' ? 0 : 2,
        maximumFractionDigits:
          order.currency_code === 'LKR' || order.currency_code === 'INR' ? 0 : 2,
      }).format(amount * (order.currency_rate || 1));
    }
    return formatPrice(amount);
  };

  const refreshAll = () => {
    void refetch();
    void refetchResellerDeliveries();
  };

  return (
    <div className="min-h-dvh page-mesh pt-20 sm:pt-24 pb-safe pb-16 sm:pb-20">
      <SEO
        title="Track Order"
        description="Track your Snippy Mart order and collect Auto product codes, links, or logins."
      />
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          {/* ── Header ── */}
          <header className="text-center">
            <h1 className="text-2xl sm:text-4xl font-display font-black text-foreground mb-2">
              Track your <span className="gradient-text">order</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Enter the Order ID from your success page to see status and collect your product.
            </p>
          </header>

          {/* ── Search (always first) ── */}
          <section>
            <SectionLabel>Enter Order ID</SectionLabel>
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 sm:group"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="e.g. SNIP-2026-829680"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="pl-11 h-14 text-base bg-card border-border rounded-2xl shadow-md focus:ring-primary/20 font-mono w-full"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="h-14 px-8 rounded-2xl text-sm shrink-0 w-full sm:w-auto font-bold"
                disabled={isLoading}
              >
                {isLoading ? 'Looking…' : 'Track'}
              </Button>
            </form>
          </section>

          {/* ── How it works (only before a result) ── */}
          {!order && !isLoading && (
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bookmark className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">How this works</h2>
              </div>
              <ol className="space-y-3">
                {[
                  {
                    n: 1,
                    t: 'Copy your Order ID',
                    d: 'From the order success page after checkout.',
                  },
                  {
                    n: 2,
                    t: 'Wait about 30 minutes',
                    d: 'We confirm payment, then Auto products deliver automatically.',
                  },
                  {
                    n: 3,
                    t: 'Paste the ID above and tap Track',
                    d: 'Your code, link, or login appears on this page when ready — not on WhatsApp.',
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black">
                      {s.n}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-foreground">{s.t}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading your order…</p>
            </div>
          )}

          {isFetched && !order && !isLoading && (
            <div className="p-6 sm:p-8 rounded-2xl bg-destructive/5 border border-destructive/15 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Order not found</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                No order matches{' '}
                <span className="font-mono font-bold text-foreground">{searchId}</span>. Check the ID
                and try again.
              </p>
              <Button variant="outline" asChild className="rounded-xl">
                <a href={getWhatsAppLink(searchId)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact support
                </a>
              </Button>
            </div>
          )}

          {order && statusInfo && (
            <div className="space-y-5 sm:space-y-6 animate-fade-in">
              {/* ── A. Order ID reminder ── */}
              <section>
                <SectionLabel>Your Order ID</SectionLabel>
                <div className="bg-card border-2 border-primary/25 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-lg sm:text-xl font-black text-foreground break-all">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save this to open Track Order again later.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="default"
                      className="rounded-xl h-11 font-bold flex-1 sm:flex-none"
                      onClick={() => copyText(order.order_number, 'Order ID')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl h-11 font-semibold"
                      onClick={refreshAll}
                      disabled={isFetching}
                    >
                      <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                      <span className="sr-only sm:not-sr-only sm:ml-2">
                        {isFetching ? '…' : 'Refresh'}
                      </span>
                    </Button>
                  </div>
                </div>
              </section>

              {/* ── B. Product first (what people came for) ── */}
              {(hasResellerReady || hasInventoryReady || hasAutoLine) && (
                <section>
                  <SectionLabel>
                    {hasResellerReady || hasInventoryReady ? 'Your product' : 'Product delivery'}
                  </SectionLabel>

                  {/* Ready: reseller */}
                  {hasResellerReady && (
                    <div className="space-y-3 mb-3">
                      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm font-bold text-foreground">Auto delivery ready</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Copy the details below. This page is where Auto products are delivered.
                        </p>
                        <div className="space-y-3">
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
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ready: inventory assignment */}
                  {hasInventoryReady && automation.assignment && (
                    <div className="bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm mb-3">
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                          {getServiceIcon(automation.assignment.service_type)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">
                            {automation.assignment.service_type || 'Account'} access
                          </h3>
                          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Ready
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                            Email / Username
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-bold text-sm break-all">
                              {automation.assignment.email}
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyText(automation.assignment.email, 'Email')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                            Password
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-bold text-sm">••••••••</p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyText(automation.assignment.password, 'Password')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {automation.assignment.rules_template && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-sm text-muted-foreground">
                          <FormattedDescription description={automation.assignment.rules_template} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Waiting for Auto */}
                  {!hasResellerReady && hasAutoLine && (
                    <div
                      className={cn(
                        'rounded-2xl border p-4 sm:p-5 shadow-sm',
                        order.status === 'completed' || order.status === 'cancelled'
                          ? 'border-amber-500/30 bg-amber-500/[0.05]'
                          : 'border-emerald-500/25 bg-emerald-500/[0.05]',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            order.status === 'completed' || order.status === 'cancelled'
                              ? 'bg-amber-500/15'
                              : 'bg-emerald-500/15',
                          )}
                        >
                          <Zap
                            className={cn(
                              'w-5 h-5',
                              order.status === 'completed' || order.status === 'cancelled'
                                ? 'text-amber-600'
                                : 'text-emerald-600',
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-foreground mb-1">
                            {order.status === 'pending'
                              ? 'Waiting for payment confirmation'
                              : order.status === 'processing' || order.status === 'shipping'
                                ? 'Delivery in progress'
                                : order.status === 'completed'
                                  ? 'Delivery missing — contact support'
                                  : 'Auto delivery not available'}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {order.status === 'pending'
                              ? 'After we confirm payment, your code / link / login usually appears here within about 30 minutes. Keep this Order ID and check again.'
                              : order.status === 'processing' || order.status === 'shipping'
                                ? 'Payment confirmed. Auto delivery is running. This page updates live — most products appear within about 30 minutes. Tap Refresh if needed.'
                                : order.status === 'completed'
                                  ? 'This order is complete, but no Auto product is on file yet. Message support with your Order ID.'
                                  : 'No Auto delivery for this status. Contact support with your Order ID if you need help.'}
                          </p>
                          {(order.status === 'pending' ||
                            order.status === 'processing' ||
                            order.status === 'shipping') && (
                            <ol className="text-xs text-muted-foreground space-y-1.5 mb-3 pl-0">
                              <li className="flex gap-2">
                                <span className="font-black text-emerald-600">1.</span>
                                Keep Order ID{' '}
                                <span className="font-mono font-bold text-foreground">
                                  {order.order_number}
                                </span>
                              </li>
                              <li className="flex gap-2">
                                <span className="font-black text-emerald-600">2.</span>
                                Allow about 30 minutes after payment
                              </li>
                              <li className="flex gap-2">
                                <span className="font-black text-emerald-600">3.</span>
                                Stay here or come back and track the same ID
                              </li>
                            </ol>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {(order.status === 'pending' ||
                              order.status === 'processing' ||
                              order.status === 'shipping') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={refreshAll}
                                disabled={isFetching}
                              >
                                <RefreshCw
                                  className={cn('w-3.5 h-3.5 mr-1.5', isFetching && 'animate-spin')}
                                />
                                Refresh
                              </Button>
                            )}
                            {(order.status === 'completed' ||
                              order.status === 'cancelled' ||
                              order.status === 'on_hold') && (
                              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                                <a
                                  href={getWhatsAppLink(order.order_number)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Contact support
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ── C. Status ── */}
              <section>
                <SectionLabel>Order status</SectionLabel>
                <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0',
                        statusInfo.color,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          'w-6 h-6',
                          order.status === 'shipping' && 'animate-spin',
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-display font-black text-foreground">
                        {statusInfo.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {statusInfo.description}
                      </p>
                      {claude && (
                        <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-orange-500/10 text-orange-500 border-orange-500/30">
                          Claude · {claude.plan}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Simple pipeline only — no duplicate legend grid */}
                  {statusInfo.step > 0 && !statusInfo.isNegative && (
                    <div className="relative pt-4 mt-2 border-t border-border/60">
                      <div className="absolute top-[2.15rem] left-[12%] right-[12%] h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                          style={{
                            width:
                              order.status === 'on_hold'
                                ? '25%'
                                : `${Math.max(0, ((statusInfo.step - 1) / 3) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="relative flex justify-between">
                        {TRACK_PIPELINE.map((p) => {
                          const done = isTrackStepDone(order.status, p.step);
                          const current = isTrackStepCurrent(order.status, p.step);
                          const Icon = p.icon;
                          return (
                            <div
                              key={p.id}
                              className="flex flex-col items-center gap-2 relative z-10 w-[22%]"
                            >
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-full border-[3px] flex items-center justify-center bg-card',
                                  current &&
                                    'border-primary text-primary scale-105 shadow-md shadow-primary/15',
                                  done && !current && 'border-primary text-primary',
                                  !done && !current && 'border-border text-muted-foreground',
                                )}
                              >
                                {done && !current ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Icon className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <p
                                className={cn(
                                  'text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center leading-tight',
                                  current || done
                                    ? 'text-foreground'
                                    : 'text-muted-foreground opacity-60',
                                )}
                              >
                                {p.shortLabel}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                        <li>
                          <strong className="text-foreground">1 Pending</strong> — verifying payment
                        </li>
                        <li>
                          <strong className="text-foreground">2 Confirmed</strong> — payment OK
                        </li>
                        <li>
                          <strong className="text-foreground">3 Processing</strong> — fulfilling
                        </li>
                        <li>
                          <strong className="text-foreground">4 Completed</strong> — done
                        </li>
                      </ul>
                    </div>
                  )}

                  {order.status === 'on_hold' && (
                    <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-muted-foreground">
                      Your order is on hold. Message us with Order ID{' '}
                      <span className="font-mono font-bold text-foreground">
                        {order.order_number}
                      </span>
                      .
                    </div>
                  )}
                </div>
              </section>

              {/* ── D. Claude extras ── */}
              {claude && (
                <section>
                  <SectionLabel>Claude pre-order</SectionLabel>
                  <div className="bg-card border border-orange-500/25 p-4 sm:p-5 rounded-2xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Plan</p>
                        <p className="text-sm font-bold">{claude.plan}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">
                          {claude.isFullPayment ? 'Paid' : 'Deposit'}
                        </p>
                        <p className="text-sm font-bold">{formatLkrAdmin(claude.deposit)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">
                          Balance
                        </p>
                        <p className="text-sm font-bold">{formatLkrAdmin(claude.remaining)}</p>
                      </div>
                    </div>
                    {claude.claudeEmail && (
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                        <p className="text-[9px] uppercase font-bold text-orange-500 mb-1">
                          Claude account email
                        </p>
                        <p className="font-mono text-sm font-bold break-all">{claude.claudeEmail}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── E. Items + details ── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <section className="lg:col-span-3">
                  <SectionLabel>Items</SectionLabel>
                  <div className="bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm">
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-secondary/30 border border-border flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                                {item.product_name}
                                {item.products?.reseller_product_id && (
                                  <span className="inline-flex px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase">
                                    Auto
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {item.plan_name || 'Standard'} · Qty ×{item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-black shrink-0">
                            {formatMoney(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Total
                      </span>
                      <span className="text-xl font-display font-black gradient-text">
                        {formatMoney(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="lg:col-span-2 space-y-3">
                  <SectionLabel>Details</SectionLabel>
                  <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                        Customer
                      </p>
                      <p className="text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        {order.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                        Payment
                      </p>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-secondary border border-border text-[10px] font-black uppercase">
                        <CreditCard className="w-3 h-3 text-primary" />
                        {order.payment_method?.replace(/_/g, ' ') || 'Not specified'}
                      </div>
                      {order.payment_proof_url && (
                        <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Receipt on file
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                        Placed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="whatsapp"
                        className="w-full h-11 rounded-xl font-bold"
                        asChild
                      >
                        <a
                          href={getWhatsAppLink(order.order_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp support
                        </a>
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-xl text-muted-foreground border border-border"
                    asChild
                  >
                    <Link to="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to home
                    </Link>
                  </Button>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;

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
  ShieldCheck,
  Copy,
  Check,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder } from '@/hooks/useOrders';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDateTime, cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/seo/SEO';
import { FormattedDescription } from '@/components/products/FormattedDescription';
import { useToast } from '@/hooks/use-toast';
import {
  TRACK_PIPELINE,
  getOrderStatusDisplay,
  isTrackStepCurrent,
  isTrackStepDone,
} from '@/lib/orderStatus';
import { isClaudePreOrder, parseClaudePreOrder, formatLkrAdmin } from '@/lib/claudePreorder';

const TrackOrderPage = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [searchId, setSearchId] = useState(searchParams.get('orderId') || '');
  const { data: order, isLoading, isFetched, refetch, isFetching } = useTrackOrder(searchId);
  const { data: settings } = useSiteSettings();
  const automation = useOrderAutomation(order?.id);

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
  const progressPct =
    statusInfo && statusInfo.step > 0 ? Math.min(100, (statusInfo.step / 4) * 100) : 0;

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

  return (
    <div className="min-h-screen pt-24 pb-20">
      <SEO
        title="Track Order"
        description="Track your Snippy Mart order — payment confirmation, processing, and completion in real time."
      />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
              Track Your <span className="gradient-text">Order</span>
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-md mx-auto">
              Enter your Order ID to see payment confirmation, processing, and completion status.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative mb-8 md:mb-12 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Order ID (e.g., SNIP-2026-000001)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="pl-11 md:pl-12 h-14 md:h-16 text-base md:text-lg bg-card border-border rounded-2xl shadow-xl focus:ring-primary/20 transition-all font-mono"
            />
            <Button
              type="submit"
              variant="hero"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 md:px-8 rounded-xl text-sm md:text-base"
              disabled={isLoading}
            >
              {isLoading ? '...' : 'Track'}
            </Button>
          </form>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Retrieving your order details...</p>
            </div>
          )}

          {isFetched && !order && !isLoading && (
            <div className="p-8 rounded-3xl bg-destructive/5 border border-destructive/10 text-center animate-fade-in">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6">
                We couldn&apos;t find an order with ID{' '}
                <span className="font-mono font-bold text-foreground">{searchId}</span>. Check the ID
                or contact support.
              </p>
              <Button variant="outline" asChild>
                <a href={getWhatsAppLink(searchId)} target="_blank" rel="noopener noreferrer">
                  Contact Support
                </a>
              </Button>
            </div>
          )}

          {order && statusInfo && (
            <div className="space-y-6 md:space-y-8 animate-fade-in">
              {/* Status hero */}
              <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 relative z-10">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 shadow-lg',
                        statusInfo.color
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          'w-6 h-6 md:w-7 md:h-7',
                          order.status === 'shipping' && 'animate-spin'
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Current status
                      </p>
                      <h2 className="text-xl md:text-2xl font-display font-black text-foreground">
                        {statusInfo.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border',
                            statusInfo.color
                          )}
                        >
                          {statusInfo.badge}
                        </span>
                        {claude && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-orange-500/10 text-orange-400 border-orange-500/30">
                            Claude · {claude.plan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-9"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    {isFetching ? 'Updating…' : 'Refresh'}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-8 relative z-10 max-w-xl">
                  {statusInfo.description}
                </p>

                {/* Pipeline — hide for cancelled/refunded */}
                {statusInfo.step > 0 && !statusInfo.isNegative && (
                  <div className="relative pt-2 pb-2 px-0 md:px-1">
                    <div className="absolute top-[1.15rem] md:top-[1.35rem] left-[8%] right-[8%] h-1.5 bg-secondary rounded-full overflow-hidden">
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
                            className="flex flex-col items-center gap-2 md:gap-3 relative z-10 w-[22%]"
                          >
                            <div
                              className={cn(
                                'w-9 h-9 md:w-11 md:h-11 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 bg-card',
                                current &&
                                  'border-primary text-primary scale-110 shadow-lg shadow-primary/20 ring-4 ring-primary/10',
                                done && !current && 'border-primary text-primary',
                                !done && !current && 'border-border text-muted-foreground'
                              )}
                            >
                              {done && !current ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Icon
                                  className={cn(
                                    'w-3.5 h-3.5 md:w-4 md:h-4',
                                    current && p.id === 'processing' && 'animate-pulse'
                                  )}
                                />
                              )}
                            </div>
                            <div className="text-center px-0.5">
                              <p
                                className={cn(
                                  'text-[9px] md:text-[10px] font-black uppercase tracking-wide leading-tight',
                                  current || done ? 'text-foreground' : 'text-muted-foreground opacity-60'
                                )}
                              >
                                {p.shortLabel}
                              </p>
                              <p className="hidden sm:block text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                {p.fullLabel}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step legend */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TRACK_PIPELINE.map((p) => {
                        const done = isTrackStepDone(order.status, p.step);
                        const current = isTrackStepCurrent(order.status, p.step);
                        return (
                          <div
                            key={`leg-${p.id}`}
                            className={cn(
                              'flex items-start gap-2 p-2.5 rounded-xl border text-left',
                              current
                                ? 'border-primary/30 bg-primary/5'
                                : done
                                  ? 'border-border bg-secondary/30'
                                  : 'border-transparent opacity-50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black',
                                done || current
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground'
                              )}
                            >
                              {done && !current ? '✓' : p.step}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{p.fullLabel}</p>
                              <p className="text-[11px] text-muted-foreground">{p.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {order.status === 'on_hold' && (
                  <div className="mt-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-sm text-muted-foreground">
                    Your order is on hold. Message us with Order ID{' '}
                    <span className="font-mono font-bold text-foreground">{order.order_number}</span>.
                  </div>
                )}
              </div>

              {/* Claude extras */}
              {claude && (
                <div className="bg-card border border-orange-500/25 p-5 md:p-6 rounded-[2rem] space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Claude order details
                  </p>
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
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Balance</p>
                      <p className="text-sm font-bold">{formatLkrAdmin(claude.remaining)}</p>
                    </div>
                  </div>
                  {claude.claudeEmail && (
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                      <p className="text-[9px] uppercase font-bold text-orange-400 mb-1">
                        Claude account email
                      </p>
                      <p className="font-mono text-sm font-bold break-all">{claude.claudeEmail}</p>
                    </div>
                  )}
                  {claude.stage && (
                    <p className="text-xs text-muted-foreground">
                      Internal workflow:{' '}
                      <span className="font-semibold text-foreground capitalize">
                        {claude.stage.replace(/_/g, ' ')}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Auto delivery credentials */}
                  {(order.status === 'completed') && automation?.assignment && (
                    <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-xl">
                      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                          {getServiceIcon(automation.assignment.service_type)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest">
                            {automation.assignment.service_type || 'Account'} access
                          </h3>
                          <p className="text-xs text-success font-bold">Ready</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                          <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">
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
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                          <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">
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
                        <div className="mt-4 p-4 rounded-2xl bg-secondary/20 border border-border text-sm text-muted-foreground">
                          <FormattedDescription description={automation.assignment.rules_template} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/50">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Order items</h3>
                    </div>
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm truncate">
                                {item.product_name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {item.plan_name || 'Standard'} · Qty x{item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-black shrink-0">{formatMoney(item.total_price)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                        Total paid
                      </span>
                      <span className="text-2xl font-display font-black gradient-text">
                        {formatMoney(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <div className="bg-card border border-border p-5 md:p-6 rounded-[1.5rem] shadow-xl space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Order ID
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-black break-all">{order.order_number}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyText(order.order_number, 'Order ID')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Customer
                      </p>
                      <p className="text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {order.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Payment method
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-[10px] font-black uppercase">
                        <CreditCard className="w-3 h-3 text-primary" />
                        {order.payment_method?.replace(/_/g, ' ') || 'Not specified'}
                      </div>
                    </div>
                    {order.payment_proof_url && (
                      <div className="flex items-center gap-2 text-xs text-success font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        Payment receipt on file
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Placed
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    {order.updated_at && order.updated_at !== order.created_at && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Last update
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatDateTime(order.updated_at)}
                        </p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-border">
                      <Button variant="whatsapp" className="w-full h-12 rounded-xl font-bold" asChild>
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

                  {/* Status legend for customers */}
                  <div className="bg-secondary/30 border border-border p-4 rounded-2xl text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status guide
                    </p>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 leading-snug">
                      <li>
                        <strong className="text-foreground">Pending payment</strong> — we received
                        the order, verifying payment
                      </li>
                      <li>
                        <strong className="text-foreground">Payment confirmed</strong> — paid & order
                        confirmed
                      </li>
                      <li>
                        <strong className="text-foreground">Order processing</strong> — activating /
                        fulfilling
                      </li>
                      <li>
                        <strong className="text-foreground">Completed</strong> — done / access ready
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-12 rounded-2xl text-muted-foreground"
                    asChild
                  >
                    <Link to="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Loader2,
  ExternalLink,
  Copy,
  MessageCircle,
  Save,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrders, useUpdateExistingOrder, type Order } from '@/hooks/useOrders';
import { formatCatalogLkr } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  cardInboxLabel,
  cardInboxRank,
  cardInboxState,
  cardPaymentPageUrl,
  isValidHttpUrl,
  type CardInboxState,
} from '@/lib/cardPayment';
import { getOrderWhatsAppLink } from '@/lib/adminOrderWhatsApp';
import { adminStatusLabel } from '@/lib/orderStatus';
import { formatDateTime, cn } from '@/lib/utils';
import { copyToClipboard as safeCopy } from '@/lib/clipboard';

const stateTone: Record<CardInboxState, string> = {
  needs_link: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
  waiting_pay: 'bg-muted text-muted-foreground border-border',
  marked_paid: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/35',
  done: 'bg-secondary text-muted-foreground border-border',
};

const AdminCardPayments = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefill = searchParams.get('order') || '';
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState<Order | null>(null);
  const [processorUrl, setProcessorUrl] = useState('');
  const [mobileList, setMobileList] = useState(!prefill);
  const { data: orders = [], isLoading, refetch, isFetching } = useOrders();
  const { data: settings } = useSiteSettings();
  const saveOrder = useUpdateExistingOrder();

  const cardOrders = useMemo(() => {
    return orders
      .filter((o) => o.payment_method === 'card')
      .slice()
      .sort((a, b) => {
        const r = cardInboxRank(a) - cardInboxRank(b);
        if (r !== 0) return r;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cardOrders;
    return cardOrders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_whatsapp.includes(query.trim()),
    );
  }, [cardOrders, query]);

  const actionCount = cardOrders.filter((o) => {
    const s = cardInboxState(o);
    return s === 'needs_link' || s === 'marked_paid';
  }).length;

  useEffect(() => {
    if (!prefill || !orders.length) return;
    const match = orders.find(
      (o) => o.order_number.toLowerCase() === prefill.toLowerCase() || o.id === prefill,
    );
    if (match) applyOrder(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, orders.length]);

  const applyOrder = (order: Order, closeList = true) => {
    setLoaded(order);
    setProcessorUrl(order.card_checkout_url || settings?.card_payment_link || '');
    setSearchParams({ order: order.order_number }, { replace: true });
    if (closeList) setMobileList(false);
  };

  const smUrl = loaded ? cardPaymentPageUrl(loaded.order_number) : '';
  const loadedState = loaded ? cardInboxState(loaded) : null;

  const persistLink = async () => {
    if (!loaded) return null;
    const url = processorUrl.trim();
    if (!isValidHttpUrl(url)) {
      toast({
        title: 'Paste a payment URL',
        description: 'Full https:// PayHere / Stripe / Genie link.',
        variant: 'destructive',
      });
      return null;
    }
    await saveOrder.mutateAsync({
      orderId: loaded.order_number,
      updates: {
        card_checkout_url: url,
        card_link_created_at: new Date().toISOString(),
        payment_method: loaded.payment_method || 'card',
      } as Partial<Order>,
    });
    const next = {
      ...loaded,
      card_checkout_url: url,
      card_link_created_at: new Date().toISOString(),
    };
    setLoaded(next);
    refetch();
    return next;
  };

  const openWhatsApp = (order: Order) => {
    const link = getOrderWhatsAppLink(order, 'card_link', [], {
      cardPaymentLink: cardPaymentPageUrl(order.order_number),
      amountLabel: formatCatalogLkr(Number(order.total_amount)),
    });
    if (!link.url) {
      toast({
        title: 'Invalid customer WhatsApp',
        description: link.display || 'Fix the number on the order.',
        variant: 'destructive',
      });
      return false;
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
    return true;
  };

  const handleSaveAndSend = async () => {
    try {
      const saved = await persistLink();
      if (!saved) return;
      if (openWhatsApp(saved)) {
        toast({ title: 'Saved & WhatsApp opened', description: 'Send the prefilled message.' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveOnly = async () => {
    try {
      const saved = await persistLink();
      if (!saved) return;
      toast({ title: 'Link saved', description: cardPaymentPageUrl(saved.order_number) });
    } catch (e: unknown) {
      toast({
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const copy = async (text: string, label: string) => {
    const ok = await safeCopy(text);
    toast({ title: ok ? 'Copied' : 'Copy failed', description: label });
  };

  const inboxList = (
    <div className="admin-card overflow-hidden flex flex-col min-h-0 lg:max-h-[calc(100dvh-8.5rem)]">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">Inbox</p>
            <p className="text-[11px] text-muted-foreground">
              {actionCount > 0 ? `${actionCount} need you` : 'All caught up'}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="h-9 w-9"
            disabled={isFetching}
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, name, number"
            className="pl-9 h-10 text-base"
          />
        </div>
      </div>
      <div className="divide-y divide-border overflow-y-auto overscroll-contain flex-1">
        {isLoading && (
          <p className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No card orders.</p>
        )}
        {filtered.slice(0, 60).map((o) => {
          const state = cardInboxState(o);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => applyOrder(o)}
              className={cn(
                'w-full text-left px-4 py-3.5 min-h-[4.5rem] hover:bg-secondary/40 touch-manipulation',
                loaded?.id === o.id && 'bg-purple-500/10',
              )}
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {o.customer_name} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-black tabular-nums">{formatCatalogLkr(o.total_amount)}</p>
                  <span
                    className={cn(
                      'inline-flex text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md border',
                      stateTone[state],
                    )}
                  >
                    {cardInboxLabel(state)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const workspace = loaded ? (
    <div className="admin-card p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-muted-foreground mb-2 min-h-10 -ml-1 px-1"
            onClick={() => setMobileList(true)}
          >
            <ArrowLeft className="w-4 h-4" /> Inbox
          </button>
          <p className="font-mono font-black text-lg sm:text-xl">{loaded.order_number}</p>
          <p className="text-sm font-semibold truncate">{loaded.customer_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{loaded.customer_whatsapp}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black tabular-nums">{formatCatalogLkr(loaded.total_amount)}</p>
          {loadedState && (
            <span
              className={cn(
                'inline-flex mt-1 text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md border',
                stateTone[loadedState],
              )}
            >
              {cardInboxLabel(loadedState)}
            </span>
          )}
        </div>
      </div>

      {loadedState === 'marked_paid' && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Customer tapped I’ve paid
            {loaded.card_marked_paid_at ? ` · ${formatDateTime(loaded.card_marked_paid_at)}` : ''}.
            Check PayHere / Genie, then mark the order processing.
          </p>
        </div>
      )}
      {loadedState === 'needs_link' && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <Link2 className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">Paste the processor link and tap Save & send.</p>
        </div>
      )}
      {loadedState === 'waiting_pay' && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">Link sent. Waiting for the customer to pay.</p>
        </div>
      )}

      <ul className="text-sm space-y-1.5">
        {(loaded.order_items || []).map((i) => (
          <li key={i.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {i.product_name}
              {(i.plan_name || i.variant_name)
                ? ` (${[i.plan_name, i.variant_name].filter(Boolean).join(' · ')})`
                : ''}
              <span className="text-muted-foreground"> ×{i.quantity}</span>
            </span>
          </li>
        ))}
      </ul>

      <div>
        <Label htmlFor="processor">Processor link (PayHere / Stripe / Genie)</Label>
        <Input
          id="processor"
          value={processorUrl}
          onChange={(e) => setProcessorUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1.5 h-12 font-mono text-base"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1">
        <p className="text-[10px] font-black uppercase text-purple-600">Customer opens</p>
        <p className="text-sm font-mono break-all">{smUrl}</p>
      </div>

      <Button
        type="button"
        className="w-full min-h-12 h-12 font-bold bg-[#25D366] hover:bg-[#128C7E] text-white text-base"
        onClick={() => void handleSaveAndSend()}
        disabled={saveOrder.isPending}
      >
        {saveOrder.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <MessageCircle className="w-4 h-4 mr-2" />
        )}
        Save & send on WhatsApp
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-11"
          onClick={() => void handleSaveOnly()}
          disabled={saveOrder.isPending}
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-11"
          onClick={() => copy(smUrl, 'Snippy payment page')}
        >
          <Copy className="w-4 h-4 mr-1.5" />
          Copy
        </Button>
        <Button type="button" variant="outline" className="min-h-11 h-11" asChild>
          <a href={smUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Preview
          </a>
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Status: {adminStatusLabel(loaded.status)}
        {loaded.payment_proof_url ? ' · screenshot on file' : ''}
      </p>
    </div>
  ) : (
    <div className="hidden lg:flex admin-card min-h-[20rem] items-center justify-center p-8 text-center">
      <div>
        <CreditCard className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="font-bold">Pick an order</p>
        <p className="text-sm text-muted-foreground mt-1">Pending cards are at the top of the inbox.</p>
      </div>
    </div>
  );

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Card payments</h1>
          <p className="admin-page-subtitle">
            Paste the processor link, send once. Customer pays on snippymart.com/payment/…
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:gap-4 lg:items-start">
        <div className={cn(mobileList ? 'block' : 'hidden', 'lg:block')}>{inboxList}</div>
        <div className={cn(!mobileList ? 'block' : 'hidden', 'lg:block')}>{workspace}</div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Default processor URL:{' '}
        <Link to="/admin/settings" className="text-primary font-semibold">
          Settings → Payments
        </Link>
      </p>
    </div>
  );
};

export default AdminCardPayments;

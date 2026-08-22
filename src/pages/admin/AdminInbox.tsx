import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Search,
  Loader2,
  ExternalLink,
  Copy,
  MessageCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Link2,
  Zap,
  Wallet,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrders, useUpdateExistingOrder, useUpdateOrderStatus, type Order } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import {
  useDeliverOrderViaReseller,
  useOrderResellerDeliveryLog,
  summarizeDeliverResult,
} from '@/hooks/useResellerApi';
import { getOrderWhatsAppLink, orderHasAutoItems } from '@/lib/adminOrderWhatsApp';
import { openOrderWhatsApp } from '@/components/admin/AdminWhatsAppActions';
import { formatCatalogLkr } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  adminInboxRank,
  cardInboxLabel,
  cardInboxState,
  cardPaymentPageUrl,
  isValidHttpUrl,
} from '@/lib/cardPayment';
import { paymentMethodShort } from '@/lib/paymentMethod';
import { adminStatusLabel } from '@/lib/orderStatus';
import { formatDateTime, cn } from '@/lib/utils';
import { copyToClipboard as safeCopy } from '@/lib/clipboard';

const AdminInbox = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefill = searchParams.get('order') || '';
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState<Order | null>(null);
  const [processorUrl, setProcessorUrl] = useState('');
  const [mobileList, setMobileList] = useState(!prefill);
  const [proofHref, setProofHref] = useState<string | null>(null);
  const { data: orders = [], isLoading, refetch, isFetching } = useOrders();
  const { data: settings } = useSiteSettings();
  const saveOrder = useUpdateExistingOrder();
  const updateStatus = useUpdateOrderStatus();
  const deliverReseller = useDeliverOrderViaReseller();
  const { data: deliveryLog = [], refetch: refetchDeliveryLog } = useOrderResellerDeliveryLog(
    loaded?.id,
  );

  const isAuto = loaded ? orderHasAutoItems(loaded) : false;
  const isCard = loaded?.payment_method === 'card';
  const cardState = loaded && isCard ? cardInboxState(loaded) : null;
  const busy = updateStatus.isPending || deliverReseller.isPending || saveOrder.isPending;

  const inboxOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === 'pending')
      .slice()
      .sort((a, b) => {
        const r = adminInboxRank(a) - adminInboxRank(b);
        if (r !== 0) return r;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inboxOrders;
    return inboxOrders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_whatsapp.includes(query.trim()),
    );
  }, [inboxOrders, query]);

  useEffect(() => {
    if (!loaded?.id) return;
    const fresh = orders.find((o) => o.id === loaded.id);
    if (!fresh) {
      setLoaded(null);
      return;
    }
    if (
      fresh.status !== loaded.status ||
      fresh.card_marked_paid_at !== loaded.card_marked_paid_at ||
      fresh.card_checkout_url !== loaded.card_checkout_url ||
      fresh.payment_proof_url !== loaded.payment_proof_url
    ) {
      setLoaded(fresh);
    }
  }, [orders, loaded]);

  useEffect(() => {
    if (!prefill || !orders.length) return;
    const match = orders.find(
      (o) => o.order_number.toLowerCase() === prefill.toLowerCase() || o.id === prefill,
    );
    if (match) applyOrder(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, orders.length]);

  useEffect(() => {
    const proof = loaded?.payment_proof_url;
    if (!proof) {
      setProofHref(null);
      return;
    }
    if (/^https?:\/\//i.test(proof)) {
      setProofHref(proof);
      return;
    }
    let cancelled = false;
    void supabase.storage
      .from('payment-proofs')
      .createSignedUrl(proof, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setProofHref(data?.signedUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setProofHref(null);
      });
    return () => {
      cancelled = true;
    };
  }, [loaded?.id, loaded?.payment_proof_url]);

  const applyOrder = (order: Order) => {
    setLoaded(order);
    setProcessorUrl(order.card_checkout_url || settings?.card_payment_link || '');
    setSearchParams({ order: order.order_number }, { replace: true });
    setMobileList(false);
  };

  const smUrl = loaded ? cardPaymentPageUrl(loaded.order_number) : '';

  const persistCardLink = async () => {
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

  const handleSaveAndSend = async () => {
    try {
      const saved = await persistCardLink();
      if (!saved) return;
      const link = getOrderWhatsAppLink(saved, 'card_link', [], {
        cardPaymentLink: cardPaymentPageUrl(saved.order_number),
        amountLabel: formatCatalogLkr(Number(saved.total_amount)),
      });
      if (!link.url) {
        toast({
          title: 'Invalid customer WhatsApp',
          description: link.display,
          variant: 'destructive',
        });
        return;
      }
      window.open(link.url, '_blank', 'noopener,noreferrer');
      toast({ title: 'Saved & WhatsApp opened', description: 'Send the prefilled pay-link message.' });
    } catch (e: unknown) {
      toast({
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmAuto = async () => {
    if (!loaded) return;
    try {
      const result = await updateStatus.mutateAsync({
        orderId: loaded.id,
        status: 'processing',
      });
      const finalStatus = (result.order?.status || 'processing') as Order['status'];

      let delivered = result.delivery?.delivered ?? 0;
      let failed = result.delivery?.failed ?? 0;
      let summary = result.delivery ? summarizeDeliverResult(result.delivery as never) : '';

      if (orderHasAutoItems(loaded) && delivered === 0) {
        const res = await deliverReseller.mutateAsync({
          orderId: loaded.id,
          bypassEnabled: true,
        });
        delivered = res.delivered ?? delivered;
        failed = res.failed ?? failed;
        summary = summarizeDeliverResult(res);
      }

      try {
        await supabase.functions.invoke('handle-order-status-change', {
          body: {
            order: { ...loaded, ...result.order, status: finalStatus },
            old_order: loaded,
          },
        });
      } catch {
        /* email best-effort */
      }

      if (result.order) setLoaded({ ...loaded, ...result.order, status: finalStatus });
      refetch();
      void refetchDeliveryLog();

      if (failed > 0 && delivered === 0) {
        toast({
          title: 'Confirmed — delivery failed',
          description: summary || 'Use Deliver to retry.',
          variant: 'destructive',
        });
        return;
      }

      const ready = delivered > 0 || finalStatus === 'completed';
      toast({
        title: ready ? 'Done — WhatsApp opened' : 'Confirmed — WhatsApp opened',
        description: summary || 'Send the prefilled steps.',
      });
      openOrderWhatsApp(loaded, deliveryLog, ready ? 'auto_ready' : 'auto_processing');
    } catch (e: unknown) {
      toast({
        title: 'Could not confirm',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmManual = async () => {
    if (!loaded) return;
    try {
      const result = await updateStatus.mutateAsync({
        orderId: loaded.id,
        status: 'processing',
      });
      const finalStatus = (result.order?.status || 'processing') as Order['status'];
      try {
        await supabase.functions.invoke('handle-order-status-change', {
          body: {
            order: { ...loaded, ...result.order, status: finalStatus },
            old_order: loaded,
          },
        });
      } catch {
        /* email */
      }
      if (result.order) setLoaded({ ...loaded, ...result.order, status: finalStatus });
      refetch();
      toast({ title: 'Payment confirmed' });
    } catch (e: unknown) {
      toast({
        title: 'Could not confirm',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const copy = async (text: string, label: string) => {
    const ok = await safeCopy(text);
    toast({ title: ok ? 'Copied' : 'Copy failed', description: label });
  };

  const list = (
    <div className="admin-card overflow-hidden flex flex-col min-h-0 lg:max-h-[calc(100dvh-8.5rem)]">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">New orders</p>
            <p className="text-[11px] text-muted-foreground">
              {inboxOrders.length === 0 ? 'Inbox zero' : `${inboxOrders.length} waiting`}
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
          <p className="p-8 text-sm text-muted-foreground text-center">No new orders. You’re clear.</p>
        )}
        {filtered.map((o) => {
          const auto = orderHasAutoItems(o);
          const card = o.payment_method === 'card';
          const cs = card ? cardInboxState(o) : null;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => applyOrder(o)}
              className={cn(
                'w-full text-left px-4 py-3.5 min-h-[4.5rem] hover:bg-secondary/40 touch-manipulation',
                loaded?.id === o.id && 'bg-primary/10',
              )}
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-mono text-sm font-bold">{o.order_number}</p>
                    {auto && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                        Auto
                      </span>
                    )}
                    {card && cs && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                        {cardInboxLabel(cs)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {paymentMethodShort(o.payment_method)} · {o.customer_name} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <p className="text-sm font-black tabular-nums shrink-0">
                  {formatCatalogLkr(o.total_amount)}
                </p>
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-black text-lg sm:text-xl">{loaded.order_number}</p>
            {isAuto && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                <Zap className="w-3 h-3" /> Auto
              </span>
            )}
          </div>
          <p className="text-sm font-semibold truncate">{loaded.customer_name}</p>
          <p className="text-xs text-muted-foreground font-mono">{loaded.customer_whatsapp}</p>
          <p className="text-[11px] font-bold uppercase text-muted-foreground mt-1">
            {paymentMethodShort(loaded.payment_method)} · {adminStatusLabel(loaded.status)}
          </p>
        </div>
        <p className="text-2xl font-black tabular-nums shrink-0">{formatCatalogLkr(loaded.total_amount)}</p>
      </div>

      {cardState === 'needs_link' && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <Link2 className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">Paste the PayHere / Genie link, then Save & send.</p>
        </div>
      )}
      {cardState === 'marked_paid' && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">
            They tapped I’ve paid
            {loaded.card_marked_paid_at ? ` · ${formatDateTime(loaded.card_marked_paid_at)}` : ''}.
            Check the processor, then confirm.
          </p>
        </div>
      )}
      {cardState === 'waiting_pay' && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">Card link sent. Waiting for them to pay.</p>
        </div>
      )}

      <ul className="text-sm space-y-1.5">
        {(loaded.order_items || []).map((i) => {
          const autoLine = !!(
            i.products?.reseller_product_id && String(i.products.reseller_product_id).trim()
          );
          return (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {i.product_name}
                {(i.plan_name || i.variant_name)
                  ? ` (${[i.plan_name, i.variant_name].filter(Boolean).join(' · ')})`
                  : ''}
                <span className="text-muted-foreground"> ×{i.quantity}</span>
              </span>
              {autoLine && (
                <span className="shrink-0 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                  Auto
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {proofHref && (
        <a
          href={proofHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border p-2 hover:bg-secondary/40"
        >
          {/\.pdf($|\?)/i.test(loaded.payment_proof_url || '') ? (
            <span className="text-xs font-bold">Payment proof (PDF)</span>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 shrink-0" />
              <img src={proofHref} alt="Proof" className="h-16 w-16 rounded-lg object-cover" />
              <span className="text-xs font-bold">Payment proof</span>
            </>
          )}
        </a>
      )}

      {isCard && (cardState === 'needs_link' || cardState === 'waiting_pay' || !loaded.card_checkout_url) && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="processor">Processor link</Label>
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
          <p className="text-[11px] font-mono text-muted-foreground break-all">Customer page: {smUrl}</p>
          <Button
            type="button"
            className="w-full min-h-12 h-12 font-bold bg-[#25D366] hover:bg-[#128C7E] text-white text-base"
            disabled={busy}
            onClick={() => void handleSaveAndSend()}
          >
            {saveOrder.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            Save & send on WhatsApp
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => copy(smUrl, 'Payment page')}>
              <Copy className="w-4 h-4 mr-1.5" /> Copy
            </Button>
            <Button type="button" variant="outline" className="min-h-11" asChild>
              <a href={smUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" /> Preview
              </a>
            </Button>
          </div>
        </div>
      )}

      {isAuto &&
        loaded.status === 'pending' &&
        (!isCard || cardState === 'marked_paid' || cardState === 'waiting_pay') && (
        <Button
          type="button"
          className="w-full min-h-12 h-12 font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-base"
          disabled={busy}
          onClick={() => void handleConfirmAuto()}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
          Confirm, deliver & WhatsApp
        </Button>
      )}

      {!isAuto && loaded.status === 'pending' && cardState !== 'needs_link' && (
        <Button
          type="button"
          className="w-full min-h-12 h-12 font-bold"
          disabled={busy}
          onClick={() => void handleConfirmManual()}
        >
          {updateStatus.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Confirm payment
        </Button>
      )}

      {isAuto && loaded.status !== 'pending' && loaded.status !== 'cancelled' && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2">
          <p className="text-xs font-black uppercase tracking-wider">Reseller delivery</p>
          {deliveryLog.slice(0, 4).map((d) => (
            <p key={d.id} className="text-xs">
              <span className="font-semibold">{d.product_name}</span>{' '}
              <span className="uppercase text-muted-foreground">{d.status}</span>
            </p>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-11"
            onClick={() => openOrderWhatsApp(loaded, deliveryLog, 'auto_ready')}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Send Track Order steps
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Full order:{' '}
        <Link to={`/admin/orders`} className="text-primary font-semibold">
          Orders
        </Link>
        {isCard ? (
          <>
            {' · '}
            <Link
              to={`/admin/card-payments?order=${encodeURIComponent(loaded.order_number)}`}
              className="text-primary font-semibold"
            >
              Card desk
            </Link>
          </>
        ) : null}
      </p>
    </div>
  ) : (
    <div className="hidden lg:flex admin-card min-h-[20rem] items-center justify-center p-8 text-center">
      <div>
        <Inbox className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="font-bold">Pick a new order</p>
        <p className="text-sm text-muted-foreground mt-1">Auto and card items that need you are at the top.</p>
      </div>
    </div>
  );

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Inbox</h1>
          <p className="admin-page-subtitle">
            New orders only. Auto = one tap confirm, deliver, WhatsApp steps. Card = paste link, send.
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:gap-4 lg:items-start">
        <div className={cn(mobileList ? 'block' : 'hidden', 'lg:block')}>{list}</div>
        <div className={cn(!mobileList ? 'block' : 'hidden', 'lg:block')}>{workspace}</div>
      </div>
    </div>
  );
};

export default AdminInbox;

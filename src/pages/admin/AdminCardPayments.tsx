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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrders, useUpdateExistingOrder, type Order } from '@/hooks/useOrders';
import { formatCatalogLkr } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cardPaymentPageUrl, isValidHttpUrl } from '@/lib/cardPayment';
import { getOrderWhatsAppLink } from '@/lib/adminOrderWhatsApp';
import { adminStatusLabel } from '@/lib/orderStatus';
import { formatDateTime, cn } from '@/lib/utils';

const AdminCardPayments = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefill = searchParams.get('order') || '';
  const [query, setQuery] = useState(prefill);
  const [loaded, setLoaded] = useState<Order | null>(null);
  const [processorUrl, setProcessorUrl] = useState('');
  const { data: orders = [], isLoading, refetch } = useOrders();
  const { data: settings } = useSiteSettings();
  const saveOrder = useUpdateExistingOrder();

  const cardOrders = useMemo(() => {
    return orders
      .filter((o) => o.payment_method === 'card')
      .slice()
      .sort((a, b) => {
        const ap = a.status === 'pending' ? 0 : 1;
        const bp = b.status === 'pending' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [orders]);

  useEffect(() => {
    if (!prefill || loaded || !orders.length) return;
    const match = orders.find(
      (o) => o.order_number.toLowerCase() === prefill.toLowerCase() || o.id === prefill,
    );
    if (match) applyOrder(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, orders.length]);

  const applyOrder = (order: Order) => {
    setLoaded(order);
    setQuery(order.order_number);
    setProcessorUrl(order.card_checkout_url || settings?.card_payment_link || '');
    setSearchParams({ order: order.order_number }, { replace: true });
  };

  const handleLoad = () => {
    const q = query.trim();
    if (!q) return;
    const match = orders.find(
      (o) => o.order_number.toLowerCase() === q.toLowerCase() || o.id === q,
    );
    if (!match) {
      toast({
        title: 'Order not found',
        description: 'Use the full Order ID (SNIP-2026-XXXXXX).',
        variant: 'destructive',
      });
      setLoaded(null);
      return;
    }
    applyOrder(match);
  };

  const smUrl = loaded ? cardPaymentPageUrl(loaded.order_number) : '';

  const handleSave = async () => {
    if (!loaded) return;
    const url = processorUrl.trim();
    if (!isValidHttpUrl(url)) {
      toast({
        title: 'Invalid payment URL',
        description: 'Paste a full https:// PayHere / Stripe / Genie link.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await saveOrder.mutateAsync({
        orderId: loaded.order_number,
        updates: {
          card_checkout_url: url,
          card_link_created_at: new Date().toISOString(),
          payment_method: loaded.payment_method || 'card',
        } as Partial<Order>,
      });
      const next = { ...loaded, card_checkout_url: url, card_link_created_at: new Date().toISOString() };
      setLoaded(next);
      toast({ title: 'Link saved', description: smUrl });
      refetch();
    } catch (e: any) {
      toast({
        title: 'Could not save',
        description: e?.message || 'Try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (!loaded) return;
    if (!loaded.card_checkout_url && !processorUrl.trim()) {
      toast({
        title: 'Save the processor link first',
        description: 'Customer needs Proceed to payment to work.',
        variant: 'destructive',
      });
      return;
    }
    const link = getOrderWhatsAppLink(loaded, 'card_link', [], {
      cardPaymentLink: smUrl,
      amountLabel: formatCatalogLkr(Number(loaded.total_amount)),
    });
    if (!link.url) {
      toast({
        title: 'Invalid customer WhatsApp',
        description: link.display || 'Fix the number on the order.',
        variant: 'destructive',
      });
      return;
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: label });
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Card payments</h1>
          <p className="admin-page-subtitle">
            Host PayHere / Stripe links on snippymart.com/payment/…
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} className="admin-icon-btn">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="admin-card p-4 sm:p-5 space-y-4">
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleLoad();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SNIP-2026-123456"
              className="pl-10 h-12 font-mono"
            />
          </div>
          <Button type="submit" className="h-12 px-5 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load order'}
          </Button>
        </form>

        {loaded && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono font-black text-lg">{loaded.order_number}</p>
                <p className="text-sm font-semibold">{loaded.customer_name}</p>
                <p className="text-xs text-muted-foreground">{loaded.customer_whatsapp}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black tabular-nums">{formatCatalogLkr(loaded.total_amount)}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  {adminStatusLabel(loaded.status)}
                  {loaded.payment_proof_url ? ' · proof ✓' : ''}
                </p>
              </div>
            </div>
            <ul className="text-sm space-y-1">
              {(loaded.order_items || []).map((i) => (
                <li key={i.id}>
                  {i.product_name}
                  {(i.plan_name || i.variant_name) ? ` (${[i.plan_name, i.variant_name].filter(Boolean).join(' · ')})` : ''}
                  {' '}×{i.quantity}
                </li>
              ))}
            </ul>

            <div>
              <Label htmlFor="processor">Card processor link (PayHere / Stripe / Genie)</Label>
              <Input
                id="processor"
                value={processorUrl}
                onChange={(e) => setProcessorUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1.5 h-11 font-mono text-sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1">
              <p className="text-[10px] font-black uppercase text-purple-600">Customer sees this page</p>
              <p className="text-sm font-mono break-all">{smUrl}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="font-bold"
                onClick={handleSave}
                disabled={saveOrder.isPending}
              >
                {saveOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save link
              </Button>
              <Button
                type="button"
                className="font-bold bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={handleSendWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send on WhatsApp
              </Button>
              <Button type="button" variant="outline" onClick={() => copy(smUrl, 'Snippy payment page')}>
                <Copy className="w-4 h-4 mr-2" />
                Copy SM link
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={smUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold">Card orders</p>
          <p className="text-[11px] text-muted-foreground">Pending first — tap to fill the form</p>
        </div>
        <div className="divide-y divide-border">
          {cardOrders.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No card orders yet.</p>
          )}
          {cardOrders.slice(0, 40).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => applyOrder(o)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-secondary/40 touch-manipulation',
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
                <div className="text-right shrink-0">
                  <p className="text-sm font-black tabular-nums">{formatCatalogLkr(o.total_amount)}</p>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    {adminStatusLabel(o.status)}
                    {o.card_checkout_url ? ' · linked' : ''}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Need the default processor URL? Set it in{' '}
        <Link to="/admin/settings" className="text-primary font-semibold">
          Settings → Payments
        </Link>
        .
      </p>
    </div>
  );
};

export default AdminCardPayments;

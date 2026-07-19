import { useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Ban,
  Wallet,
  Copy,
  Eye,
  Package,
  MessageCircle,
  ShoppingCart,
  Calendar,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminAffiliates,
  useAdminAffiliateCommissions,
  useAdminAffiliatePayouts,
  useAdminAffiliateDetail,
  useUpdateAffiliate,
  useMarkPayoutPaid,
  useAdminCreateAffiliate,
  type AffiliateRow,
} from '@/hooks/useAffiliate';
import { buildAffiliateLink } from '@/lib/affiliate';
import { formatWhatsAppDisplay, toWhatsAppDigits } from '@/lib/phoneWhatsApp';
import { cn, formatDateTime } from '@/lib/utils';

const statusColor = (s: string) => {
  switch (s) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'rejected':
    case 'disabled':
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/25';
    case 'paid':
      return 'bg-primary/10 text-primary border-primary/25';
    case 'approved':
    case 'completed':
    case 'processing':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const AdminAffiliates = () => {
  const { toast } = useToast();
  const { data: affiliates = [], isLoading, refetch, isFetching } = useAdminAffiliates();
  const { data: commissions = [], refetch: refetchC } = useAdminAffiliateCommissions();
  const { data: payouts = [], refetch: refetchP } = useAdminAffiliatePayouts();
  const updateAff = useUpdateAffiliate();
  const markPaid = useMarkPayoutPaid();
  const createAff = useAdminCreateAffiliate();
  const [rateDraft, setRateDraft] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    code: '',
    rate: '7',
  });
  const [selected, setSelected] = useState<AffiliateRow | null>(null);
  const [detailTab, setDetailTab] = useState('orders');

  const detail = useAdminAffiliateDetail(
    selected ? { id: selected.id, code: selected.code } : null,
  );

  const refreshAll = () => {
    void refetch();
    void refetchC();
    void refetchP();
    if (selected) void detail.refetch();
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await updateAff.mutateAsync({ id, status });
      toast({ title: `Affiliate ${status}` });
      if (selected?.id === id) {
        setSelected((s) => (s ? { ...s, status: status as AffiliateRow['status'] } : s));
      }
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const saveRate = async (id: string) => {
    const n = Number(rateDraft[id]);
    if (!Number.isFinite(n) || n < 0 || n > 50) {
      toast({ title: 'Rate must be 0–50%', variant: 'destructive' });
      return;
    }
    try {
      await updateAff.mutateAsync({ id, commission_percent: n });
      toast({ title: 'Commission rate saved' });
      if (selected?.id === id) {
        setSelected((s) => (s ? { ...s, commission_percent: n } : s));
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  /** Quick per-partner counts from global commissions list */
  const partnerStats = useMemo(() => {
    const map: Record<
      string,
      { orders: number; earned: number; pending: number; approved: number }
    > = {};
    for (const c of commissions as any[]) {
      const aid = c.affiliate_id as string;
      if (!map[aid]) map[aid] = { orders: 0, earned: 0, pending: 0, approved: 0 };
      map[aid].orders += 1;
      const amt = Number(c.commission_amount || 0);
      map[aid].earned += amt;
      if (c.status === 'pending') map[aid].pending += amt;
      if (c.status === 'approved') map[aid].approved += amt;
    }
    return map;
  }, [commissions]);

  const pendingCount = affiliates.filter((a) => a.status === 'pending').length;
  const activeCount = affiliates.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
            Affiliates
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Partners · referrals · commissions · payouts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 font-bold"
          onClick={refreshAll}
          disabled={isFetching}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { l: 'Pending apps', v: pendingCount },
          { l: 'Active', v: activeCount },
          { l: 'Commissions', v: commissions.length },
          {
            l: 'Payouts open',
            v: payouts.filter((p: any) => p.status === 'requested').length,
          },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <p className="text-2xl font-black tabular-nums">{s.v}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              {s.l}
            </p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1 mb-4">
          <TabsTrigger value="partners" className="py-2 text-xs sm:text-sm gap-1">
            <Users className="w-3.5 h-3.5" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="commissions" className="py-2 text-xs sm:text-sm">
            Commissions
          </TabsTrigger>
          <TabsTrigger value="payouts" className="py-2 text-xs sm:text-sm gap-1">
            <Wallet className="w-3.5 h-3.5" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-3 mt-0">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-foreground">Add partner (no signup)</p>
              <p className="text-[11px] text-muted-foreground">
                Creates an active affiliate. They use code + WhatsApp on /affiliate.
              </p>
            </div>
            <form
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await createAff.mutateAsync({
                    name: createForm.name,
                    whatsapp: createForm.whatsapp,
                    email: createForm.email || undefined,
                    code: createForm.code || undefined,
                    commission_percent: Number(createForm.rate) || 7,
                    activate: true,
                  });
                  toast({
                    title: 'Affiliate active',
                    description: `Code ${res.code} — link: snippymart.com/?ref=${res.code}`,
                  });
                  setCreateForm({ name: '', whatsapp: '', email: '', code: '', rate: '7' });
                } catch (err: any) {
                  toast({
                    title: 'Create failed',
                    description: err.message,
                    variant: 'destructive',
                  });
                }
              }}
            >
              <Input
                required
                placeholder="Name"
                className="h-10"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                required
                placeholder="WhatsApp"
                className="h-10"
                value={createForm.whatsapp}
                onChange={(e) => setCreateForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
              <Input
                placeholder="Code (opt)"
                className="h-10 font-mono"
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                  }))
                }
              />
              <Input
                type="number"
                min={0}
                max={50}
                step={0.5}
                className="h-10"
                value={createForm.rate}
                onChange={(e) => setCreateForm((f) => ({ ...f, rate: e.target.value }))}
                placeholder="%"
              />
              <Button type="submit" className="h-10 font-bold" disabled={createAff.isPending}>
                {createAff.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create + activate'
                )}
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No applications yet. Share /affiliate with promoters.
            </p>
          ) : (
            affiliates.map((a) => {
              const link = buildAffiliateLink(a.code);
              const st = partnerStats[a.id];
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground">{a.name}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px]', statusColor(a.status))}
                        >
                          {a.status}
                        </Badge>
                      </div>
                      <p className="font-mono text-sm font-black text-primary mt-0.5">{a.code}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {formatWhatsAppDisplay(a.whatsapp)}
                        {a.email ? ` · ${a.email}` : ''}
                        {(a as any).fraud_score > 0
                          ? ` · ⚠ score ${(a as any).fraud_score}`
                          : ''}
                      </p>
                      {st && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                          <span className="text-foreground font-bold">{st.orders}</span> referrals ·
                          earned{' '}
                          <span className="text-foreground font-bold tabular-nums">
                            Rs. {Math.round(st.earned).toLocaleString()}
                          </span>
                          {st.approved > 0 && (
                            <>
                              {' '}
                              · available Rs. {Math.round(st.approved).toLocaleString()}
                            </>
                          )}
                        </p>
                      )}
                      {a.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {a.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-9 font-bold"
                        onClick={() => {
                          setSelected(a);
                          setDetailTab('orders');
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                      {a.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="h-9 font-bold"
                            onClick={() => setStatus(a.id, 'active')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9"
                            onClick={() => setStatus(a.id, 'rejected')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {a.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-destructive"
                          onClick={() => setStatus(a.id, 'disabled')}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Disable
                        </Button>
                      )}
                      {(a.status === 'disabled' || a.status === 'rejected') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9"
                          onClick={() => setStatus(a.id, 'active')}
                        >
                          Re-activate
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <Input className="h-9 font-mono text-xs min-w-0" readOnly value={link} />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(link);
                          toast({ title: 'Link copied' });
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        className="h-9 w-20"
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        placeholder={`${a.commission_percent}`}
                        value={rateDraft[a.id] ?? ''}
                        onChange={(e) =>
                          setRateDraft((d) => ({ ...d, [a.id]: e.target.value }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => saveRate(a.id)}
                      >
                        Save rate
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="commissions" className="mt-0 space-y-2">
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No commissions yet</p>
          ) : (
            commissions.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold truncate">{c.order_number}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.affiliates?.code || '—'} · order Rs.{' '}
                    {Number(c.order_total || 0).toLocaleString()} · {c.commission_percent}% ·{' '}
                    <span className="font-bold uppercase">{c.status}</span>
                    {c.hold_until && c.status === 'pending'
                      ? ` · hold ${new Date(c.hold_until).toLocaleDateString()}`
                      : ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.created_at ? formatDateTime(c.created_at) : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black tabular-nums">
                    Rs. {Number(c.commission_amount).toLocaleString()}
                  </p>
                  {c.affiliates?.name && (
                    <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {c.affiliates.name}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="payouts" className="mt-0 space-y-2">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No payout requests</p>
          ) : (
            payouts.map((p: any) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {p.affiliates?.name}{' '}
                      <span className="font-mono text-primary">({p.affiliates?.code})</span>
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {formatWhatsAppDisplay(p.affiliates?.whatsapp || '')}
                      {p.method ? ` · ${p.method}` : ''}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn('mt-1 text-[10px]', statusColor(p.status))}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="font-black text-lg tabular-nums shrink-0">
                    Rs. {Number(p.amount).toLocaleString()}
                  </p>
                </div>
                {p.note && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium whitespace-pre-wrap break-words rounded-lg bg-amber-500/5 border border-amber-500/15 p-2">
                    {p.note}
                  </p>
                )}
                {p.status === 'requested' && (
                  <Button
                    size="sm"
                    className="w-full h-10 font-bold"
                    disabled={markPaid.isPending}
                    onClick={async () => {
                      try {
                        await markPaid.mutateAsync(p.id);
                        toast({ title: 'Marked paid' });
                      } catch (e: any) {
                        toast({
                          title: 'Failed',
                          description: e.message,
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    {String(p.note || '').includes('FIRST PAYOUT')
                      ? 'Verify & mark paid'
                      : 'Mark paid'}
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Partner detail dialog ─── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl w-[calc(100%-1.5rem)] sm:w-full max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0">
          {selected && (
            <>
              <DialogHeader className="p-4 sm:p-5 border-b border-border shrink-0 text-left space-y-1">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
                  {selected.name}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', statusColor(selected.status))}
                  >
                    {selected.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-left space-y-1">
                  <span className="font-mono font-black text-primary text-base block">
                    {selected.code}
                  </span>
                  <span className="text-xs block break-all">
                    {formatWhatsAppDisplay(selected.whatsapp)}
                    {selected.email ? ` · ${selected.email}` : ''}
                  </span>
                  <span className="text-[11px] block text-muted-foreground">
                    Joined {formatDateTime(selected.created_at)}
                    {selected.approved_at
                      ? ` · Approved ${formatDateTime(selected.approved_at)}`
                      : ''}
                    {' · '}
                    {selected.commission_percent}% rate
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 font-bold"
                    onClick={() => {
                      const link = buildAffiliateLink(selected.code);
                      navigator.clipboard.writeText(link);
                      toast({ title: 'Link copied' });
                    }}
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1" />
                    Copy link
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 font-bold" asChild>
                    <a
                      href={`https://wa.me/${toWhatsAppDigits(selected.whatsapp).digits || selected.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      WhatsApp
                    </a>
                  </Button>
                  {selected.status === 'pending' && (
                    <Button
                      size="sm"
                      className="h-9 font-bold"
                      onClick={() => setStatus(selected.id, 'active')}
                    >
                      Approve
                    </Button>
                  )}
                </div>

                {/* Stats */}
                {detail.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : detail.data ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          l: 'Orders',
                          v: detail.data.stats.ordersTotal,
                          sub: `${detail.data.stats.ordersCompleted} done`,
                        },
                        {
                          l: 'Sales',
                          v: `Rs. ${Math.round(detail.data.stats.salesVolume).toLocaleString()}`,
                        },
                        {
                          l: 'Available',
                          v: `Rs. ${Math.round(detail.data.stats.commissionApproved).toLocaleString()}`,
                        },
                        {
                          l: 'Paid out',
                          v: `Rs. ${Math.round(detail.data.stats.payoutsPaid).toLocaleString()}`,
                        },
                      ].map((s) => (
                        <div
                          key={s.l}
                          className="rounded-xl border border-border bg-secondary/40 p-2.5 min-w-0"
                        >
                          <p className="text-sm font-black tabular-nums break-all leading-tight">
                            {s.v}
                          </p>
                          <p className="text-[9px] font-bold uppercase text-muted-foreground mt-0.5">
                            {s.l}
                            {s.sub ? ` · ${s.sub}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <p>
                        Pending commissions:{' '}
                        <strong className="text-foreground">
                          Rs.{' '}
                          {Math.round(detail.data.stats.commissionPending).toLocaleString()}
                        </strong>
                      </p>
                      <p>
                        On hold:{' '}
                        <strong className="text-foreground">
                          Rs. {Math.round(detail.data.stats.commissionHeld).toLocaleString()}
                        </strong>
                      </p>
                    </div>

                    {selected.notes && (
                      <div className="rounded-xl border border-border p-3 text-xs">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                          Application notes
                        </p>
                        <p className="text-foreground whitespace-pre-wrap">{selected.notes}</p>
                      </div>
                    )}

                    <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                      <TabsList className="w-full grid grid-cols-3 h-auto p-1">
                        <TabsTrigger value="orders" className="text-xs py-2 gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Orders ({detail.data.orders.length})
                        </TabsTrigger>
                        <TabsTrigger value="comms" className="text-xs py-2">
                          Commissions
                        </TabsTrigger>
                        <TabsTrigger value="pays" className="text-xs py-2">
                          Payouts
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="orders" className="mt-3 space-y-2">
                        {detail.data.orders.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No referred orders yet
                          </p>
                        ) : (
                          detail.data.orders.map((o: any) => (
                            <div
                              key={o.id}
                              className="rounded-xl border border-border bg-card p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-mono font-bold text-sm break-all">
                                    {o.order_number}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {o.customer_name || 'Customer'}
                                    {o.customer_whatsapp
                                      ? ` · ${formatWhatsAppDisplay(o.customer_whatsapp)}`
                                      : ''}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={cn('text-[9px]', statusColor(o.status))}
                                    >
                                      {o.status}
                                    </Badge>
                                    {o.payment_method && (
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                        {String(o.payment_method).replace(/_/g, ' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black tabular-nums text-sm">
                                    Rs. {Number(o.total_amount || 0).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {o.created_at
                                      ? new Date(o.created_at).toLocaleDateString()
                                      : '—'}
                                  </p>
                                </div>
                              </div>
                              {(o.order_items || []).length > 0 && (
                                <div className="rounded-lg bg-secondary/40 border border-border/60 p-2 space-y-1">
                                  <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Items purchased
                                  </p>
                                  {(o.order_items as any[]).map((it) => (
                                    <div
                                      key={it.id}
                                      className="flex justify-between gap-2 text-xs"
                                    >
                                      <span className="text-foreground font-medium min-w-0 break-words">
                                        {it.product_name}
                                        {it.plan_name ? ` (${it.plan_name})` : ''}
                                        {it.quantity > 1 ? ` ×${it.quantity}` : ''}
                                      </span>
                                      <span className="tabular-nums text-muted-foreground shrink-0">
                                        Rs. {Number(it.total_price || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="comms" className="mt-3 space-y-2">
                        {detail.data.commissions.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No commissions
                          </p>
                        ) : (
                          detail.data.commissions.map((c) => (
                            <div
                              key={c.id}
                              className="flex justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="font-mono font-bold truncate">
                                  {c.order_number || c.order_id}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Order Rs. {Number(c.order_total || 0).toLocaleString()} ·{' '}
                                  {c.commission_percent}% ·{' '}
                                  <span className="uppercase font-bold">{c.status}</span>
                                  {(c as any).hold_until && c.status === 'pending'
                                    ? ` · hold until ${new Date((c as any).hold_until).toLocaleDateString()}`
                                    : ''}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {c.created_at ? formatDateTime(c.created_at) : ''}
                                </p>
                              </div>
                              <p className="font-black tabular-nums shrink-0">
                                Rs. {Number(c.commission_amount).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="pays" className="mt-3 space-y-2">
                        {detail.data.payouts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No payout requests
                          </p>
                        ) : (
                          detail.data.payouts.map((p) => (
                            <div
                              key={p.id}
                              className="rounded-xl border border-border p-3 space-y-1.5 text-sm"
                            >
                              <div className="flex justify-between gap-2">
                                <div>
                                  <p className="font-black tabular-nums">
                                    Rs. {Number(p.amount).toLocaleString()}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {p.method || '—'} · {p.status}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn('text-[9px] h-fit', statusColor(p.status))}
                                >
                                  {p.status}
                                </Badge>
                              </div>
                              {p.note && (
                                <p className="text-[11px] whitespace-pre-wrap break-words text-muted-foreground bg-secondary/40 rounded-lg p-2">
                                  {p.note}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                Requested {p.created_at ? formatDateTime(p.created_at) : '—'}
                                {p.paid_at
                                  ? ` · Paid ${formatDateTime(p.paid_at)}`
                                  : ''}
                              </p>
                              {p.status === 'requested' && (
                                <Button
                                  size="sm"
                                  className="w-full h-9 font-bold mt-1"
                                  disabled={markPaid.isPending}
                                  onClick={async () => {
                                    try {
                                      await markPaid.mutateAsync(p.id);
                                      toast({ title: 'Marked paid' });
                                      detail.refetch();
                                    } catch (e: any) {
                                      toast({
                                        title: 'Failed',
                                        description: e.message,
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  Mark paid
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                ) : detail.isError ? (
                  <p className="text-sm text-destructive text-center py-6">
                    {(detail.error as Error)?.message || 'Could not load details'}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliates;

import { useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Ban,
  Wallet,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminAffiliates,
  useAdminAffiliateCommissions,
  useAdminAffiliatePayouts,
  useUpdateAffiliate,
  useMarkPayoutPaid,
  useAdminCreateAffiliate,
} from '@/hooks/useAffiliate';
import { buildAffiliateLink } from '@/lib/affiliate';
import { cn } from '@/lib/utils';

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
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    default:
      return 'bg-muted text-muted-foreground';
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

  const refreshAll = () => {
    void refetch();
    void refetchC();
    void refetchP();
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await updateAff.mutateAsync({ id, status });
      toast({ title: `Affiliate ${status}` });
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
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

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
            Approve partners · commissions · payouts
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
                Creates an active affiliate. They use code + WhatsApp on /affiliate — no account.
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
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground">{a.name}</p>
                        <Badge variant="outline" className={cn('text-[10px]', statusColor(a.status))}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="font-mono text-sm font-black text-primary mt-0.5">{a.code}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.whatsapp}
                        {a.email ? ` · ${a.email}` : ''}
                      </p>
                      {a.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {a.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
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
                      <Input
                        className="h-9 font-mono text-xs"
                        readOnly
                        value={link}
                      />
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
                    {c.affiliates?.code || '—'} · {c.commission_percent}% ·{' '}
                    <span className={cn('font-bold uppercase', statusColor(c.status).split(' ')[1])}>
                      {c.status}
                    </span>
                  </p>
                </div>
                <p className="font-black tabular-nums shrink-0">
                  Rs. {Number(c.commission_amount).toLocaleString()}
                </p>
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
                  <div>
                    <p className="font-bold">
                      {p.affiliates?.name}{' '}
                      <span className="font-mono text-primary">({p.affiliates?.code})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.affiliates?.whatsapp}
                      {p.method ? ` · ${p.method}` : ''}
                    </p>
                    <Badge variant="outline" className={cn('mt-1 text-[10px]', statusColor(p.status))}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="font-black text-lg tabular-nums">
                    Rs. {Number(p.amount).toLocaleString()}
                  </p>
                </div>
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
                    Mark paid
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAffiliates;

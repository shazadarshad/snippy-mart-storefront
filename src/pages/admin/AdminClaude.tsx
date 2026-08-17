import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Search,
  RefreshCw,
  Loader2,
  MessageCircle,
  Mail,
  Copy,
  ExternalLink,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  Wallet,
  BadgeCheck,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  Eye,
  X,
  Package,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOrders, useDeleteOrder, type Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn, formatDateTime } from '@/lib/utils';
import {
  applyClaudeWorkflowToNotes,
  claudeStageLabel,
  claudeStageOrder,
  formatLkrAdmin,
  isClaudePreOrder,
  parseClaudePreOrder,
  stagesForPaymentMode,
  statusForClaudeStage,
  type ClaudePreOrderInfo,
  type ClaudeWorkflowStage,
} from '@/lib/claudePreorder';
import { paymentMethodLabel } from '@/lib/paymentMethod';

type StageFilter = 'all' | ClaudeWorkflowStage;
type PlanFilter = 'all' | 'pro' | 'max' | 'other';

const STAGE_COLORS: Record<ClaudeWorkflowStage, string> = {
  deposit_pending: 'bg-warning/15 text-warning border-warning/30',
  deposit_verified: 'bg-primary/15 text-primary border-primary/30',
  balance_paid: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  activated: 'bg-success/15 text-success border-success/30',
};

const AdminClaude = () => {
  const { toast } = useToast();
  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const deleteOrder = useDeleteOrder();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofHref, setProofHref] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const claudeOrders = useMemo(() => {
    return orders
      .filter((o) => isClaudePreOrder(o))
      .map((order) => ({ order, info: parseClaudePreOrder(order)! }))
      .filter((x) => x.info != null)
      .sort(
        (a, b) =>
          new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
      );
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return claudeOrders.filter(({ order, info }) => {
      const matchesSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_whatsapp.includes(search) ||
        (info.claudeEmail || '').toLowerCase().includes(q) ||
        (info.plan || '').toLowerCase().includes(q) ||
        (order.notes || '').toLowerCase().includes(q);

      const matchesStage = stageFilter === 'all' || info.stage === stageFilter;

      const planLower = (info.plan || '').toLowerCase();
      const matchesPlan =
        planFilter === 'all' ||
        (planFilter === 'pro' && planLower.includes('pro') && !planLower.includes('max')) ||
        (planFilter === 'max' && planLower.includes('max')) ||
        (planFilter === 'other' &&
          !planLower.includes('pro') &&
          !planLower.includes('max'));

      return matchesSearch && matchesStage && matchesPlan;
    });
  }, [claudeOrders, search, stageFilter, planFilter]);

  const stats = useMemo(() => {
    const byStage: Record<ClaudeWorkflowStage, number> = {
      deposit_pending: 0,
      deposit_verified: 0,
      balance_paid: 0,
      activated: 0,
    };
    let depositCollected = 0;
    let fullPipelineValue = 0;
    let proCount = 0;
    let maxCount = 0;

    for (const { info } of claudeOrders) {
      byStage[info.stage] += 1;
      depositCollected += info.deposit ?? 0;
      fullPipelineValue += info.fullPrice ?? info.deposit ?? 0;
      const p = (info.plan || '').toLowerCase();
      if (p.includes('max')) maxCount += 1;
      else if (p.includes('pro')) proCount += 1;
    }

    const balanceOutstanding = claudeOrders
      .filter(({ info }) => info.stage === 'deposit_pending' || info.stage === 'deposit_verified')
      .reduce((sum, { info }) => sum + (info.remaining ?? 0), 0);

    const openCount = claudeOrders.filter(({ info }) => info.stage !== 'activated').length;

    return {
      total: claudeOrders.length,
      open: openCount,
      byStage,
      depositCollected,
      balanceOutstanding,
      fullPipelineValue,
      proCount,
      maxCount,
    };
  }, [claudeOrders]);

  useEffect(() => {
    const run = async () => {
      const proof = selected?.payment_proof_url;
      if (!selected || !proof) {
        setProofHref(null);
        return;
      }
      if (/^https?:\/\//i.test(proof)) {
        setProofHref(proof);
        return;
      }
      setLoadingProof(true);
      try {
        const { data, error: sErr } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(proof, 60 * 60);
        if (sErr) throw sErr;
        setProofHref(data?.signedUrl ?? null);
      } catch {
        setProofHref(null);
      } finally {
        setLoadingProof(false);
      }
    };
    run();
  }, [selected]);

  const handleStageChange = async (order: Order, stage: ClaudeWorkflowStage) => {
    setUpdatingId(order.id);
    try {
      const info = parseClaudePreOrder(order);
      const mode = info?.paymentMode || 'reserve';
      const nextNotes = applyClaudeWorkflowToNotes(order.notes, stage);
      const nextStatus = statusForClaudeStage(stage, mode);
      const updates: Record<string, unknown> = {
        notes: nextNotes,
        updated_at: new Date().toISOString(),
      };
      if (nextStatus) updates.status = nextStatus;

      const { data, error: uErr } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)
        .select(
          `
          *,
          order_items (
            *,
            products ( manual_fulfillment )
          )
        `
        )
        .single();

      if (uErr) throw uErr;

      if (nextStatus && nextStatus !== order.status) {
        try {
          await supabase.functions.invoke('handle-order-status-change', {
            body: {
              order: { ...order, ...data, status: nextStatus },
              old_order: order,
              custom_message:
                stage === 'deposit_verified'
                  ? mode === 'full'
                    ? 'Your Claude payment was verified. We will send the private workspace invite soon.'
                    : 'Your Claude deposit was verified. Remaining balance is due before the workspace invite.'
                  : stage === 'balance_paid'
                    ? 'Balance payment received for your Claude order. Activation is next.'
                    : stage === 'activated'
                      ? 'Your Claude Team seat has been activated — check your email for the private workspace invite.'
                      : `Your Claude order status: ${claudeStageLabel(stage, mode)}.`,
            },
          });
        } catch (e) {
          console.warn('Claude notify failed', e);
        }
      }

      toast({
        title: 'Updated',
        description: `${order.order_number} → ${claudeStageLabel(stage, mode)}`,
      });

      if (selected?.id === order.id && data) {
        setSelected(data as unknown as Order);
      }
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update stage';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied` });
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      // Best-effort: remove payment proof from storage if path is relative
      const proof = orderToDelete.payment_proof_url;
      if (proof && !/^https?:\/\//i.test(proof)) {
        await supabase.storage.from('payment-proofs').remove([proof]);
      }

      await deleteOrder.mutateAsync(orderToDelete.id);
      toast({
        title: 'Order deleted',
        description: `${orderToDelete.order_number} has been permanently deleted.`,
      });
      if (selected?.id === orderToDelete.id) {
        setSelected(null);
      }
      setOrderToDelete(null);
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete order';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedInfo = selected ? parseClaudePreOrder(selected) : null;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="admin-page-title">Claude Pre-Orders</h1>
          </div>
          <p className="admin-page-subtitle">
            Private workspace invites · Pro / Max seats · deposit workflow
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-11 rounded-xl touch-manipulation" asChild>
            <Link to="/claude" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Public page
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="admin-icon-btn" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 admin-stagger">
        <div className="admin-stat-tile bg-orange-500/10 border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">{stats.total}</p>
          <p className="text-xs text-muted-foreground">{stats.open} open · {stats.byStage.activated} activated</p>
        </div>
        <div className="admin-stat-tile bg-success/10 border-success/20">
          <div className="flex items-center gap-2 text-success mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Deposits in</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {formatLkrAdmin(stats.depositCollected)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Sum of amounts paid</p>
        </div>
        <div className="admin-stat-tile bg-warning/10 border-warning/20">
          <div className="flex items-center gap-2 text-warning mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Balance due</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {formatLkrAdmin(stats.balanceOutstanding)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Open pre-orders owing 70%</p>
        </div>
        <div className="admin-stat-tile bg-secondary/50 border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Plans</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {stats.proCount}
            <span className="text-sm font-bold text-muted-foreground mx-1">Pro</span>
            · {stats.maxCount}
            <span className="text-sm font-bold text-muted-foreground ml-1">Max</span>
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Pipeline ~ {formatLkrAdmin(stats.fullPipelineValue)}
          </p>
        </div>
      </div>

      {/* Stage chips */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'All', stats.total],
            ...claudeStageOrder.map((s) => [s, claudeStageLabel(s), stats.byStage[s]] as const),
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={String(key)}
            type="button"
            onClick={() => setStageFilter(key as StageFilter)}
            className={cn(
              'admin-filter-chip',
              stageFilter === key
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-card border-border text-muted-foreground hover:border-orange-500/40'
            )}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, name, WhatsApp, Claude email…"
            className="pl-10 h-11 sm:h-12 bg-card rounded-xl text-base"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
          <SelectTrigger className="w-full sm:w-40 h-11 bg-card">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="pro">Pro Seat</SelectItem>
            <SelectItem value="max">Max 5X</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20">
          <p className="font-bold text-destructive mb-1">Failed to load orders</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
          <Zap className="w-10 h-10 mx-auto mb-3 text-orange-400/50" />
          <p className="font-bold text-foreground mb-1">No Claude pre-orders found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {claudeOrders.length === 0
              ? 'Orders from /claude will show up here.'
              : 'Try clearing filters.'}
          </p>
          <Button variant="outline" asChild>
            <Link to="/claude" target="_blank">
              Open public Claude page
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ order, info }) => (
            <ClaudeOrderCard
              key={order.id}
              order={order}
              info={info}
              updating={updatingId === order.id}
              onOpen={() => setSelected(order)}
              onStage={handleStageChange}
              onCopy={copy}
              onDelete={() => setOrderToDelete(order)}
            />
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filtered.length} of {claudeOrders.length} Claude pre-orders
      </p>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden sm:rounded-3xl border-none w-[95vw]">
          {selected && selectedInfo && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-5 text-white relative">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                  Claude pre-order
                </p>
                <h2 className="text-xl font-black font-mono pr-10">{selected.order_number}</h2>
                <p className="text-sm opacity-90 mt-1">
                  {selectedInfo.plan} · {claudeStageLabel(selectedInfo.stage, selectedInfo.paymentMode)}
                  {selectedInfo.isFullPayment ? ' · FULL' : ' · 50%'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 text-white hover:bg-white/20"
                  onClick={() => setSelected(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Money */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Full</p>
                    <p className="text-sm font-black">{formatLkrAdmin(selectedInfo.fullPrice)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 text-center">
                    <p className="text-[9px] font-black uppercase text-orange-400">
                      {selectedInfo.isFullPayment ? 'Paid' : 'Deposit'}
                    </p>
                    <p className="text-sm font-black">{formatLkrAdmin(selectedInfo.deposit)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Balance</p>
                    <p className="text-sm font-black">{formatLkrAdmin(selectedInfo.remaining)}</p>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-2 text-sm">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Customer</p>
                    <p className="font-bold">{selected.customer_name}</p>
                    <p className="text-muted-foreground">{selected.customer_whatsapp}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <p className="text-[10px] font-bold uppercase text-orange-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Claude email (invite)
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="font-mono font-bold text-sm break-all">
                        {selectedInfo.claudeEmail || '—'}
                      </p>
                      {selectedInfo.claudeEmail && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copy(selectedInfo.claudeEmail!, 'Email')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(selected.created_at)} · {paymentMethodLabel(selected.payment_method)}
                  </p>
                </div>

                {/* Workflow */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Workflow
                  </p>
                  <div className={cn(
                    'grid gap-2 mb-3',
                    selectedInfo.isFullPayment ? 'grid-cols-3' : 'grid-cols-2'
                  )}>
                    {stagesForPaymentMode(selectedInfo.paymentMode).map((stage) => {
                      const visible = stagesForPaymentMode(selectedInfo.paymentMode);
                      const stageIdx = visible.indexOf(selectedInfo.stage);
                      const idx = visible.indexOf(stage);
                      const done = stageIdx >= 0 && idx <= stageIdx;
                      const current = stage === selectedInfo.stage;
                      return (
                        <div
                          key={stage}
                          className={cn(
                            'p-2 rounded-xl border text-center text-[10px] font-bold uppercase',
                            current
                              ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                              : done
                                ? 'border-green-500/30 bg-green-500/5 text-green-500'
                                : 'border-border text-muted-foreground'
                          )}
                        >
                          {claudeStageLabel(stage, selectedInfo.paymentMode)}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      className="h-10 font-bold border-orange-500/30"
                      disabled={updatingId === selected.id || selectedInfo.stage === 'deposit_verified' || selectedInfo.stage === 'activated' || selectedInfo.stage === 'balance_paid'}
                      onClick={() => handleStageChange(selected, 'deposit_verified')}
                    >
                      {updatingId === selected.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-4 h-4 mr-2" />
                      )}
                      {selectedInfo.isFullPayment ? 'Mark payment verified' : 'Mark deposit verified'}
                    </Button>
                    {!selectedInfo.isFullPayment && (
                      <Button
                        variant="outline"
                        className="h-10 font-bold border-orange-500/30"
                        disabled={
                          updatingId === selected.id ||
                          selectedInfo.stage === 'balance_paid' ||
                          selectedInfo.stage === 'activated' ||
                          selectedInfo.stage === 'deposit_pending'
                        }
                        onClick={() => handleStageChange(selected, 'balance_paid')}
                      >
                        {updatingId === selected.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wallet className="w-4 h-4 mr-2" />
                        )}
                        Mark balance paid
                      </Button>
                    )}
                    <Button
                      className="h-10 font-bold bg-orange-500 hover:bg-orange-400 text-white"
                      disabled={updatingId === selected.id || selectedInfo.stage === 'activated'}
                      onClick={() => handleStageChange(selected, 'activated')}
                    >
                      {updatingId === selected.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Mark activated + invite sent
                    </Button>
                  </div>
                </div>

                {/* Proof */}
                {selected.payment_proof_url && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Payment proof
                    </p>
                    {loadingProof ? (
                      <div className="h-16 rounded-xl bg-secondary animate-pulse" />
                    ) : proofHref ? (
                      <a
                        href={proofHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20 hover:bg-success/10"
                      >
                        <ImageIcon className="w-5 h-5 text-success" />
                        <span className="text-sm font-bold text-success">View receipt</span>
                        <ExternalLink className="w-4 h-4 text-success/60 ml-auto" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Could not load proof URL</p>
                    )}
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Notes
                    </p>
                    <pre className="text-xs whitespace-pre-wrap break-words p-3 rounded-xl bg-secondary/40 border border-border font-mono text-muted-foreground max-h-40 overflow-y-auto">
                      {selected.notes}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <Button variant="whatsapp" className="flex-1 font-bold" asChild>
                      <a
                        href={`https://wa.me/${selected.customer_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi ${selected.customer_name}! Regarding your Claude pre-order ${selected.order_number}:`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/orders">All orders</Link>
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full font-bold"
                    onClick={() => setOrderToDelete(selected)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete this order
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={() => !isDeleting && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Claude order?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Permanently delete{' '}
                <strong className="text-foreground font-mono">{orderToDelete?.order_number}</strong>
                {orderToDelete?.customer_name ? (
                  <>
                    {' '}
                    for <strong className="text-foreground">{orderToDelete.customer_name}</strong>
                  </>
                ) : null}
                ?
              </span>
              <span className="block text-destructive/90">
                This cannot be undone. Order items and linked payment proof (if stored) will be removed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteOrder();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function ClaudeOrderCard({
  order,
  info,
  updating,
  onOpen,
  onStage,
  onCopy,
  onDelete,
}: {
  order: Order;
  info: ClaudePreOrderInfo;
  updating: boolean;
  onOpen: () => void;
  onStage: (order: Order, stage: ClaudeWorkflowStage) => void;
  onCopy: (text: string, label: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card hover:border-orange-500/30 transition-colors overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onCopy(order.order_number, 'Order ID')}
                className="font-mono text-sm font-black text-foreground hover:text-orange-400"
              >
                {order.order_number}
              </button>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
                  STAGE_COLORS[info.stage]
                )}
              >
                {claudeStageLabel(info.stage, info.paymentMode)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/25">
                {info.plan}
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
                info.isFullPayment
                  ? 'bg-green-500/15 text-green-500 border-green-500/30'
                  : 'bg-secondary text-muted-foreground border-border'
              )}>
                {info.isFullPayment ? 'FULL PAY' : '50% RESERVE'}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground">{order.customer_name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {order.customer_whatsapp}
              </span>
              {info.claudeEmail && (
                <span className="flex items-center gap-1 text-orange-400/90 font-mono">
                  <Mail className="w-3 h-3" />
                  {info.claudeEmail}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(order.created_at)}
              {order.payment_method === 'bank_transfer' && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Building2 className="w-3 h-3" /> Bank
                </span>
              )}
              {order.payment_method === 'card' && (
                <span className="inline-flex items-center gap-1 ml-2 text-purple-500">
                  Card
                </span>
              )}
              {order.payment_method === 'upi' && (
                <span className="inline-flex items-center gap-1 ml-2">UPI</span>
              )}
              {order.payment_method === 'binance_usdt' && (
                <span className="inline-flex items-center gap-1 ml-2">Binance</span>
              )}
              {order.payment_method === 'crypto_onchain' && (
                <span className="inline-flex items-center gap-1 ml-2">Crypto</span>
              )}
              {order.payment_proof_url && (
                <span className="text-success font-bold ml-2">· Proof ✓</span>
              )}
            </p>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <div className="text-left lg:text-right">
              <p className="text-[10px] font-bold uppercase text-orange-400">
                {info.isFullPayment ? 'Paid' : 'Deposit paid'}
              </p>
              <p className="text-lg font-black text-foreground">{formatLkrAdmin(info.deposit)}</p>
              <p className="text-[10px] text-muted-foreground">
                Full {formatLkrAdmin(info.fullPrice)}
                {!info.isFullPayment && ` · Due ${formatLkrAdmin(info.remaining)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
          <Button size="sm" variant="outline" className="h-9 font-bold" onClick={onOpen}>
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Open
          </Button>
          <Button size="sm" variant="outline" className="h-9" asChild>
            <a
              href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-success" />
              Chat
            </a>
          </Button>
          {info.stage === 'deposit_pending' && (
            <Button
              size="sm"
              className="h-9 font-bold bg-orange-500 hover:bg-orange-400 text-white"
              disabled={updating}
              onClick={() => onStage(order, 'deposit_verified')}
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5 mr-1" />}
              {info.isFullPayment ? 'Verify payment' : 'Verify deposit'}
            </Button>
          )}
          {info.stage === 'deposit_verified' && !info.isFullPayment && (
            <Button
              size="sm"
              className="h-9 font-bold bg-orange-500 hover:bg-orange-400 text-white"
              disabled={updating}
              onClick={() => onStage(order, 'balance_paid')}
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5 mr-1" />}
              Balance paid
            </Button>
          )}
          {(info.stage === 'balance_paid' || info.stage === 'deposit_verified') && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 font-bold border-green-500/40 text-green-500"
              disabled={updating}
              onClick={() => onStage(order, 'activated')}
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              Activated
            </Button>
          )}
          {info.stage === 'deposit_pending' && !order.payment_proof_url && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning px-2">
              <AlertTriangle className="w-3 h-3" /> No proof
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminClaude;

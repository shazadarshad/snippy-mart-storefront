import { useEffect, useState } from 'react';
import { Search, Eye, MessageCircle, Loader2, RefreshCw, Trash2, Building2, Bitcoin, ExternalLink, Image as ImageIcon, FileText, Globe, Clock, ShieldCheck, User, CreditCard, ChevronRight, LayoutList, Fingerprint, X, ShieldAlert, Monitor, Cpu, MapPin, Activity, Package, CheckCircle2, Copy, Zap, Mail, Wallet, BadgeCheck, XCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { useOrders, useUpdateOrderStatus, useDeleteOrder, useDeleteOrderProof, type Order, type OrderStatus } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { cn, formatDateTime } from '@/lib/utils';
import { useInventoryAccounts, useManualAssignOrder } from '@/hooks/useInventory';
import {
  useDeliverOrderViaReseller,
  useOrderResellerDeliveryLog,
  summarizeDeliverResult,
} from '@/hooks/useResellerApi';
import {
  AdminWhatsAppActions,
  openOrderWhatsApp,
} from '@/components/admin/AdminWhatsAppActions';
import { formatWhatsAppDisplay } from '@/lib/phoneWhatsApp';
import {
  applyClaudeWorkflowToNotes,
  claudeStageLabel,
  claudeStageOrder,
  formatLkrAdmin,
  isClaudePreOrder,
  parseClaudePreOrder,
  statusForClaudeStage,
  type ClaudeWorkflowStage,
} from '@/lib/claudePreorder';
import {
  ORDER_STATUS_ADMIN_OPTIONS,
  adminStatusLabel,
  getDefaultStatusMessage,
  getOrderStatusDisplay,
} from '@/lib/orderStatus';

// Sub-component for Manual Assignment
const ManualAssignmentPanel = ({ order }: { order: Order }) => {
  // Try to guess service type from order items
  const initialServiceType = order.order_items?.[0]?.product_name.split(' ')[0] || '';
  const [serviceFilter, setServiceFilter] = useState(initialServiceType);
  const { data: accounts = [], isLoading } = useInventoryAccounts(serviceFilter);
  const assignMutation = useManualAssignOrder();
  const { toast } = useToast();

  const handleAssign = async (accountId: string) => {
    if (!confirm('Confirm assignment? This will mark order as completed and send credentials.')) return;

    try {
      await assignMutation.mutateAsync({ orderId: order.id, accountId });
      toast({ title: "Assigned Successfully", description: "Order marked as completed." });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Filter Service (e.g. Cursor, Netflix)"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="h-9 bg-background"
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : accounts.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No available accounts found matching "{serviceFilter}"</div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between hover:border-primary/50 transition-colors">
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-foreground truncate">{acc.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="uppercase">{acc.service_type}</span>
                  <span>•</span>
                  <span>{acc.current_users}/{acc.max_users} Users</span>
                </div>
              </div>
              <Button size="sm" variant="hero" onClick={() => handleAssign(acc.id)} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? '...' : 'Assign'}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'claude' | 'standard'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isUpdatingClaudeStage, setIsUpdatingClaudeStage] = useState(false);

  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const deleteProof = useDeleteOrderProof();
  const deliverReseller = useDeliverOrderViaReseller();
  const {
    data: orderDeliveryLog = [],
    refetch: refetchDeliveryLog,
    isLoading: deliveryLogLoading,
  } = useOrderResellerDeliveryLog(selectedOrder?.id);

  const [statusUpdate, setStatusUpdate] = useState<{ order: Order; newStatus: OrderStatus; message: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [paymentProofHref, setPaymentProofHref] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const claude = parseClaudePreOrder(order);
    const matchesSearch =
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_whatsapp.includes(searchQuery) ||
      (claude?.claudeEmail || '').toLowerCase().includes(q) ||
      (order.notes || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const isClaude = isClaudePreOrder(order);
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'claude' && isClaude) ||
      (typeFilter === 'standard' && !isClaude);
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    return getOrderStatusDisplay(status).color;
  };

  const getCountryFlag = (country: string | null) => {
    if (!country) return '🌍';
    const countryLower = country.toLowerCase();
    const flagMap: Record<string, string> = {
      'united states': '🇺🇸',
      'usa': '🇺🇸',
      'us': '🇺🇸',
      'sri lanka': '🇱🇰',
      'india': '🇮🇳',
      'united kingdom': '🇬🇧',
      'uk': '🇬🇧',
      'canada': '🇨🇦',
      'australia': '🇦🇺',
      'germany': '🇩🇪',
      'france': '🇫🇷',
      'japan': '🇯🇵',
      'china': '🇨🇳',
      'pakistan': '🇵🇰',
      'bangladesh': '🇧🇩',
      'uae': '🇦🇪',
      'saudi arabia': '🇸🇦',
      'singapore': '🇸🇬',
      'malaysia': '🇲🇾',
      'unknown': '🌍',
    };
    return flagMap[countryLower] || '🌍';
  };


  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const refundedCount = orders.filter((o) => o.status === 'refunded').length;
  const claudeOrders = orders.filter((o) => isClaudePreOrder(o));
  const claudeCount = claudeOrders.length;
  const claudeActiveCount = claudeOrders.filter((o) => {
    const stage = parseClaudePreOrder(o)?.stage;
    return stage && stage !== 'activated';
  }).length;

  const handleClaudeStageChange = async (order: Order, stage: ClaudeWorkflowStage) => {
    setIsUpdatingClaudeStage(true);
    try {
      const claudeInfo = parseClaudePreOrder(order);
      const mode = claudeInfo?.paymentMode || 'reserve';
      const nextNotes = applyClaudeWorkflowToNotes(order.notes, stage);
      const nextStatus = statusForClaudeStage(stage, mode);

      const updates: Record<string, unknown> = {
        notes: nextNotes,
        updated_at: new Date().toISOString(),
      };
      if (nextStatus) updates.status = nextStatus;

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)
        .select(`
          *,
          order_items (
            *,
            products (
              manual_fulfillment
            )
          )
        `)
        .single();

      if (error) throw error;

      // Notify customer on meaningful stage jumps
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
                    : 'Your Claude deposit was verified. Remaining balance is due before activation.'
                  : stage === 'balance_paid'
                    ? 'Balance payment received for your Claude order. Activation is next.'
                    : stage === 'activated'
                      ? 'Your Claude Team seat has been activated — check your email for the workspace invite.'
                      : `Your Claude order status is now: ${claudeStageLabel(stage, mode)}.`,
            },
          });
        } catch (notifyErr) {
          console.warn('Claude stage notification failed', notifyErr);
        }
      }

      toast({
        title: 'Claude workflow updated',
        description: `${order.order_number} → ${claudeStageLabel(stage, mode)}`,
      });

      if (selectedOrder?.id === order.id && data) {
        setSelectedOrder(data as unknown as Order);
      }
      refetch();
    } catch (e: any) {
      toast({
        title: 'Failed to update Claude stage',
        description: e.message || 'Could not save workflow stage',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingClaudeStage(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setStatusUpdate({
      order,
      newStatus,
      message: getDefaultStatusMessage(newStatus),
    });
  };

  const confirmStatusChange = async () => {
    if (!statusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      // 1. Update Database (+ auto-deliver if → processing)
      const result = await updateStatus.mutateAsync({
        orderId: statusUpdate.order.id,
        status: statusUpdate.newStatus,
      });

      // Final status may flip to completed after auto-delivery
      const finalStatus = (result.order?.status || statusUpdate.newStatus) as OrderStatus;

      // 2. Email with FINAL status (not the dialog request if delivery completed the order)
      let emailOk = false;
      try {
        const { error: emailErr } = await supabase.functions.invoke('handle-order-status-change', {
          body: {
            order: { ...statusUpdate.order, ...result.order, status: finalStatus },
            old_order: statusUpdate.order,
            custom_message: statusUpdate.message,
          },
        });
        emailOk = !emailErr;
      } catch {
        emailOk = false;
      }

      const delivery = result?.delivery;
      const counts =
        delivery != null
          ? ` · Auto: ${delivery.delivered ?? 0} ok / ${delivery.failed ?? 0} fail / ${delivery.skipped ?? 0} skip`
          : '';
      const emailNote = emailOk ? ' Email sent.' : ' (email skipped or failed)';

      if (delivery && (delivery.failed || delivery.delivered || delivery.error)) {
        const failLines = (delivery.results || [])
          .filter((r) => r.status === 'failed')
          .map((r) => `${r.product_name || 'Item'}: ${r.error || 'failed'}`);
        const okLines = (delivery.results || [])
          .filter((r) => r.status === 'delivered' || r.status === 'already_delivered')
          .map((r) => r.product_name || 'Item');

        if ((delivery.failed ?? 0) > 0 || delivery.error) {
          toast({
            title: 'Status updated — Auto delivery FAILED',
            description:
              (failLines.join(' · ') ||
                delivery.error ||
                'Reseller delivery failed. Open the order for details.') + counts + emailNote,
            variant: 'destructive',
          });
        } else if ((delivery.delivered ?? 0) > 0) {
          const waOrder = statusUpdate.order;
          toast({
            title: 'Status updated — Auto delivery OK',
            description: `Delivered: ${okLines.join(', ') || delivery.delivered}. → ${adminStatusLabel(finalStatus)}.${counts}${emailNote}`,
            action: (
              <ToastAction
                altText="Message customer on WhatsApp"
                onClick={() => {
                  const ok = openOrderWhatsApp(waOrder, [], 'auto_ready');
                  if (!ok) {
                    toast({
                      title: 'Invalid WhatsApp number',
                      description: 'Open the order and check the phone number.',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                Message customer
              </ToastAction>
            ),
          });
        } else {
          toast({
            title: 'Status updated',
            description: `Order ${statusUpdate.order.order_number} → ${adminStatusLabel(finalStatus)}.${counts}${emailNote}${
              delivery.error ? ` ${delivery.error}` : ''
            }`,
          });
        }
        if (selectedOrder?.id === statusUpdate.order.id) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: finalStatus } : prev,
          );
          refetchDeliveryLog();
        }
      } else {
        toast({
          title: emailOk ? 'Status updated & email sent' : 'Status updated',
          description: `Order ${statusUpdate.order.order_number} → ${adminStatusLabel(finalStatus)}.${emailNote}`,
        });
      }
      setStatusUpdate(null);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder.mutateAsync(orderToDelete.id);
      toast({
        title: 'Order deleted',
        description: `Order ${orderToDelete.order_number} has been deleted`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive',
      });
    } finally {
      setOrderToDelete(null);
    }
  };

  const handleDeleteProof = async (orderId: string, filePath: string) => {
    if (!confirm('Are you sure you want to DISPOSE this payment receipt? This will permanently delete the capture from storage.')) return;

    try {
      await deleteProof.mutateAsync({ orderId, filePath });
      toast({
        title: 'Receipt Disposed',
        description: 'The payment proof has been permanently deleted.',
      });
      // Update local state if needed
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_proof_url: null });
        setPaymentProofHref(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to dispose receipt',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const run = async () => {
      const proof = selectedOrder?.payment_proof_url;
      if (!selectedOrder || !proof) {
        setPaymentProofHref(null);
        return;
      }

      // Backward compatible: older rows may store a full URL
      if (/^https?:\/\//i.test(proof)) {
        setPaymentProofHref(proof);
        return;
      }

      setIsLoadingProof(true);
      try {
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(proof, 60 * 60);

        if (error) throw error;
        setPaymentProofHref(data?.signedUrl ?? null);
      } catch {
        setPaymentProofHref(null);
      } finally {
        setIsLoadingProof(false);
      }
    };

    run();
  }, [selectedOrder]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <p className="text-2xl font-bold text-success">{completedCount}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-2xl font-bold text-destructive">{cancelledCount}</p>
          <p className="text-sm text-muted-foreground">Cancelled</p>
        </div>
        <div className="p-4 rounded-xl bg-muted border border-border">
          <p className="text-2xl font-bold text-muted-foreground">{refundedCount}</p>
          <p className="text-sm text-muted-foreground">Refunded</p>
        </div>
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'claude' ? 'all' : 'claude')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all',
            typeFilter === 'claude'
              ? 'bg-orange-500/15 border-orange-500/40 ring-2 ring-orange-500/30'
              : 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40'
          )}
        >
          <p className="text-2xl font-bold text-orange-400">{claudeCount}</p>
          <p className="text-sm text-muted-foreground">
            Claude pre-orders
            {claudeActiveCount > 0 && (
              <span className="block text-[11px] text-orange-400 font-semibold">{claudeActiveCount} open</span>
            )}
          </p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search orders, Claude email, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-12 bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {ORDER_STATUS_ADMIN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'claude' | 'standard')}>
          <SelectTrigger className="w-full sm:w-44 h-12 bg-card border-border">
            <SelectValue placeholder="Order type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="claude">Claude pre-order</SelectItem>
            <SelectItem value="standard">Standard only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Quick Detail Checker */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-5 rounded-2xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-foreground">Find order</h2>
            <p className="text-[11px] text-muted-foreground">Paste full Order ID</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem('detailedSearch') as HTMLInputElement).value;
            const order = orders.find(o => o.order_number === q || o.order_number === q.trim());
            if (order) setSelectedOrder(order);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            name="detailedSearch"
            placeholder="SNIP-2026-…"
            className="bg-card border-border h-12 text-base font-mono"
            autoComplete="off"
          />
          <Button type="submit" variant="hero" className="h-12 shrink-0 font-bold touch-manipulation">
            Open
          </Button>
        </form>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-medium text-destructive mb-1">Failed to load orders</p>
          <p className="text-sm text-muted-foreground break-words">
            {(error as Error).message || 'Unknown error'}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">Orders will appear here once customers start purchasing.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Desktop/Tablet Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-sm font-bold text-muted-foreground py-4 px-4">Order Details</th>
                  <th className="text-left text-sm font-bold text-muted-foreground py-4 px-4">Fulfillment</th>
                  <th className="text-left text-sm font-bold text-muted-foreground py-4 px-4">Total</th>
                  <th className="text-right text-sm font-bold text-muted-foreground py-4 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const claude = parseClaudePreOrder(order);
                  return (
                  <tr key={order.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                            {claude && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                <Zap className="w-3 h-3" />
                                Claude · {claude.plan}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {order.customer_name}
                          </div>
                          {claude?.claudeEmail && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-orange-400/90 font-mono">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[200px]">{claude.claudeEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="text-base">{getCountryFlag(order.customer_country)}</span>
                            {order.customer_country || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className={`w-44 h-9 text-[11px] font-bold ${getStatusColor(order.status)}`}>
                            <SelectValue placeholder={adminStatusLabel(order.status)} />
                          </SelectTrigger>
                          <SelectContent className="max-w-[280px]">
                            {ORDER_STATUS_ADMIN_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="py-2">
                                <span className="font-bold">{opt.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {adminStatusLabel(order.status)}
                        </p>
                        {claude && (
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">
                            {claudeStageLabel(claude.stage, claude.paymentMode)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-foreground">
                        {order.currency_code && order.currency_rate
                          ? new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: order.currency_code,
                            minimumFractionDigits: (order.currency_code === 'LKR' || order.currency_code === 'INR') ? 0 : 2,
                            maximumFractionDigits: (order.currency_code === 'LKR' || order.currency_code === 'INR') ? 0 : 2
                          }).format(order.total_amount * order.currency_rate)
                          : formatPrice(order.total_amount)
                        }
                      </p>
                      {claude ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[10px] font-bold text-orange-400 uppercase">
                            {claude.isFullPayment ? 'Full pay' : '50% reserve'}
                          </p>
                          {!claude.isFullPayment && claude.remaining != null && (
                            <p className="text-[10px] text-muted-foreground">
                              Due: {formatLkrAdmin(claude.remaining)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1">
                          {order.payment_method === 'bank_transfer' && <Building2 className="w-3 h-3 text-primary" />}
                          {order.payment_method === 'upi' && <Smartphone className="w-3 h-3 text-orange-500" />}
                          {order.payment_method === 'binance_usdt' && <Bitcoin className="w-3 h-3 text-[#F0B90B]" />}
                          {order.payment_method === 'crypto_onchain' && <Wallet className="w-3 h-3 text-violet-500" />}
                          {order.payment_method === 'card' && <CreditCard className="w-3 h-3 text-purple-500" />}
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {order.payment_method === 'card'
                              ? 'CARD'
                              : order.payment_method === 'binance_usdt'
                                ? 'BINANCE'
                                : order.payment_method === 'crypto_onchain'
                                  ? 'CRYPTO'
                                  : order.payment_method === 'bank_transfer'
                                    ? 'BANK'
                                    : order.payment_method === 'upi'
                                      ? 'UPI'
                                      : order.payment_method?.replace(/_/g, ' ') || 'UNPAID'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AdminWhatsAppActions order={order} compact />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setOrderToDelete(order)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View — PWA-friendly cards */}
          <div className="md:hidden space-y-3 px-1 sm:px-0">
            {filteredOrders.map((order) => {
              const claude = parseClaudePreOrder(order);
              return (
              <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-3.5 space-y-3">
                  <button
                    type="button"
                    className="w-full text-left touch-manipulation active:opacity-90"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-black text-foreground">
                            {order.order_number}
                          </span>
                          <div
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}
                          >
                            {adminStatusLabel(order.status)}
                          </div>
                          {claude && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30">
                              <Zap className="w-3 h-3" /> Claude
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5 truncate">
                          <span>{getCountryFlag(order.customer_country)}</span>
                          {order.customer_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-primary text-base tabular-nums">
                          {order.currency_code && order.currency_rate
                            ? new Intl.NumberFormat(undefined, {
                                style: 'currency',
                                currency: order.currency_code,
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(order.total_amount * order.currency_rate)
                            : formatPrice(order.total_amount)}
                        </p>
                        <p className="text-[9px] font-black uppercase text-muted-foreground mt-0.5">
                          {order.payment_method?.replace(/_/g, ' ') || 'unpaid'}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger
                        className={`h-11 text-xs font-bold ${getStatusColor(order.status)} bg-opacity-10 touch-manipulation`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_ADMIN_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-sm py-3">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-11 text-xs font-bold touch-manipulation"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Open
                      </Button>
                      <div className="h-11 w-11 flex items-center justify-center rounded-md border border-success/25 bg-success/5">
                        <AdminWhatsAppActions order={order} compact />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 w-11 p-0 text-destructive border-destructive/20 touch-manipulation"
                        onClick={() => setOrderToDelete(order)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Super Detailed Order Inspector */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border sm:border-none rounded-2xl sm:rounded-3xl shadow-2xl w-[min(100vw-1rem,42rem)] sm:w-full max-h-[min(92dvh,900px)]">
          {selectedOrder && (
            <div className="flex flex-col max-h-[min(92dvh,900px)]">
              {/* Modal Header */}
              <div className={cn(
                'p-5 md:p-8 text-primary-foreground relative',
                isClaudePreOrder(selectedOrder)
                  ? 'bg-gradient-to-br from-orange-600 to-amber-600'
                  : 'bg-primary'
              )}>
                <div className="flex items-center gap-2 mb-2 opacity-80 flex-wrap">
                  {isClaudePreOrder(selectedOrder) ? (
                    <>
                      <Zap className="w-4 h-4 text-primary-foreground shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Claude Pre-Order</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-primary-foreground shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Audit Report</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl md:text-3xl font-display font-black mb-1 truncate pr-20">{selectedOrder.order_number}</h2>
                <p className="text-primary-foreground/60 text-[10px] md:text-sm font-medium">
                  {isClaudePreOrder(selectedOrder)
                    ? `${parseClaudePreOrder(selectedOrder)?.plan || 'Team'} · ${claudeStageLabel(parseClaudePreOrder(selectedOrder)!.stage)}`
                    : 'Secured Entry • Verified System'}
                </p>
                <div className={`absolute top-4 right-4 md:top-6 md:right-6 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-xs font-black uppercase border-2 ${getStatusColor(selectedOrder.status)} bg-white shadow-xl`}>
                  {adminStatusLabel(selectedOrder.status)}
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                {(() => {
                  const claude = parseClaudePreOrder(selectedOrder);
                  if (!claude) return null;
                  const stageIdx = claudeStageOrder.indexOf(claude.stage);
                  return (
                    <div className="rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-background to-amber-500/5 p-5 md:p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Claude pre-order</p>
                            <h3 className="text-lg font-black text-foreground">
                              {claude.productName || 'Claude Team'} · {claude.plan}
                            </h3>
                            <p className="text-xs text-muted-foreground">Activate on customer&apos;s own Claude account</p>
                          </div>
                        </div>
                        <span className="self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {claudeStageLabel(claude.stage)}
                        </span>
                      </div>

                      {/* Money breakdown */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-2xl bg-background/60 border border-border">
                          <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Full price</p>
                          <p className="text-sm font-black text-foreground">{formatLkrAdmin(claude.fullPrice)}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25">
                          <p className="text-[9px] font-black uppercase tracking-wider text-orange-400 mb-1">
                            {claude.isFullPayment ? 'Paid now' : 'Deposit 50%'}
                          </p>
                          <p className="text-sm font-black text-foreground">{formatLkrAdmin(claude.deposit)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Order total paid</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-background/60 border border-border">
                          <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                            {claude.isFullPayment ? 'Balance' : 'Balance 50%'}
                          </p>
                          <p className="text-sm font-black text-foreground">{formatLkrAdmin(claude.remaining)}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {claude.isFullPayment ? 'None' : 'Due at activation'}
                          </p>
                        </div>
                      </div>

                      {/* Claude email */}
                      <div className="p-4 rounded-2xl bg-background/70 border border-orange-500/20">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Claude account email
                            </p>
                            <p className="font-mono text-sm font-bold text-foreground break-all select-all">
                              {claude.claudeEmail || '— not provided —'}
                            </p>
                          </div>
                          {claude.claudeEmail && (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="shrink-0 h-9 w-9"
                              onClick={() => {
                                navigator.clipboard.writeText(claude.claudeEmail!);
                                toast({ title: 'Copied', description: 'Claude email copied' });
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Workflow steps */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                          Workflow
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          {claudeStageOrder.map((stage, idx) => {
                            const done = idx <= stageIdx;
                            const current = stage === claude.stage;
                            return (
                              <div
                                key={stage}
                                className={cn(
                                  'p-2.5 rounded-xl border text-center transition-colors',
                                  current
                                    ? 'border-orange-500 bg-orange-500/15'
                                    : done
                                      ? 'border-green-500/30 bg-green-500/5'
                                      : 'border-border bg-secondary/30'
                                )}
                              >
                                <div className="flex justify-center mb-1">
                                  {done ? (
                                    <CheckCircle2 className={cn('w-4 h-4', current ? 'text-orange-400' : 'text-green-500')} />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-muted-foreground/40" />
                                  )}
                                </div>
                                <p className={cn(
                                  'text-[9px] font-black uppercase tracking-wide leading-tight',
                                  current ? 'text-orange-300' : done ? 'text-green-500' : 'text-muted-foreground'
                                )}>
                                  {claudeStageLabel(stage)}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 font-bold border-orange-500/30 hover:bg-orange-500/10"
                            disabled={isUpdatingClaudeStage || claude.stage === 'deposit_verified' || claude.stage === 'activated'}
                            onClick={() => handleClaudeStageChange(selectedOrder, 'deposit_verified')}
                          >
                            {isUpdatingClaudeStage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BadgeCheck className="w-4 h-4 mr-2" />}
                            Mark deposit verified
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 font-bold border-orange-500/30 hover:bg-orange-500/10"
                            disabled={isUpdatingClaudeStage || claude.stage === 'balance_paid' || claude.stage === 'activated' || claude.stage === 'deposit_pending'}
                            onClick={() => handleClaudeStageChange(selectedOrder, 'balance_paid')}
                          >
                            {isUpdatingClaudeStage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                            Mark balance paid
                          </Button>
                          <Button
                            type="button"
                            className="h-10 font-bold bg-orange-500 hover:bg-orange-400 text-white sm:col-span-2"
                            disabled={isUpdatingClaudeStage || claude.stage === 'activated'}
                            onClick={() => handleClaudeStageChange(selectedOrder, 'activated')}
                          >
                            {isUpdatingClaudeStage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            Mark seat activated
                          </Button>
                          {claude.stage !== 'deposit_pending' && claude.stage !== 'activated' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="sm:col-span-2 text-xs text-muted-foreground"
                              disabled={isUpdatingClaudeStage}
                              onClick={() => handleClaudeStageChange(selectedOrder, 'deposit_pending')}
                            >
                              Reset to deposit pending
                            </Button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                          Stage updates also set order status (pending → processing → shipping → completed) and try to email the customer when status changes.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Section: Customer Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-primary">
                        <User className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-wider">Customer Profile</h3>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Legal Name</p>
                          <p className="text-sm font-bold text-foreground">{selectedOrder.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact Channel</p>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2 break-all">
                            {formatWhatsAppDisplay(selectedOrder.customer_whatsapp)}
                            <MessageCircle className="w-3.5 h-3.5 text-success shrink-0" />
                          </p>
                          {selectedOrder.customer_whatsapp &&
                            formatWhatsAppDisplay(selectedOrder.customer_whatsapp) !==
                              selectedOrder.customer_whatsapp && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Entered: {selectedOrder.customer_whatsapp}
                              </p>
                            )}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Origin Country</p>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="text-xl">{getCountryFlag(selectedOrder.customer_country)}</span>
                            {selectedOrder.customer_country || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Notes Section - Secure Display */}
                    {(selectedOrder as any).affiliate_code && (
                      <div className="rounded-xl bg-violet-500/10 border border-violet-500/25 p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                            Affiliate
                          </p>
                          <p className="font-mono font-bold text-foreground">
                            {(selectedOrder as any).affiliate_code}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Commission on complete
                        </span>
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-warning">
                          <FileText className="w-4 h-4" />
                          <h3 className="text-xs font-black uppercase tracking-wider">Customer Notes</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20 border-dashed">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] text-warning uppercase font-bold mb-2">⚠️ Sensitive Information</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words font-medium leading-relaxed">
                                {selectedOrder.notes}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-3 italic">
                                This may contain account credentials or personal information. Handle securely.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-3 text-primary">
                        <CreditCard className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-wider">Financial Data</h3>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              {isClaudePreOrder(selectedOrder) ? 'Deposit paid (order total)' : 'Total Payload'}
                            </p>
                            <p className="text-xl font-black text-foreground">
                              {selectedOrder.currency_code && selectedOrder.currency_rate
                                ? new Intl.NumberFormat(undefined, {
                                  style: 'currency',
                                  currency: selectedOrder.currency_code,
                                  minimumFractionDigits: (selectedOrder.currency_code === 'LKR' || selectedOrder.currency_code === 'INR') ? 0 : 2,
                                  maximumFractionDigits: (selectedOrder.currency_code === 'LKR' || selectedOrder.currency_code === 'INR') ? 0 : 2
                                }).format(selectedOrder.total_amount * selectedOrder.currency_rate)
                                : formatPrice(selectedOrder.total_amount)
                              }
                            </p>
                            {(() => {
                              const c = parseClaudePreOrder(selectedOrder);
                              if (!c || c.fullPrice == null) return null;
                              return (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Full plan {formatLkrAdmin(c.fullPrice)} · Balance {formatLkrAdmin(c.remaining)}
                                </p>
                              );
                            })()}
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedOrder.status === 'completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                            {selectedOrder.status === 'completed' ? 'Success' : 'Pending'}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Payment Method</p>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedOrder.payment_method === 'binance_usdt' ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-[#F0B90B]">
                                <Bitcoin className="w-4 h-4" /> Binance Pay
                              </div>
                            ) : selectedOrder.payment_method === 'crypto_onchain' ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-violet-500">
                                <Wallet className="w-4 h-4" /> Crypto Wallet
                              </div>
                            ) : selectedOrder.payment_method === 'card' ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-purple-500">
                                <CreditCard className="w-4 h-4" /> Card Payment
                              </div>
                            ) : selectedOrder.payment_method === 'upi' ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
                                <Smartphone className="w-4 h-4" /> UPI
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                <Building2 className="w-4 h-4" /> Bank Transfer
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-primary">
                        <LayoutList className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-wider">Manifest Items</h3>
                      </div>
                      <div className="space-y-2">
                        {selectedOrder.order_items?.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl bg-secondary/30 border border-border flex flex-col gap-2 group hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-center w-full">
                              <div>
                                <p className="text-xs font-black text-foreground">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-primary">
                                  {item.plan_name}
                                  {item.variant_name && <span className="text-muted-foreground opacity-80"> / {item.variant_name}</span>}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-foreground">x{item.quantity}</p>
                                <p className="text-[10px] text-muted-foreground">{formatPrice(item.unit_price)}</p>
                              </div>
                            </div>

                            {/* Display Customer Credentials if any */}
                            {item.customer_credentials && (
                              <div className="w-full pt-2 mt-1 border-t border-border/50 grid grid-cols-1 gap-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Customer Provided Details:</p>
                                {item.customer_credentials.email && (
                                  <div className="bg-background/50 p-2 rounded border border-border/50 flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                                      {item.customer_credentials.service === 'claude' || item.customer_credentials.preorder
                                        ? 'Claude account email'
                                        : 'Email / Login'}
                                    </span>
                                    <span className="font-mono text-xs select-all">{item.customer_credentials.email}</span>
                                  </div>
                                )}
                                {item.customer_credentials.password && (
                                  <div className="bg-background/50 p-2 rounded border border-border/50 flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Password</span>
                                    <span className="font-mono text-xs select-all text-foreground">{item.customer_credentials.password}</span>
                                  </div>
                                )}
                                {(item.customer_credentials.preorder || item.customer_credentials.service === 'claude') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.customer_credentials.full_price != null && (
                                      <div className="bg-orange-500/5 p-2 rounded border border-orange-500/20 flex flex-col">
                                        <span className="text-[9px] uppercase tracking-wider text-orange-400">Full price</span>
                                        <span className="text-xs font-bold">{formatLkrAdmin(Number(item.customer_credentials.full_price))}</span>
                                      </div>
                                    )}
                                    {item.customer_credentials.remaining_amount != null && (
                                      <div className="bg-orange-500/5 p-2 rounded border border-orange-500/20 flex flex-col">
                                        <span className="text-[9px] uppercase tracking-wider text-orange-400">Balance due</span>
                                        <span className="text-xs font-bold">{formatLkrAdmin(Number(item.customer_credentials.remaining_amount))}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3 text-primary">
                        <Fingerprint className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-wider">System Metadata</h3>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3 font-mono">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Internal UUID</p>
                          <p className="text-[10px] font-medium text-muted-foreground break-all">{selectedOrder.id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Created Sequence</p>
                          <p className="text-[10px] font-medium text-muted-foreground">{formatDateTime(selectedOrder.created_at)}</p>
                        </div>
                        {selectedOrder.binance_id && (
                          <div>
                            <p className="text-[10px] text-[#F0B90B] uppercase font-black">Verify Binance ID</p>
                            <p className="text-sm font-black text-[#F0B90B]">{selectedOrder.binance_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reseller API auto-delivery + per-order errors */}
                {!isClaudePreOrder(selectedOrder) && (
                  <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                          Reseller API delivery
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => refetchDeliveryLog()}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Refresh log
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-runs when status → <span className="font-semibold">Payment confirmed</span>{' '}
                      if Enable auto-delivery is ON. This button always works with your API key
                      (manual override — does not re-charge already delivered lines).
                    </p>

                    {/* Delivery log for THIS order */}
                    {deliveryLogLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading delivery log…
                      </div>
                    ) : orderDeliveryLog.length > 0 ? (
                      <div className="space-y-2">
                        {orderDeliveryLog.map((d) => {
                          const failed = d.status === 'failed';
                          const ok = d.status === 'delivered' && !!String(d.delivered_data || '').trim();
                          const emptyOk =
                            d.status === 'delivered' && !String(d.delivered_data || '').trim();
                          return (
                            <div
                              key={d.id}
                              className={cn(
                                'p-3 rounded-xl border text-sm',
                                failed && 'bg-destructive/10 border-destructive/30',
                                ok && 'bg-emerald-500/10 border-emerald-500/25',
                                emptyOk && 'bg-amber-500/10 border-amber-500/30',
                                !failed && !ok && !emptyOk && 'bg-secondary/40 border-border',
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {failed || emptyOk ? (
                                  failed ? (
                                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  )
                                ) : ok ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-foreground">
                                      {d.product_name || 'Product'}{' '}
                                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                        {emptyOk ? 'empty payload' : d.status}
                                      </span>
                                    </p>
                                    {(failed && d.error_message) || (ok && d.delivered_data) ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 shrink-0"
                                        onClick={() => {
                                          const text = failed
                                            ? d.error_message || ''
                                            : d.delivered_data || '';
                                          navigator.clipboard.writeText(text);
                                          toast({
                                            title: 'Copied',
                                            description: failed ? 'Error copied' : 'Delivery copied',
                                          });
                                        }}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </Button>
                                    ) : null}
                                  </div>
                                  {failed && d.error_message && (
                                    <p className="text-destructive font-semibold text-xs break-words">
                                      {d.error_message}
                                    </p>
                                  )}
                                  {emptyOk && (
                                    <p className="text-amber-700 dark:text-amber-400 font-semibold text-xs">
                                      Marked delivered but no code/link saved. Click Deliver to retry.
                                    </p>
                                  )}
                                  {ok && d.delivered_data && (
                                    <p className="font-mono text-xs break-all text-foreground">
                                      {d.delivered_data}
                                    </p>
                                  )}
                                  {d.vendor_order_id && (
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      Vendor: {d.vendor_order_id}
                                      {d.amount != null ? ` · $${Number(d.amount).toFixed(2)}` : ''}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatDateTime(d.updated_at || d.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          No delivery attempts yet. Set status to{' '}
                          <strong>Payment confirmed</strong> (with auto-delivery ON) or click
                          deliver below.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-10 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={deliverReseller.isPending}
                        onClick={async () => {
                          try {
                            const res = await deliverReseller.mutateAsync({
                              orderId: selectedOrder.id,
                              bypassEnabled: true,
                            });
                            const delivered = res.delivered ?? 0;
                            const failed = res.failed ?? 0;
                            const skipped = res.skipped ?? 0;
                            const summary = summarizeDeliverResult(res);
                            toast({
                              title:
                                failed > 0 && delivered === 0
                                  ? 'Reseller delivery FAILED'
                                  : failed > 0
                                    ? 'Partial delivery'
                                    : delivered > 0
                                      ? 'Reseller delivery done'
                                      : 'No items delivered',
                              description: `${summary} (${delivered} ok / ${failed} fail / ${skipped} skip)`,
                              variant: failed > 0 ? 'destructive' : 'default',
                              action:
                                delivered > 0 ? (
                                  <ToastAction
                                    altText="Message customer on WhatsApp"
                                    onClick={() => {
                                      openOrderWhatsApp(
                                        selectedOrder,
                                        orderDeliveryLog as any,
                                        'auto_ready',
                                      );
                                    }}
                                  >
                                    Message customer
                                  </ToastAction>
                                ) : undefined,
                            });
                            refetch();
                            refetchDeliveryLog();
                            if (res.order_status) {
                              setSelectedOrder((prev) =>
                                prev
                                  ? { ...prev, status: res.order_status as OrderStatus }
                                  : prev,
                              );
                            }
                          } catch (e: any) {
                            toast({
                              title: 'Reseller delivery failed',
                              description: e.message,
                              variant: 'destructive',
                            });
                            refetchDeliveryLog();
                          }
                        }}
                      >
                        {deliverReseller.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Deliver via Reseller API
                      </Button>
                    </div>
                  </div>
                )}

                {/* Section: Fulfillment Console (Manual Assignment) — skip for Claude (own-account activation) */}
                {(() => {
                  if (isClaudePreOrder(selectedOrder)) {
                    return (
                      <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/20 border-dashed">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-orange-400" />
                          <div>
                            <p className="text-sm font-bold text-foreground">Claude: own-account activation</p>
                            <p className="text-xs text-muted-foreground">
                              No inventory assignment. Use the Claude workflow above (deposit → balance → activate on their email).
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const needsManualFulfillment = selectedOrder.order_items?.some(
                    item => item.products?.manual_fulfillment !== false
                  );

                  if (!needsManualFulfillment) {
                    return (
                      <div className="bg-secondary/5 p-6 rounded-2xl border border-border border-dashed">
                        <div className="flex items-center gap-3 text-muted-foreground opacity-60">
                          <ShieldAlert className="w-5 h-5" />
                          <div>
                            <p className="text-sm font-bold">Direct Activation Service</p>
                            <p className="text-xs">No manual inventory assignment required for this product type.</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-secondary/10 p-6 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Fulfillment Console</h3>
                      </div>

                      {/* Check if already assigned or completed */}
                      {selectedOrder.status === 'completed' || selectedOrder.status === 'delivered' ? (
                        <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <div>
                              <p className="text-sm font-bold text-success">Order Fulfilled</p>
                              <p className="text-xs text-muted-foreground">Credentials have been assigned.</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={() => {
                              const link = `${window.location.origin}/track-order?ref=${selectedOrder.id}`;
                              navigator.clipboard.writeText(link);
                              toast({ title: "Secure Link Copied", description: "Send this link to the customer." });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                            Copy Secure Link
                          </Button>
                        </div>
                      ) : (
                        <ManualAssignmentPanel order={selectedOrder} />
                      )}
                    </div>
                  );
                })()}

                {/* Section: Assets & Communications */}
                <div className="space-y-4">
                  {selectedOrder.payment_proof_url && (
                    <div className="group">
                      <p className="text-[10px] text-muted-foreground uppercase font-black mb-2 tracking-widest pl-1">Compliance Proof</p>
                      {isLoadingProof ? (
                        <div className="h-20 rounded-2xl bg-secondary animate-pulse flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="relative group">
                          <a
                            href={paymentProofHref || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-5 rounded-2xl bg-success/5 border border-success/20 hover:bg-success/10 transition-all border-dashed"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-black text-success">Transaction Proof Available</p>
                                  <p className="text-xs text-success/60">Click to expand audit capture</p>
                                </div>
                              </div>
                              <ExternalLink className="w-5 h-5 text-success/40 group-hover:text-success transition-colors" />
                            </div>
                          </a>

                          {/* Disposal Button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-3 -right-3 h-8 px-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteProof(selectedOrder.id, selectedOrder.payment_proof_url!);
                            }}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Dispose Receipt
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mb-2 tracking-widest pl-1">Customer Dispatch Notes</p>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border italic text-sm text-foreground">
                        "{selectedOrder.notes}"
                      </div>
                    </div>
                  )}

                  {/* Enterprise Security Intelligence */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-black mb-3 tracking-widest pl-1">Security Intelligence</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Monitor className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Environment</span>
                        </div>
                        <p className="text-[10px] font-bold text-foreground truncate" title={selectedOrder.user_agent || 'Unknown'}>
                          {selectedOrder.user_agent ? selectedOrder.user_agent.split(')')[0] + ')' : 'Browser Fingerprint'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-success/5 border border-success/10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Activity className="w-3.5 h-3.5 text-success" />
                          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Network Node</span>
                        </div>
                        <p className="text-[10px] font-bold text-foreground">
                          {selectedOrder.client_ip || 'Masked (SECURE)'}
                        </p>
                      </div>
                      {selectedOrder.security_metadata && (
                        <>
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Cpu className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Hardware Pulse</span>
                            </div>
                            <p className="text-[10px] font-bold text-foreground">
                              {selectedOrder.security_metadata.platform} • {selectedOrder.security_metadata.hardware_concurrency} Core
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                            <div className="flex items-center gap-2 mb-1.5">
                              <MapPin className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Geolocation</span>
                            </div>
                            <p className="text-[10px] font-bold text-foreground">
                              {selectedOrder.customer_country || 'Unknown'} ({selectedOrder.security_metadata.timezone})
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* WhatsApp + close */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <AdminWhatsAppActions
                    order={selectedOrder}
                    deliveries={orderDeliveryLog as any}
                  />
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full min-h-12 h-12 flex items-center justify-center border-2 touch-manipulation"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <X className="w-5 h-5 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order {orderToDelete?.order_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Confirmation with Message */}
      <Dialog open={!!statusUpdate} onOpenChange={() => !isUpdatingStatus && setStatusUpdate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${isUpdatingStatus ? 'animate-spin' : ''}`} />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              Update <strong>{statusUpdate?.order.order_number}</strong> to{' '}
              <strong>{statusUpdate ? adminStatusLabel(statusUpdate.newStatus) : ''}</strong>?
              This notifies the customer (email when available). Track page will show the new status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {statusUpdate && (
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-sm">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Customer will see
                </p>
                <p className="font-bold text-foreground">
                  {getOrderStatusDisplay(statusUpdate.newStatus).title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getOrderStatusDisplay(statusUpdate.newStatus).description}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status-message">Message for customer (email)</Label>
              <Textarea
                id="status-message"
                placeholder="Type a message to include in the email..."
                value={statusUpdate?.message || ''}
                onChange={(e) => setStatusUpdate(prev => prev ? { ...prev, message: e.target.value } : null)}
                className="min-h-[100px] bg-secondary/30"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStatusUpdate(null)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={confirmStatusChange}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Updating...' : 'Update & Send Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

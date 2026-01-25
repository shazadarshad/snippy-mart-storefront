import { useEffect, useState } from 'react';
import { Search, Eye, MessageCircle, Loader2, RefreshCw, Trash2, Building2, Bitcoin, ExternalLink, Image as ImageIcon, FileText, Globe, Clock, ShieldCheck, User, CreditCard, ChevronRight, LayoutList, Fingerprint, X, ShieldAlert, Monitor, Cpu, MapPin, Activity, Package, CheckCircle2, Copy } from 'lucide-react';
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
import { formatDateTime } from '@/lib/utils';
import { useInventoryAccounts, useManualAssignOrder } from '@/hooks/useInventory';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const deleteProof = useDeleteOrderProof();

  const [statusUpdate, setStatusUpdate] = useState<{ order: Order; newStatus: OrderStatus; message: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [paymentProofHref, setPaymentProofHref] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_whatsapp.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-primary/10 text-primary border-primary/20';
      case 'shipping': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'on_hold': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setStatusUpdate({
      order,
      newStatus,
      message: newStatus === 'completed'
        ? 'Your subscription is ready! Check the details below.'
        : newStatus === 'cancelled'
          ? 'We are sorry, but your payment could not be verified.'
          : `Your order status has been updated to ${newStatus}.`
    });
  };

  const confirmStatusChange = async () => {
    if (!statusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      // 1. Update Database
      await updateStatus.mutateAsync({ orderId: statusUpdate.order.id, status: statusUpdate.newStatus });

      // 2. Trigger Edge Function for Email
      // We do this manually here for immediate feedback, but it also supports Webhooks
      await supabase.functions.invoke('handle-order-status-change', {
        body: {
          order: { ...statusUpdate.order, status: statusUpdate.newStatus },
          old_order: statusUpdate.order,
          custom_message: statusUpdate.message
        }
      });

      toast({
        title: 'Status updated & Email sent',
        description: `Order ${statusUpdate.order.order_number} is now ${statusUpdate.newStatus}.`,
      });
      setStatusUpdate(null);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search orders..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Quick Detail Checker */}
      <div className="mb-8 p-4 md:p-6 rounded-2xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Super Detailed Checker</h2>
            <p className="text-xs text-muted-foreground">Search by full Order ID for maximum details</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem('detailedSearch') as HTMLInputElement).value;
            const order = orders.find(o => o.order_number === q);
            if (order) setSelectedOrder(order);
          }}
          className="flex gap-2"
        >
          <Input
            name="detailedSearch"
            placeholder="Enter full Order ID (e.g., SNIP-2026-000001)"
            className="bg-card border-border h-12"
          />
          <Button type="submit" variant="hero" size="lg">Inspect</Button>
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {order.customer_name}
                          </div>
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
                          <SelectTrigger className={`w-32 h-8 text-[11px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <div className="flex items-center gap-1 mt-1">
                        {order.payment_method === 'bank_transfer' && <Building2 className="w-3 h-3 text-primary" />}
                        {order.payment_method === 'binance_usdt' && <Bitcoin className="w-3 h-3 text-[#F0B90B]" />}
                        {order.payment_method === 'card' && <CreditCard className="w-3 h-3 text-purple-500" />}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {order.payment_method === 'card' ? 'CARD' : order.payment_method?.replace('_', ' ') || 'UNPAID'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" asChild>
                          <a href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setOrderToDelete(order)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View (Card List) */}
          <div className="md:hidden space-y-px bg-border">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-card p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-foreground">{order.order_number}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>{getCountryFlag(order.customer_country)}</span>
                      {order.customer_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                    <div className={`mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-9" onClick={() => setSelectedOrder(order)}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-9 text-success" asChild>
                    <a href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="w-9 h-9 text-destructive" onClick={() => setOrderToDelete(order)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Super Detailed Order Inspector */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-none sm:rounded-3xl shadow-2xl">
          {selectedOrder && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-primary p-6 md:p-8 text-primary-foreground relative">
                <div className="flex items-center gap-3 mb-2 opacity-80">
                  <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Internal Audit Report</span>
                </div>
                <h2 className="text-3xl font-display font-black mb-1">{selectedOrder.order_number}</h2>
                <p className="text-primary-foreground/60 text-sm font-medium">Secured Order Entry • System Verified</p>
                <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 ${getStatusColor(selectedOrder.status)} bg-white shadow-xl`}>
                  {selectedOrder.status}
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                {/* Section: Customer Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            {selectedOrder.customer_whatsapp}
                            <MessageCircle className="w-3.5 h-3.5 text-success" />
                          </p>
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
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Payload</p>
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
                                <Bitcoin className="w-4 h-4" /> Binance USDT
                              </div>
                            ) : selectedOrder.payment_method === 'card' ? (
                              <div className="flex items-center gap-2 text-sm font-bold text-purple-500">
                                <CreditCard className="w-4 h-4" /> Card Payment
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
                          <div key={item.id} className="p-3 rounded-xl bg-secondary/30 border border-border flex justify-between items-center group hover:border-primary/50 transition-colors">
                            <div>
                              <p className="text-xs font-black text-foreground">{item.product_name}</p>
                              <p className="text-[10px] font-bold text-primary">{item.plan_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-foreground">x{item.quantity}</p>
                              <p className="text-[10px] text-muted-foreground">{formatPrice(item.unit_price)}</p>
                            </div>
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

                {/* Section: Fulfillment Console (Manual Assignment) */}
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

                {/* Full Width Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button variant="whatsapp" size="xl" className="flex-1 font-black uppercase text-xs tracking-widest h-14" asChild>
                    <a href={`https://wa.me/${selectedOrder.customer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5 mr-3" />
                      Dispatch Response
                    </a>
                  </Button>
                  <Button variant="outline" size="xl" className="sm:w-14 h-14 flex items-center justify-center p-0 border-2" onClick={() => setSelectedOrder(null)}>
                    <X className="w-6 h-6" />
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
              Update <strong>{statusUpdate?.order.order_number}</strong> to <strong>{statusUpdate?.newStatus}</strong>?
              This will automatically send a notification email to the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-message">Custom message for customer (optional)</Label>
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

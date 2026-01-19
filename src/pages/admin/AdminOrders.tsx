import { useEffect, useState } from 'react';
import { Search, Eye, MessageCircle, Loader2, RefreshCw, Trash2, Building2, Bitcoin, ExternalLink, Image as ImageIcon, FileText, Globe, Clock } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
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
import { formatPrice } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order, type OrderStatus } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

const AdminOrders = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { data: orders = [], isLoading, error, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

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
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const refundedCount = orders.filter((o) => o.status === 'refunded').length;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast({
        title: 'Status updated',
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
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
      setOrderToDelete(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete order',
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Order ID</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Customer</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Products</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Payment</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Date</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Total</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-foreground">{order.order_number}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_whatsapp}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-foreground max-w-[200px] truncate">
                        {order.order_items?.map(item => item.product_name).join(', ') || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {order.payment_method === 'bank_transfer' && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            <Building2 className="w-3 h-3" />
                            Bank
                          </div>
                        )}
                        {order.payment_method === 'binance_usdt' && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F0B90B]/10 text-[#F0B90B] text-xs font-medium">
                            <Bitcoin className="w-3 h-3" />
                            USDT
                          </div>
                        )}
                        {!order.payment_method && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(order.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-foreground">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={`https://wa.me/${order.customer_whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setOrderToDelete(order)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">{selectedOrder.order_number}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{selectedOrder.customer_whatsapp}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchased At</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium text-primary">{formatPrice(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedOrder.customer_country || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-1.5">
                    {selectedOrder.payment_method === 'bank_transfer' && (
                      <>
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">Bank Transfer</span>
                      </>
                    )}
                    {selectedOrder.payment_method === 'binance_usdt' && (
                      <>
                        <Bitcoin className="w-4 h-4 text-[#F0B90B]" />
                        <span className="font-medium">Binance USDT</span>
                      </>
                    )}
                    {!selectedOrder.payment_method && (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item.product_name}</p>
                          {item.plan_name && (
                            <p className="text-xs text-muted-foreground">{item.plan_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(item.total_price)}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.payment_method === 'binance_usdt' && selectedOrder.binance_id && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Binance ID</p>
                  <p className="text-sm p-3 bg-[#F0B90B]/10 rounded-lg font-mono">{selectedOrder.binance_id}</p>
                </div>
              )}

              {selectedOrder.payment_proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>

                  {isLoadingProof ? (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border border-border">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading proof…</span>
                    </div>
                  ) : paymentProofHref ? (
                    <a
                      href={paymentProofHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      {(paymentProofHref.split('?')[0] || '').endsWith('.pdf') ? (
                        <FileText className="w-5 h-5 text-destructive" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-primary" />
                      )}
                      <span className="text-sm font-medium flex-1">View Payment Proof</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ) : (
                    <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">
                        Could not load the proof file (check Storage access).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-3 bg-secondary/50 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <a
                    href={`https://wa.me/${selectedOrder.customer_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Customer
                  </a>
                </Button>
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
    </div>
  );
};

export default AdminOrders;

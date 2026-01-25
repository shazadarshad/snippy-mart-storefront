import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryAccounts, useManualAssignOrder } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle2, Copy, Package, ShieldCheck } from 'lucide-react';
import type { Order } from '@/hooks/useOrders';
import { formatDateTime } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

// Shared component for the panel
const ManualAssignmentPanel = ({ order, onAssignSuccess }: { order: Order, onAssignSuccess?: () => void }) => {
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
            if (onAssignSuccess) onAssignSuccess();
        } catch (e: any) {
            toast({ title: "Failed", description: e.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-medium mb-2">Assign Account for: <span className="font-bold text-foreground">{order.order_number}</span></p>
                <Input
                    placeholder="Filter Service (e.g. Cursor, Netflix)"
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="h-10"
                />
            </div>

            <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar border rounded-md p-2">
                {isLoading ? (
                    <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : accounts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">No available accounts found matching "{serviceFilter}"</div>
                ) : (
                    accounts.map(acc => (
                        <div key={acc.id} className="p-3 rounded-lg bg-secondary/20 border border-border flex items-center justify-between hover:border-primary/50 transition-colors">
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate">{acc.email}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="uppercase font-semibold">{acc.service_type}</span>
                                    <span>•</span>
                                    <span>{acc.current_users}/{acc.max_users} Users</span>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleAssign(acc.id)} disabled={assignMutation.isPending}>
                                {assignMutation.isPending ? '...' : 'Assign'}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const AdminFulfillment = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch unfulfilled orders (paid but not completed/delivered) 
    // Usually 'processing' is the state for paid-waiting-fulfillment. 'pending' is usually unpaid.
    // However, depending on workflow, user might want to see 'pending' too if they manually verify payment here.
    // Let's fetch all relevant status for fulfillment.
    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['orders', 'fulfillment'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .in('status', ['processing', 'pending', 'completed']) // Include completed to grab links
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Order[];
        }
    });

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingOrders = filteredOrders.filter(o => o.status === 'processing' || o.status === 'pending');
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Fulfillment Console</h1>
                    <p className="text-muted-foreground">Securely assign accounts and generate delivery links.</p>
                </div>
                <div className="w-72">
                    <Input
                        placeholder="Search Orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card"
                    />
                </div>
            </div>

            {/* Pending Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-warning" />
                        <h2 className="text-xl font-bold">Pending Assignment</h2>
                    </div>

                    {isLoading ? (
                        <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success/50" />
                            <p>All clean! No pending orders.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="p-4 rounded-xl bg-background border border-border flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono font-bold">{order.order_number}</p>
                                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                                            <div className="flex gap-2 mt-1">
                                                {order.order_items?.map((i, idx) => (
                                                    <span key={idx} className="text-xs font-bold bg-secondary px-2 py-0.5 rounded text-foreground">
                                                        {i.product_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'processing' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <Button className="w-full" variant="hero" onClick={() => setSelectedOrder(order)}>
                                        Open Assignment Tool
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recently Fulfilled / Link Generator */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-5 h-5 text-success" />
                        <h2 className="text-xl font-bold">Secure Links (Completed)</h2>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {completedOrders.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">No completed orders found.</div>
                        ) : (
                            completedOrders.map(order => (
                                <div key={order.id} className="p-4 rounded-xl bg-background border border-border flex items-center justify-between group hover:border-success/50 transition-colors">
                                    <div>
                                        <p className="font-mono font-bold text-sm">{order.order_number}</p>
                                        <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 group-hover:border-success group-hover:text-success"
                                        onClick={() => {
                                            const link = `${window.location.origin}/track-order?ref=${order.id}`;
                                            navigator.clipboard.writeText(link);
                                            toast({ title: "Copied!", description: "Secure link copied to clipboard." });
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Link
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manual Fulfillment</DialogTitle>
                        <DialogDescription>Assign a secure account to this order.</DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <ManualAssignmentPanel
                            order={selectedOrder}
                            onAssignSuccess={() => {
                                setSelectedOrder(null);
                                refetch();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminFulfillment;

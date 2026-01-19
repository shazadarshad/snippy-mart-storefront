import { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, AlertCircle, ShoppingBag, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const TrackOrderPage = () => {
    const [orderId, setOrderId] = useState('');
    const [searchId, setSearchId] = useState('');
    const { data: order, isLoading, isError, isFetched } = useTrackOrder(searchId);
    const { data: settings } = useSiteSettings();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderId.trim()) {
            setSearchId(orderId.trim());
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-success bg-success/10 border-success/20';
            case 'pending': return 'text-warning bg-warning/10 border-warning/20';
            case 'cancelled': return 'text-destructive bg-destructive/10 border-destructive/20';
            case 'refunded': return 'text-muted-foreground bg-muted border-border';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getWhatsAppLink = () => {
        const number = settings?.whatsapp_number || '94787767869';
        return `https://wa.me/${number.replace(/\D/g, '')}`;
    };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                            Track Your <span className="gradient-text">Order</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Enter your Order ID to see your order status and details.
                        </p>
                    </div>

                    {/* Search Box */}
                    <form onSubmit={handleSearch} className="relative mb-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Enter Order ID (e.g., SNIP-2026-000001)"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="pl-12 h-16 text-lg bg-card border-border rounded-2xl shadow-xl focus:ring-primary/20"
                        />
                        <Button
                            type="submit"
                            variant="hero"
                            className="absolute right-2 top-2 bottom-2 px-8 rounded-xl"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Searching...' : 'Track Order'}
                        </Button>
                    </form>

                    {/* Results */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Retrieving your order details...</p>
                        </div>
                    )}

                    {isFetched && !order && !isLoading && (
                        <div className="p-8 rounded-3xl bg-destructive/5 border border-destructive/10 text-center animate-fade-in">
                            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">Order Not Found</h3>
                            <p className="text-muted-foreground mb-6">
                                We couldn't find an order with ID <span className="font-mono font-bold text-foreground">{searchId}</span>.
                                Please check the ID and try again, or contact support if you think this is a mistake.
                            </p>
                            <Button variant="outline" asChild>
                                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                                    Contact Support
                                </a>
                            </Button>
                        </div>
                    )}

                    {order && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Status Banner */}
                            <div className={`p-6 rounded-3xl border flex items-center justify-between ${getStatusColor(order.status)}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium uppercase tracking-wider opacity-70">Order Status</p>
                                        <p className="text-2xl font-bold capitalize">{order.status}</p>
                                    </div>
                                </div>
                                {order.status === 'completed' && <CheckCircle2 className="w-10 h-10" />}
                            </div>

                            {/* Order Info Card */}
                            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-6 md:p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-bold">Order ID</p>
                                            <p className="text-xl font-mono font-bold text-foreground">{order.order_number}</p>
                                        </div>
                                        <div className="md:text-right">
                                            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-bold">Purchase Date</p>
                                            <p className="text-lg font-medium text-foreground">{formatDateTime(order.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {/* Customer Info */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
                                                <ShoppingBag className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Customer Name</p>
                                                <p className="text-lg font-bold text-foreground">{order.customer_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {order.payment_method && (
                                                <div className="px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-bold uppercase tracking-tighter">
                                                    {order.payment_method.replace('_', ' ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Products Ordered</p>
                                        <div className="space-y-3">
                                            {order.order_items?.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
                                                    <div className="flex items-center gap-3">
                                                        <Package className="w-5 h-5 text-primary" />
                                                        <div>
                                                            <p className="font-bold text-foreground">{item.product_name}</p>
                                                            {item.plan_name && <p className="text-xs text-muted-foreground">{item.plan_name}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-foreground">{formatPrice(item.total_price)}</p>
                                                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-border" />

                                    {/* Total */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-foreground">Total Amount</span>
                                        <span className="text-3xl font-display font-extrabold gradient-text">
                                            {formatPrice(order.total_amount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer Help */}
                                <div className="bg-secondary/20 p-6 text-center border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                                        Need help with your order? Our support team is available 24/7.
                                    </p>
                                    <Button variant="whatsapp" className="rounded-full shadow-lg" asChild>
                                        <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                                            <MessageCircle className="w-5 h-5 mr-2" />
                                            Contact WhatsApp Support
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackOrderPage;

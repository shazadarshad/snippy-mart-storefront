import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle2, AlertCircle, ShoppingBag, Globe, MessageCircle, ArrowLeft, RefreshCw, MoreVertical, CreditCard, User, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder, type OrderStatus } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const TrackOrderPage = () => {
    const [searchParams] = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [searchId, setSearchId] = useState(searchParams.get('orderId') || '');
    const { data: order, isLoading, isError, isFetched } = useTrackOrder(searchId);
    const { data: settings } = useSiteSettings();

    useEffect(() => {
        const id = searchParams.get('orderId');
        if (id) {
            setOrderId(id);
            setSearchId(id);
        }
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderId.trim()) {
            setSearchId(orderId.trim());
        }
    };

    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case 'completed': return { color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2, step: 4 };
            case 'shipping': return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Truck, step: 3 };
            case 'processing': return { color: 'text-primary bg-primary/10 border-primary/20', icon: Loader2, step: 2 };
            case 'on_hold': return { color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: Clock, step: 2 };
            case 'pending': return { color: 'text-warning bg-warning/10 border-warning/20', icon: Clock, step: 1 };
            case 'cancelled': return { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertCircle, step: 0 };
            case 'refunded': return { color: 'text-muted-foreground bg-muted border-border', icon: RefreshCw, step: 0 };
            default: return { color: 'text-muted-foreground bg-muted border-border', icon: Clock, step: 1 };
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
                        <div className="space-y-8 animate-fade-in">
                            {/* Neural Progress Bar */}
                            <div className="bg-card border border-border p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                                <div className="flex items-center justify-between mb-12 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getStatusInfo(order.status).color} bg-white shadow-xl`}>
                                            <Package className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Live Delivery Pulse</p>
                                            <h2 className="text-2xl font-display font-black text-foreground capitalize">{order.status}</h2>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Tracking Phase</p>
                                        <p className="text-lg font-bold text-primary">Stage {getStatusInfo(order.status).step} of 4</p>
                                    </div>
                                </div>

                                <div className="relative pt-2 pb-8 px-2">
                                    <div className="absolute top-[1.35rem] left-0 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                            style={{ width: `${(getStatusInfo(order.status).step / 4) * 100}%` }}
                                        />
                                    </div>

                                    <div className="relative flex justify-between">
                                        {[
                                            { label: 'Placed', icon: Clock, step: 1 },
                                            { label: 'Processing', icon: Loader2, step: 2 },
                                            { label: 'Shipping', icon: Truck, step: 3 },
                                            { label: 'Delivered', icon: CheckCircle2, step: 4 }
                                        ].map((p, i) => (
                                            <div key={i} className="flex flex-col items-center gap-4 relative z-10">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 bg-white",
                                                    getStatusInfo(order.status).step >= p.step ? "border-primary text-primary scale-110 shadow-lg" : "border-secondary text-muted-foreground"
                                                )}>
                                                    <p.icon className="w-4 h-4" />
                                                </div>
                                                <p className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    getStatusInfo(order.status).step >= p.step ? "text-primary" : "text-muted-foreground opacity-50"
                                                )}>{p.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Order Intelligence */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-card border border-border p-6 md:p-8 rounded-[2.5rem] shadow-xl">
                                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Verified Package Manifest</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {order.order_items?.map((item: any) => (
                                                <div key={item.id} className="group p-5 rounded-2xl bg-secondary/30 border border-border hover:border-primary/50 transition-all flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black text-foreground group-hover:text-primary transition-colors">{item.product_name}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest">
                                                                {item.plan_name || 'Standard Plan'} • Qty x{item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-foreground">{formatPrice(item.total_price)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                            <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Global Order Total</span>
                                            <span className="text-3xl font-display font-black gradient-text">{formatPrice(order.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl space-y-6">
                                        <div className="space-y-4">
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Transaction ID</p>
                                                <p className="text-sm font-mono font-black text-foreground break-all">{order.order_number}</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Recipient</p>
                                                <p className="text-sm font-black text-foreground flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" />
                                                    {order.customer_name}
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Payment Method</p>
                                                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-secondary border border-border inline-flex items-center gap-2">
                                                    <CreditCard className="w-3 h-3 text-primary" />
                                                    {order.payment_method?.replace('_', ' ') || 'UNSPECIFIED'}
                                                </div>
                                            </div>
                                            <div className="text-left pt-4 border-t border-border">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Support Channel</p>
                                                <Button variant="whatsapp" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg" asChild>
                                                    <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        WhatsApp Line
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button variant="ghost" className="w-full h-14 rounded-[2rem] text-muted-foreground hover:text-primary transition-colors" asChild>
                                        <Link to="/">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back to Marketplace
                                        </Link>
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

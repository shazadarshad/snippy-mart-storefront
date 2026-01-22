import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle2, AlertCircle, ShoppingBag, Globe, MessageCircle, ArrowLeft, RefreshCw, MoreVertical, CreditCard, User, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder, type OrderStatus } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/store';
import { formatDateTime, cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/seo/SEO';

const TrackOrderPage = () => {
    const [searchParams] = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [searchId, setSearchId] = useState(searchParams.get('orderId') || '');
    const { data: order, isLoading, isError, isFetched } = useTrackOrder(searchId);
    const { data: settings } = useSiteSettings();
    const automation = useOrderAutomation(order?.id);

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
            <SEO
                title="Track Order"
                description="Track the status of your Snippy Mart order in real-time. Enter your Order ID to see delivery progress."
            />
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8 md:mb-12">
                        <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
                            Track Your <span className="gradient-text">Order</span>
                        </h1>
                        <p className="text-sm md:text-lg text-muted-foreground max-w-md mx-auto">
                            Enter your Order ID to see your status and shipment details in real-time.
                        </p>
                    </div>

                    {/* Search Box */}
                    <form onSubmit={handleSearch} className="relative mb-8 md:mb-12 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="text"
                            placeholder="Order ID (e.g., SNIP-2026-000001)"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="pl-11 md:pl-12 h-14 md:h-16 text-base md:text-lg bg-card border-border rounded-2xl shadow-xl focus:ring-primary/20 transition-all font-mono"
                        />
                        <Button
                            type="submit"
                            variant="hero"
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 md:px-8 rounded-xl text-sm md:text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : 'Track'}
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
                            <div className="bg-card border border-border p-5 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                                <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border-2 ${getStatusInfo(order.status).color} bg-white shadow-xl`}>
                                            <Package className="w-5 h-5 md:w-7 md:h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Live Delivery Pulse</p>
                                            <h2 className="text-xl md:text-2xl font-display font-black text-foreground capitalize">{order.status}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Progress</p>
                                        <p className="text-base md:text-lg font-bold text-primary">Stage {getStatusInfo(order.status).step}/4</p>
                                    </div>
                                </div>

                                <div className="relative pt-2 pb-6 md:pb-8 px-1 md:px-2">
                                    <div className="absolute top-[1.2rem] md:top-[1.35rem] left-0 w-full h-1 md:h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                            style={{ width: `${(getStatusInfo(order.status).step / 4) * 100}%` }}
                                        />
                                    </div>

                                    <div className="relative flex justify-between">
                                        {[
                                            { label: 'Placed', icon: Clock, step: 1 },
                                            { label: 'Process', icon: Loader2, step: 2 },
                                            { label: 'Ship', icon: Truck, step: 3 },
                                            { label: 'Done', icon: CheckCircle2, step: 4 }
                                        ].map((p, i) => (
                                            <div key={i} className="flex flex-col items-center gap-3 md:gap-4 relative z-10">
                                                <div className={cn(
                                                    "w-8 h-8 md:w-10 md:h-10 rounded-full border-[3px] md:border-4 flex items-center justify-center transition-all duration-500 bg-white",
                                                    getStatusInfo(order.status).step >= p.step ? "border-primary text-primary scale-110 shadow-lg" : "border-secondary text-muted-foreground"
                                                )}>
                                                    <p.icon className="w-3 h-3 md:w-4 md:h-4" />
                                                </div>
                                                <p className={cn(
                                                    "text-[8px] md:text-[10px] font-black uppercase tracking-widest",
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
                                    {/* Automated Delivery Section */}
                                    {order.status === 'delivered' && automation?.assignment && (
                                        <div className="space-y-8">
                                            {/* Credentials & Rules */}
                                            <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                                                <div className="flex items-center gap-3 mb-6 md:mb-8 pb-5 md:pb-6 border-b border-border/50">
                                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground">Account Credentials</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email / Username</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-mono font-bold text-foreground truncate mr-2">{automation.assignment.email}</p>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                navigator.clipboard.writeText(automation.assignment.email);
                                                                // Toast handled by hook or browser
                                                            }}>
                                                                <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Password</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-mono font-bold text-foreground">••••••••</p>
                                                            <div className="flex gap-1">
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                    navigator.clipboard.writeText(automation.assignment.password);
                                                                }}>
                                                                    <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Security Rules */}
                                                {automation.assignment.rules_template && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertCircle className="w-4 h-4 text-primary" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors">Usage Rules & Guidelines</span>
                                                        </div>
                                                        <div className="p-5 md:p-6 rounded-2xl bg-secondary/20 border border-border/50 whitespace-pre-wrap text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                                                            {automation.assignment.rules_template}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Live Verification Code Hub */}
                                            <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                                <div className="flex items-center justify-between mb-8 pb-5 md:pb-6 border-b border-border/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 relative">
                                                            <Globe className="w-5 h-5" />
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white" />
                                                        </div>
                                                        <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground transition-colors">Live Verification Hub</h3>
                                                    </div>
                                                    <Badge variant="secondary" className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] border-orange-500/20 text-orange-500 bg-orange-500/5">Monitoring Live</Badge>
                                                </div>

                                                <div className="space-y-4">
                                                    {automation.codes.length > 0 ? (
                                                        automation.codes.map((codeInfo, idx) => (
                                                            <div key={codeInfo.id} className={cn(
                                                                "group p-5 rounded-2xl border transition-all flex items-center justify-between",
                                                                idx === 0 ? "bg-orange-500/5 border-orange-500/30 shadow-lg shadow-orange-500/10" : "bg-secondary/30 border-border"
                                                            )}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black",
                                                                        idx === 0 ? "bg-orange-500 text-white shadow-xl" : "bg-secondary text-muted-foreground"
                                                                    )}>
                                                                        {codeInfo.code}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className={cn("font-black", idx === 0 ? "text-foreground" : "text-muted-foreground")}>Sign-in Code Detected</p>
                                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-70 tracking-widest uppercase">
                                                                            {new Date(codeInfo.received_at).toLocaleTimeString()} • Expires in {Math.max(0, Math.floor((new Date(codeInfo.expires_at).getTime() - new Date().getTime()) / 60000))}m
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button variant={idx === 0 ? "hero" : "ghost"} size="sm" className="h-10 rounded-xl" onClick={() => navigator.clipboard.writeText(codeInfo.code)}>
                                                                    <Copy className="w-4 h-4 mr-2" />
                                                                    Copy
                                                                </Button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-12 text-center border-2 border-dashed border-border rounded-[2rem] space-y-4">
                                                            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                                                                <Globe className="w-8 h-8" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-black text-foreground uppercase tracking-widest text-xs">Waiting for Code</p>
                                                                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Click 'Send Code' on your login screen. The code will appear here instantly.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-card border border-border p-5 md:p-8 rounded-[2rem] shadow-xl">
                                        <div className="flex items-center gap-3 mb-6 md:mb-8 pb-5 md:pb-6 border-b border-border/50">
                                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-foreground">Verified Manifest</h3>
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

                                        <div className="mt-8 md:mt-10 p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                            <span className="text-[10px] md:text-sm font-black text-muted-foreground uppercase tracking-widest">Global Total</span>
                                            <span className="text-2xl md:text-3xl font-display font-black gradient-text">{formatPrice(order.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6">
                                    <div className="bg-card border border-border p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl space-y-5 md:space-y-6">
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

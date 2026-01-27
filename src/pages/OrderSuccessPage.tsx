import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle2, Package, Search, Home, ExternalLink, Users, Loader2, Copy, ShieldCheck, Mail, Key, ArrowRight, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { useTrackOrder } from '@/hooks/useOrders';
import { useOrderAutomation } from '@/hooks/useOrderAutomation';
import { FormattedDescription } from '@/components/products/FormattedDescription';

interface OrderData {
  orderId: string;
  whatsapp: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  discount?: number;
}

const OrderSuccessPage = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionOrder, setSessionOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: settings, isLoading: isSettingsLoading } = useSiteSettings();

  // Load basic info from session first (for immediate feedback)
  useEffect(() => {
    const storedOrder = sessionStorage.getItem('lastOrder');
    if (storedOrder) {
      setSessionOrder(JSON.parse(storedOrder));
    } else {
      // Fallback or redirect if direct access without order
      // navigate('/'); 
    }
  }, [navigate]);

  // Fetch live order details to check for auto-fulfillment
  const { data: liveOrder, isLoading: isLiveOrderLoading } = useTrackOrder(sessionOrder?.orderId || '');
  const { assignment, isLoading: isAutomationLoading } = useOrderAutomation(liveOrder?.id);

  const copyToClipboard = (text: string, label: string = 'ID') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied!`,
      description: 'Copied to clipboard.',
    });
  };

  if ((!sessionOrder && !liveOrder) || isLiveOrderLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const orderId = liveOrder?.order_number || sessionOrder?.orderId || '';
  const total = liveOrder?.total_amount || sessionOrder?.total || 0;
  // Consider 'processing' as well, as sometimes status updates lag slightly behind assignment in UI
  const isCompleted = liveOrder?.status === 'completed' || liveOrder?.status === 'delivered';
  const showAutomation = assignment && (isCompleted || liveOrder?.status === 'processing');

  const getWhatsAppLink = () => {
    const number = settings?.whatsapp_number || '94787767869';
    const template = settings?.whatsapp_message_template || 'Hello! I just placed an order. Order ID: {order_id}';
    const message = template.replace('{order_id}', orderId);
    return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getServiceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('netflix')) return '🍿';
    if (t.includes('prime')) return '📦';
    if (t.includes('spotify')) return '🎵';
    if (t.includes('cursor')) return '🖱️';
    if (t.includes('adobe')) return '🎨';
    return '🔑';
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-success/20 animate-ping" />
            </div>
            <div className="relative w-24 h-24 rounded-full bg-success flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-success-foreground" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 animate-fade-in">
            Order Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Success! Your order <span className="text-primary font-mono font-black">{orderId}</span> has been locked in.
            {liveOrder?.discount_amount > 0 && <span className="block text-sm text-green-500 mt-1 font-bold">You saved {formatPrice(liveOrder.discount_amount)}! 🎉</span>}
            {liveOrder?.status === 'pending' && <span className="block text-sm text-amber-500 mt-2 font-bold">(Waiting for Payment Confirmation)</span>}
          </p>

          {/* AUTO-DELIVERY CARD: Show if automation exists */}
          {isAutomationLoading ? (
            <div className="h-40 rounded-2xl bg-secondary/50 animate-pulse mb-8 flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-medium">Checking available inventory...</span>
            </div>
          ) : showAutomation ? (
            <div className="text-left mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-card border-2 border-primary/20 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl">
                    {getServiceIcon(assignment.service_type || 'default')}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wide text-foreground">
                      {assignment.service_type || 'Account'} Access
                    </h3>
                    <p className="text-sm text-green-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Instant Delivery Successful
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Username / Email</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-foreground">{assignment.email}</p>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(assignment.email, 'Email')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Password</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-foreground">••••••••</p>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(assignment.password, 'Password')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {assignment.rules_template && (
                  <div className="mt-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Important Rules
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <FormattedDescription description={assignment.rules_template} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STANDARD DELIVERY NOTICE */
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <span className="text-2xl">⏱️</span>
              <div className="text-left">
                <p className="text-sm font-bold text-primary">Estimated Delivery: 1 - 24 Hours</p>
                <p className="text-xs text-muted-foreground">Credentials sent via WhatsApp & Email</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 md:gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>

            {/* If not completed yet, show WhatsApp confirm */}
            {!isCompleted && (
              <Button variant="whatsapp" size="xl" className="h-14 md:h-18 rounded-2xl md:rounded-3xl text-lg md:text-xl font-black uppercase tracking-widest shadow-2xl hover:translate-y-[-4px] active:translate-y-[0px] transition-all" asChild disabled={isSettingsLoading}>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  {isSettingsLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <MessageCircle className="w-6 h-6 md:w-7 md:h-7 mr-3 animate-bounce" />}
                  Confirm Order
                </a>
              </Button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Track Order Button used as primary if completed, secondary if not */}
              <Button variant={isCompleted ? "hero" : "outline"} size="xl" className="h-14 md:h-18 rounded-2xl md:rounded-3xl text-base md:text-lg font-bold" asChild>
                <Link to={`/track-order?orderId=${orderId}`}>
                  <Search className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  {isCompleted ? "View Full Details" : "Track Status"}
                </Link>
              </Button>

              <Button variant="outline" size="xl" className="h-14 md:h-18 rounded-2xl md:rounded-3xl text-base md:text-lg font-bold border-2" asChild>
                <Link to="/">
                  <Home className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  Home
                </Link>
              </Button>
            </div>
          </div>

          {/* WhatsApp Community Invite */}
          <div className="mb-12 p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-[#25D366]/10 to-transparent border border-[#25D366]/20 relative overflow-hidden group animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-[#25D366]" />
            </div>
            <div className="relative z-10 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Join Our Community</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Join our exclusive WhatsApp community to get instant updates on new products, flash sales, and premium support from our team.
              </p>
              <Button
                variant="whatsapp"
                size="lg"
                className="rounded-2xl font-bold px-8 shadow-xl hover:scale-105 active:scale-95 transition-all"
                asChild
              >
                <a href="https://chat.whatsapp.com/J5lBGUiobiKIPpUYGMorec" target="_blank" rel="noopener noreferrer">
                  Join Group Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>

          {!isCompleted && (
            <div className="flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Fail-safe Communication</p>
              <a
                href={`https://wa.me/${(settings?.whatsapp_number || '94787767869').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-2xl bg-secondary/50 border border-border text-primary hover:bg-primary hover:text-white transition-all font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Manual Support Line
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

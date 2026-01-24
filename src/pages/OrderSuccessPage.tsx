import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle, Home, Package, Loader2, Search, ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';

interface OrderData {
  orderId: string;
  whatsapp: string;
  name?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
}

const OrderSuccessPage = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: settings, isLoading: isSettingsLoading } = useSiteSettings();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('lastOrder');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const copyToClipboard = () => {
    if (orderData?.orderId) {
      navigator.clipboard.writeText(orderData.orderId);
      setCopied(true);
      toast({
        title: 'Order ID Copied!',
        description: 'You can now use this to track your order.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!orderData) {
    return null;
  }

  const getWhatsAppLink = () => {
    const number = settings?.whatsapp_number || '94787767869';
    const template = settings?.whatsapp_message_template || 'Hello! I just placed an order. Order ID: {order_id}';
    const message = template.replace('{order_id}', orderData.orderId);
    return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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
            Success! Your order <span className="text-primary font-mono font-black">{orderData.orderId}</span> has been locked in.
          </p>

          {/* Delivery Time Notice */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <span className="text-2xl">⏱️</span>
            <div className="text-left">
              <p className="text-sm font-bold text-primary">Estimated Delivery: 1 - 24 Hours</p>
              <p className="text-xs text-muted-foreground">Credentials sent via WhatsApp & Email</p>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="p-0.5 rounded-[2rem] bg-gradient-to-b from-primary/20 to-transparent mb-8 md:mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-5 md:p-8 rounded-[1.9rem] bg-card border border-white/10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-border/50">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Official Order ID</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl md:text-2xl font-mono font-black text-foreground">{orderData.orderId}</span>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Customer Handle</p>
                  <p className="text-lg md:text-xl font-bold text-foreground flex items-center sm:justify-end gap-2">
                    <MessageCircle className="w-5 h-5 text-success" />
                    {orderData.whatsapp}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest text-left mb-4">Parcel Contents</p>
                <div className="space-y-3">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold">UNIT VOL: x{item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border/50">
                  <span className="text-base md:text-lg font-black text-muted-foreground uppercase tracking-tighter">Net Total</span>
                  <span className="text-3xl md:text-4xl font-display font-black gradient-text">{formatPrice(orderData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 md:gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="whatsapp" size="xl" className="h-14 md:h-18 rounded-2xl md:rounded-3xl text-lg md:text-xl font-black uppercase tracking-widest shadow-2xl hover:translate-y-[-4px] active:translate-y-[0px] transition-all" asChild disabled={isSettingsLoading}>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  {isSettingsLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <MessageCircle className="w-6 h-6 md:w-7 md:h-7 mr-3 animate-bounce" />}
                  Confirm Order
                </a>
              </Button>
              <Button variant="outline" size="xl" className="h-14 md:h-18 rounded-2xl md:rounded-3xl text-base md:text-lg font-bold border-2" asChild>
                <Link to="/">
                  <Home className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  Home
                </Link>
              </Button>
            </div>

            {/* Track Order CTA */}
            <div className="group p-0.5 rounded-[2rem] bg-gradient-to-r from-primary/10 via-transparent to-primary/10 hover:from-primary/20 hover:to-primary/20 transition-all cursor-pointer overflow-hidden relative">
              <Link to={`/track-order?orderId=${orderData.orderId}`} className="block p-5 md:p-8 rounded-[1.9rem] bg-card border border-border/50 text-left relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-foreground mb-0.5 md:mb-1">Live Tracking</h3>
                      <p className="text-xs md:text-sm text-muted-foreground max-w-xs">Monitor delivery in real-time. Secure & encrypted.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] bg-primary/10 px-4 md:px-6 py-2 md:py-3 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                    Launch Tracker
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

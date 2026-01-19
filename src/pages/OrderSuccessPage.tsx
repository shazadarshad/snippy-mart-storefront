import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle, Home, Package, Loader2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/store';
import { useSiteSettings } from '@/hooks/useSiteSettings';

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
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const { data: settings, isLoading: isSettingsLoading } = useSiteSettings();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('lastOrder');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
      // Clear sensitive data from session storage after reading it
      // Note: We might want to keep it if we allow refresh, but user requested clearing in original code
      // sessionStorage.removeItem('lastOrder'); 
    } else {
      navigate('/');
    }
  }, [navigate]);

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

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 animate-fade-in">
            Order Received Successfully!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Thank you for your order. Your order ID is <span className="text-foreground font-mono font-bold">{orderData.orderId}</span>.
            Please click the button below to confirm your order on WhatsApp.
          </p>

          {/* Order Details Card */}
          <div className="p-6 rounded-2xl bg-card border border-border text-left mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-foreground">{orderData.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your WhatsApp</p>
                <p className="font-medium text-foreground">{orderData.whatsapp}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-3">Products Ordered</p>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold gradient-text">{formatPrice(orderData.total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="whatsapp" size="xl" className="w-full sm:w-auto px-8 py-6 text-lg shadow-lg hover:shadow-success/20 transition-all duration-300" asChild disabled={isSettingsLoading}>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  {isSettingsLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MessageCircle className="w-6 h-6 mr-2 animate-bounce" />}
                  Confirm on WhatsApp
                </a>
              </Button>
              <div className="flex flex-col items-center sm:items-start">
                <Button variant="outline" size="xl" className="w-full sm:w-auto px-8" asChild>
                  <Link to="/">
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-sm text-muted-foreground">Having trouble with the button?</p>
              <a
                href={`https://wa.me/${(settings?.whatsapp_number || '94787767869').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support Manually
              </a>
            </div>

            {/* Track Order CTA */}
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Want to track your order?</h3>
                  <p className="text-sm text-muted-foreground">You can check your order status anytime on our tracking page.</p>
                </div>
              </div>
              <Button variant="hero" asChild>
                <Link to="/track-order">
                  Track Order
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Info, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore, generateOrderId, formatPrice } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector, { type PaymentMethod } from '@/components/checkout/PaymentMethodSelector';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  
  const [formData, setFormData] = useState({
    whatsapp: '',
    name: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [binanceId, setBinanceId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderId = generateOrderId();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.whatsapp) {
      toast({
        title: "WhatsApp number required",
        description: "Please enter your WhatsApp number to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some products to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!proofFile) {
      toast({
        title: "Payment proof required",
        description: "Please upload your payment receipt or screenshot.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'binance_usdt' && !binanceId) {
      toast({
        title: "Binance ID required",
        description: "Please enter your Binance ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload payment proof
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);

      if (uploadError) {
        throw new Error('Failed to upload payment proof');
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Create order in database
      await createOrder.mutateAsync({
        customer_name: formData.name || 'Customer',
        customer_whatsapp: formData.whatsapp,
        total_amount: getTotal(),
        notes: formData.notes || undefined,
        payment_method: paymentMethod,
        payment_proof_url: urlData.publicUrl,
        binance_id: paymentMethod === 'binance_usdt' ? binanceId : undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        })),
      });

      // Store order data for success page
      const orderData = {
        orderId,
        whatsapp: formData.whatsapp,
        name: formData.name,
        notes: formData.notes,
        items: items.map((item) => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total: getTotal(),
        paymentMethod,
      };

      sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
      
      clearCart();
      navigate('/order-success');
    } catch (error) {
      console.error('Order creation failed:', error);
      toast({
        title: "Order failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to proceed with checkout.</p>
          <Button variant="hero" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Customer Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
              Checkout
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Customer Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp" className="text-foreground">
                      WhatsApp Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="pl-10 h-12 bg-secondary/50 border-border"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send your order confirmation to this number
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="name" className="text-foreground">
                      Name (Optional)
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1.5 h-12 bg-secondary/50 border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-foreground">
                      Order Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Any special instructions..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1.5 bg-secondary/50 border-border min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Payment Method
                </h2>
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  binanceId={binanceId}
                  onBinanceIdChange={setBinanceId}
                  proofFile={proofFile}
                  onProofFileChange={setProofFile}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    How it works
                  </p>
                  <p className="text-muted-foreground">
                    After placing your order, we'll verify your payment and send a confirmation 
                    message to your WhatsApp with your subscription details.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order
                    <MessageCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Order Summary
                </h2>

                {/* Order ID */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Order ID</span>
                  <span className="text-sm font-mono font-medium text-foreground">{orderId}</span>
                </div>

                {/* Products */}
                <div className="py-4 space-y-4 border-b border-border">
                  {items.map((item) => (
                      <div key={item.product.id} className="flex items-start gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="text-success">Free</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold gradient-text">{formatPrice(getTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

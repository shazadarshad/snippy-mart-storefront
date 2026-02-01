import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Info, ShoppingBag, ArrowLeft, ShieldCheck, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore, generateOrderId } from '@/lib/store';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder, useUpdateExistingOrder } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector, { type PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { getCountry } from '@/lib/utils';
import { CouponInput } from '@/components/checkout/CouponInput';

const CheckoutPage = () => {
  const { formatPrice, currency, currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const { items, getTotal, clearCart, getDiscountAmount, getFinalTotal, appliedCoupon, updateQuantity, removeItem } = useCartStore();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateExistingOrder();

  const [formData, setFormData] = useState({
    whatsapp: '',
    name: '',
    email: '',
    notes: '',
  });
  const [customerCredentials, setCustomerCredentials] = useState<Record<string, { email?: string; password?: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [binanceId, setBinanceId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreRegistering, setIsPreRegistering] = useState(false);

  // Track if we have already pre-registered an order in this session
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  const orderIdRef = useRef<string>(generateOrderId());
  // If we have an existing order ID from pre-registration, use it. Otherwise use the generated one.
  const orderId = existingOrderId || orderIdRef.current;

  // Restore state from session storage on mount
  useState(() => {
    const savedOrder = sessionStorage.getItem('pendingOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Only restore if it's recent (last 30 mins)
        const created = new Date(parsed.timestamp).getTime();
        if (Date.now() - created < 30 * 60 * 1000) {
          setExistingOrderId(parsed.orderId);
          setFormData(prev => ({ ...prev, whatsapp: parsed.whatsapp || '' }));
        } else {
          sessionStorage.removeItem('pendingOrder');
        }
      } catch (e) {
        sessionStorage.removeItem('pendingOrder');
      }
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getSecurityMetadata = () => ({
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: (navigator as any).platform || 'unknown',
    hardware_concurrency: navigator.hardwareConcurrency,
    device_memory: (navigator as any).deviceMemory || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || 'direct',
    timestamp: new Date().toISOString()
  });

  const getOrderPayload = async () => {
    // Detect country
    const customerCountry = await getCountry();
    const securityMetadata = getSecurityMetadata();

    return {
      order_number: orderId,
      customer_name: formData.name || 'Customer',
      customer_whatsapp: formData.whatsapp,
      total_amount: getFinalTotal(),
      discount_amount: getDiscountAmount(),
      applied_coupon_id: appliedCoupon?.id || undefined,
      notes: formData.notes || undefined,
      payment_method: paymentMethod as PaymentMethod, // Will be 'card' for pre-registration
      customer_country: customerCountry,
      customer_email: formData.email || undefined,
      security_metadata: securityMetadata,
      user_agent: navigator.userAgent,
      currency_code: currency,
      currency_symbol: currencyInfo.symbol,
      currency_rate: currencyInfo.rate,
      items: items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        plan_name: item.product.plan_name,
        variant_id: item.product.variant_id,
        variant_name: item.product.variant_name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        customer_credentials: customerCredentials[item.product.id] || null,
      })),
      status: 'pending' as const // Explicitly set as pending
    };
  };

  const handlePreRegister = async () => {
    // 1. Validate WhatsApp
    const whatsappRegex = /^\+?[\d\s-]{10,}$/;
    if (!formData.whatsapp || !whatsappRegex.test(formData.whatsapp)) {
      toast({
        title: "Required",
        description: "Please enter your WhatsApp number first so we can send the link.",
        variant: "destructive",
      });
      // Scroll to top to see error/input
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Prevent re-registration if already done
    if (existingOrderId) {
      return;
    }

    setIsPreRegistering(true);

    try {
      const payload = await getOrderPayload();
      // Force payment method to 'card' for this flow
      payload.payment_method = 'card';

      // 3. Create Order
      await createOrder.mutateAsync(payload);

      // 4. Save state
      setExistingOrderId(orderId);
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        orderId,
        whatsapp: formData.whatsapp,
        timestamp: new Date().toISOString()
      }));

      toast({
        title: "Order Initiated",
        description: "We've created a pending order. Please contact us on WhatsApp.",
      });

    } catch (error) {
      console.error('Pre-registration failed:', error);
      toast({
        title: "Connection Error",
        description: "Could not create pending order, but you can still contact us manually.",
        variant: "destructive",
      });
    } finally {
      setIsPreRegistering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const whatsappRegex = /^\+?[\d\s-]{10,}$/;
    if (!formData.whatsapp || !whatsappRegex.test(formData.whatsapp)) {
      toast({
        title: "Invalid WhatsApp number",
        description: "Please enter a valid WhatsApp number (e.g., +94771234567).",
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



    // Validate required credentials
    for (const item of items) {
      if (item.product.requirements?.require_email && !customerCredentials[item.product.id]?.email) {
        toast({
          title: "Missing Details",
          description: `Please enter the account email for ${item.product.name}`,
          variant: "destructive",
        });
        window.scrollTo({ top: 400, behavior: 'smooth' }); // Approximate scroll
        return;
      }
      if (item.product.requirements?.require_password && !customerCredentials[item.product.id]?.password) {
        toast({
          title: "Missing Details",
          description: `Please enter the account password for ${item.product.name}`,
          variant: "destructive",
        });
        window.scrollTo({ top: 400, behavior: 'smooth' });
        return;
      }
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
        throw new Error(uploadError.message || 'Failed to upload payment proof');
      }

      // Store the uploaded file path (bucket is private)
      const paymentProofPath = fileName;

      // Create or Update order
      const invalid = items.find((i) => i.product.id.length !== 36);
      if (invalid) {
        throw new Error('Your cart has an invalid item (old cached data). Please clear the cart and add items again.');
      }

      const commonOrderData = {
        payment_proof_url: paymentProofPath,
        notes: formData.notes || undefined,
        binance_id: paymentMethod === 'binance_usdt' ? binanceId : undefined,
        // Update customer details just in case they changed them after pre-registering
        customer_name: formData.name || 'Customer',
        customer_whatsapp: formData.whatsapp,
        customer_email: formData.email || undefined,
      };

      // Create final payload
      const payload = await getOrderPayload();

      // Add submit-time fields
      Object.assign(payload, {
        payment_proof_url: paymentProofPath,
        binance_id: paymentMethod === 'binance_usdt' ? binanceId : undefined,
        payment_method: paymentMethod,
      });

      // We always use createOrder (which is our create-order Edge Function)
      // because it handles upserting by order_number and bypassing guest RLS limitations.
      await createOrder.mutateAsync(payload);

      // Store order data for success page
      const orderData = {
        orderId,
        whatsapp: formData.whatsapp,
        name: formData.name,
        notes: formData.notes,
        currency: currency,
        rate: currencyInfo.rate,
        items: items.map((item) => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total: getFinalTotal(),
        discount: getDiscountAmount(),
        paymentMethod,
      };

      sessionStorage.setItem('lastOrder', JSON.stringify(orderData));

      // Clear pending order session as it's now completed
      sessionStorage.removeItem('pendingOrder');

      clearCart();
      navigate('/order-success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Order creation failed:', error);
      toast({
        title: "Order failed",
        description: message,
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
                    <Label htmlFor="email" className="text-foreground">
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1.5 h-12 bg-secondary/50 border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send order confirmation and product delivery to this email
                    </p>
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
                      className="mt-1.5 bg-secondary/50 border-border min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Account Setup for Specific Products */}
              {items.some(item => item.product.requirements?.require_email || item.product.requirements?.require_password) && (
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Account Setup
                  </h2>
                  <div className="space-y-6">
                    {items.map((item) => {
                      if (!item.product.requirements?.require_email && !item.product.requirements?.require_password) return null;
                      return (
                        <div key={item.id} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-muted overflow-hidden">
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{item.product.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                <span>Secure Account Setup</span>
                              </div>
                            </div>
                          </div>

                          {item.product.requirements.require_email && (
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Email</Label>
                              <Input
                                type="email"
                                placeholder={`Email for ${item.product.name}`}
                                value={customerCredentials[item.product.id]?.email || ''}
                                onChange={(e) => setCustomerCredentials(prev => ({
                                  ...prev,
                                  [item.product.id]: { ...prev[item.product.id], email: e.target.value }
                                }))}
                                className="bg-background border-border"
                              />
                            </div>
                          )}

                          {item.product.requirements.require_password && (
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Password</Label>
                              <Input
                                type="text"
                                placeholder={`Password for ${item.product.name}`}
                                value={customerCredentials[item.product.id]?.password || ''}
                                onChange={(e) => setCustomerCredentials(prev => ({
                                  ...prev,
                                  [item.product.id]: { ...prev[item.product.id], password: e.target.value }
                                }))}
                                className="bg-background border-border"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  orderId={orderId}
                  onPreRegister={handlePreRegister}
                  isPreRegistering={isPreRegistering}
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
                    <div key={item.id} className="flex flex-col gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-foreground truncate">
                            {item.product.name}
                          </h4>
                          {/* Show Plan and Variant if exists */}
                          {(item.product.plan_name || item.product.variant_name) && (
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1">
                              {item.product.plan_name && (
                                <span className="font-medium">{item.product.plan_name}</span>
                              )}
                              {item.product.variant_name && (
                                <>
                                  {item.product.plan_name && <span className="text-muted-foreground">›</span>}
                                  <span className="text-primary font-semibold">{item.product.variant_name}</span>
                                </>
                              )}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  removeItem(item.id);
                                  toast({
                                    title: "Item removed",
                                    description: `${item.product.name} has been removed from your cart.`,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupons */}
                <div className="py-4 border-b border-white/5">
                  <CouponInput />
                </div>

                <div className="py-4 space-y-2 border-b border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(getTotal())}</span>
                  </div>
                  {getDiscountAmount() > 0 && (
                    <div className="flex items-center justify-between text-sm animate-fade-in">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-red-500 font-bold">-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="text-success">Free</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold gradient-text">{formatPrice(getFinalTotal())}</span>
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

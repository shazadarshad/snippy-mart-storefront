import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Info, ShoppingBag, ArrowLeft, ShieldCheck, Plus, Minus, Trash2, Zap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore, generateOrderId } from '@/lib/store';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder, useUpdateExistingOrder } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector, {
  type PaymentMethod,
  type CryptoSelection,
} from '@/components/checkout/PaymentMethodSelector';
import { getCountry } from '@/lib/utils';
import { CouponInput } from '@/components/checkout/CouponInput';
import { isResellerApiProduct } from '@/hooks/useResellerApi';

const CheckoutPage = () => {
  const { formatPrice, currency, currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const { items, getTotal, clearCart, getDiscountAmount, getFinalTotal, appliedCoupon, updateQuantity, removeItem } = useCartStore();
  const hasAutoItems = items.some((item) => isResellerApiProduct(item.product));
  const allAutoItems =
    items.length > 0 && items.every((item) => isResellerApiProduct(item.product));
  const isMixedCart = hasAutoItems && !allAutoItems;
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [binanceId, setBinanceId] = useState('');
  const [cryptoSelection, setCryptoSelection] = useState<CryptoSelection>(null);
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

    if (
      paymentMethod !== 'bank_transfer' &&
      paymentMethod !== 'binance_usdt' &&
      paymentMethod !== 'crypto_onchain'
    ) {
      setPaymentMethod('bank_transfer');
      toast({
        title: 'Payment method unavailable',
        description: 'Please use bank transfer or crypto payment.',
        variant: 'destructive',
      });
      return;
    }

    if (
      (paymentMethod === 'binance_usdt' || paymentMethod === 'crypto_onchain') &&
      !cryptoSelection
    ) {
      toast({
        title: 'Choose a crypto option',
        description: 'Open Crypto and select Binance Pay or a wallet address.',
        variant: 'destructive',
      });
      return;
    }

    if (!proofFile) {
      toast({
        title: 'Payment proof required',
        description:
          paymentMethod === 'bank_transfer'
            ? 'Please upload your bank transfer receipt screenshot.'
            : 'Please upload your crypto payment screenshot / TX confirmation.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'binance_usdt' && !binanceId.trim()) {
      toast({
        title: 'Binance ID required',
        description: 'Please enter your Binance ID so we can verify the payment.',
        variant: 'destructive',
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

      // Create final payload
      const payload = await getOrderPayload();

      // Enrich notes with crypto payment details for admin verification
      let notesExtra = formData.notes || '';
      if (paymentMethod === 'crypto_onchain' && cryptoSelection?.kind === 'wallet') {
        const w = cryptoSelection.wallet;
        notesExtra = [
          notesExtra,
          `[Crypto] ${w.symbol} ${w.network}`,
          `Address: ${w.address}`,
        ]
          .filter(Boolean)
          .join('\n');
      }

      Object.assign(payload, {
        payment_proof_url: paymentProofPath,
        binance_id: paymentMethod === 'binance_usdt' ? binanceId.trim() : undefined,
        payment_method: paymentMethod,
        customer_name: formData.name || 'Customer',
        customer_whatsapp: formData.whatsapp,
        customer_email: formData.email || undefined,
        notes: notesExtra || undefined,
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
          productId: item.product.id,
          isAuto: !!(item.product.reseller_product_id && String(item.product.reseller_product_id).trim()),
        })),
        total: getFinalTotal(),
        discount: getDiscountAmount(),
        paymentMethod,
        hasAutoItems: items.some(
          (item) => item.product.reseller_product_id && String(item.product.reseller_product_id).trim(),
        ),
        allAutoItems: items.every(
          (item) => item.product.reseller_product_id && String(item.product.reseller_product_id).trim(),
        ),
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
    <div className="min-h-dvh page-mesh pt-24 pb-safe pb-24 sm:pb-20">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 sm:mb-6 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-12">
          {/* Customer Details */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 sm:mb-6">
              Checkout
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-6 rounded-2xl bg-card/95 border border-border shadow-sm">
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
                        className="pl-10 h-12 bg-background border-border text-foreground text-base"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </div>
                    <p className="text-xs text-foreground/70 mt-1">
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
                      className="mt-1.5 h-12 bg-background border-border text-foreground text-base"
                      autoComplete="name"
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
                      className="mt-1.5 h-12 bg-background border-border text-foreground text-base"
                      autoComplete="email"
                      inputMode="email"
                    />
                    <p className="text-xs text-foreground/70 mt-1">
                      {allAutoItems
                        ? 'Optional status updates. Auto products are delivered on Track Order (save your Order ID).'
                        : hasAutoItems
                          ? 'Optional updates. Auto products appear on Track Order; other items may need WhatsApp/support.'
                          : "We'll send order confirmation updates to this email when available."}
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
                      className="mt-1.5 bg-background border-border text-foreground min-h-[80px] text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Account Setup for Specific Products */}
              {items.some(item => item.product.requirements?.require_email || item.product.requirements?.require_password) && (
                <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Account Setup
                  </h2>
                  <div className="space-y-4 sm:space-y-6">
                    {items.map((item) => {
                      if (!item.product.requirements?.require_email && !item.product.requirements?.require_password) return null;
                      return (
                        <div key={item.id} className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-4">
                          <div className="flex items-center gap-3 mb-2 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-muted overflow-hidden">
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{item.product.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>Secure Account Setup</span>
                              </div>
                            </div>
                          </div>

                          {item.product.requirements.require_email && (
                            <div>
                              <Label className="text-xs text-foreground/70 uppercase tracking-wider mb-1.5 block">Account Email</Label>
                              <Input
                                type="email"
                                placeholder={`Email for ${item.product.name}`}
                                value={customerCredentials[item.product.id]?.email || ''}
                                onChange={(e) => setCustomerCredentials(prev => ({
                                  ...prev,
                                  [item.product.id]: { ...prev[item.product.id], email: e.target.value }
                                }))}
                                className="bg-background border-border text-foreground h-12 text-base"
                                autoComplete="email"
                              />
                            </div>
                          )}

                          {item.product.requirements.require_password && (
                            <div>
                              <Label className="text-xs text-foreground/70 uppercase tracking-wider mb-1.5 block">Account Password</Label>
                              <Input
                                type="text"
                                placeholder={`Password for ${item.product.name}`}
                                value={customerCredentials[item.product.id]?.password || ''}
                                onChange={(e) => setCustomerCredentials(prev => ({
                                  ...prev,
                                  [item.product.id]: { ...prev[item.product.id], password: e.target.value }
                                }))}
                                className="bg-background border-border text-foreground h-12 text-base"
                                autoComplete="off"
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
              <div className="p-4 sm:p-6 rounded-2xl bg-card/95 border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Payment
                </h2>
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodChange={(m) => {
                    if (m === 'bank_transfer' || m === 'binance_usdt' || m === 'crypto_onchain') {
                      setPaymentMethod(m);
                    } else if (m === null) {
                      setPaymentMethod('bank_transfer');
                      setCryptoSelection(null);
                    }
                  }}
                  binanceId={binanceId}
                  onBinanceIdChange={setBinanceId}
                  proofFile={proofFile}
                  onProofFileChange={setProofFile}
                  orderId={orderId}
                  totalLkr={getFinalTotal()}
                  cryptoSelection={cryptoSelection}
                  onCryptoSelectionChange={setCryptoSelection}
                  onPreRegister={handlePreRegister}
                  isPreRegistering={isPreRegistering}
                />
              </div>

              {/* Info Box — adaptive by cart type */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm min-w-0">
                  <p className="font-medium text-foreground mb-1">How checkout works</p>
                  <p className="text-foreground/70 text-xs sm:text-sm leading-relaxed">
                    {allAutoItems ? (
                      <>
                        Pay by bank or crypto, put your <strong className="text-foreground">Order ID</strong> in
                        the transfer note, upload proof, then place the order. After we confirm payment,
                        your product appears on <strong className="text-foreground">Track Order</strong> —
                        save your Order ID.
                      </>
                    ) : isMixedCart ? (
                      <>
                        Pay and upload proof, then place the order. <strong className="text-foreground">Auto</strong>{' '}
                        items deliver on Track Order after payment is confirmed. Other items may need
                        WhatsApp or manual fulfillment.
                      </>
                    ) : (
                      <>
                        Pay by bank or crypto, put your Order ID in the note, upload proof, then place
                        the order. We verify payment and deliver — WhatsApp helps if you need support.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full min-h-14 h-14 text-base font-bold text-primary-foreground touch-manipulation sticky bottom-2 sm:static z-10 shadow-lg shadow-primary/25"
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
                    {allAutoItems ? (
                      <Zap className="w-5 h-5 ml-2" />
                    ) : isMixedCart ? (
                      <Package className="w-5 h-5 ml-2" />
                    ) : (
                      <MessageCircle className="w-5 h-5 ml-2" />
                    )}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-first lg:order-none">
            <div className="lg:sticky lg:top-24">
              <div className="p-4 sm:p-6 rounded-2xl bg-card/95 border border-border shadow-sm">
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

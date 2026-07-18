import { useState, useEffect } from 'react';
import { X, ShoppingCart, Zap, Check, Share2, Copy, MessageCircle, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCartStore } from '@/lib/store';
import { useCurrency } from '@/hooks/useCurrency';
import { isResellerApiProduct, productPriceInLkr } from '@/hooks/useResellerApi';
import { useToast } from '@/hooks/use-toast';
import { usePricingPlans, usePricingPlanVariants, type PricingPlan, type PricingPlanVariant } from '@/hooks/usePricingPlans';
import { useProductImages } from '@/hooks/useProductImages';
import type { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { FormattedDescription } from './FormattedDescription';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

const StockIndicator = ({ status }: { status?: string }) => {
  if (!status || status === 'in_stock') {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <Package className="w-4 h-4" />
        <span className="text-sm font-medium">In Stock</span>
      </div>
    );
  }
  if (status === 'limited') {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Limited Availability</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-red-500">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-medium">Out of Stock</span>
    </div>
  );
};

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const { data: pricingPlans = [] } = usePricingPlans(product?.id);
  const { data: allVariants = [] } = usePricingPlanVariants();
  const { data: additionalImages = [] } = useProductImages(product?.id);

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PricingPlanVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build images array: main image + additional images
  const allImages = product ? [product.image_url, ...additionalImages.map(img => img.image_url)] : [];

  // Set default plan when plans load
  // Set default plan for non-variant-pricing products only
  useEffect(() => {
    if (pricingPlans.length > 0 && !product?.use_variant_pricing) {
      const defaultPlan = pricingPlans.find(p => p.is_default) || pricingPlans[0];
      setSelectedPlan(defaultPlan);
    } else if (product) {
      setSelectedPlan(null);
    }
  }, [pricingPlans, product]);

  // Reset variant when plan changes (don't auto-select)
  useEffect(() => {
    setSelectedVariant(null); // Reset when plan changes
  }, [selectedPlan]);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!product) return null;

  // Determine current active variants for the selected plan
  const activeVariants = selectedPlan
    ? allVariants.filter(v => v.plan_id === selectedPlan.id && v.is_active)
    : [];

  // Calculate Display Price (LKR). API products: $ × 360 for customers.
  // Priority: Selected Variant Price > Selected Plan Price > Product Base Price
  const rawPrice = selectedVariant?.price ?? selectedPlan?.price ?? product.price;
  const rawOldPrice = selectedVariant?.old_price ?? selectedPlan?.old_price ?? product.old_price;
  const priceSource = {
    price: rawPrice,
    old_price: rawOldPrice,
    reseller_product_id: product.reseller_product_id,
  };
  const currentPrice = productPriceInLkr(priceSource, 'price');
  const currentOldPrice = rawOldPrice != null ? productPriceInLkr(priceSource, 'old_price') : null;

  // Stock Status Logic
  // If variant selected, use its stock. Else use product stock.
  const currentStockStatus = selectedVariant?.stock_status ?? product.stock_status;
  const isOutOfStock = currentStockStatus === 'out_of_stock';

  const discount = currentOldPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : 0;

  const cartProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    // Cart always stores LKR (API $ already converted ×360)
    price: currentPrice,
    oldPrice: currentOldPrice ?? undefined,
    image: product.image_url,
    category: product.category,
    plan_id: selectedPlan?.id,
    plan_name: selectedPlan?.name,
    variant_id: selectedVariant?.id,
    variant_name: selectedVariant?.name,
    requirements: product.requirements,
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    // If variant pricing is enabled, require both plan and variant selection
    if (product.use_variant_pricing && (!selectedPlan || !selectedVariant)) {
      toast({
        title: "Selection required",
        description: "Please select both duration and package option.",
        variant: "destructive"
      });
      return;
    }
    addItem(cartProduct);
    toast({
      title: "Added to cart",
      description: `${cartProduct.name} has been added to your cart.`,
    });
    onClose();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    // If variant pricing is enabled, require both plan and variant selection
    if (product.use_variant_pricing && (!selectedPlan || !selectedVariant)) {
      toast({
        title: "Selection required",
        description: "Please select both duration and package option.",
        variant: "destructive"
      });
      return;
    }
    addItem(cartProduct);
    onClose();
    navigate('/checkout');
  };

  const handleShareWhatsApp = () => {
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const text = `Check out ${product.name} on Snippy Mart! ${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = async () => {
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    await navigator.clipboard.writeText(productUrl);
    toast({
      title: "Link copied",
      description: "Product link has been copied to clipboard.",
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-[calc(100vw-0.75rem)] sm:max-w-5xl",
          "w-full p-0 gap-0 overflow-hidden",
          "h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.5rem))]",
          "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.5rem))]",
          "bg-card text-foreground border-border/50",
          "rounded-2xl sm:rounded-3xl shadow-2xl",
        )}
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        {/* Content Wrapper */}
        <div className="flex flex-col md:flex-row h-full min-h-0 overflow-hidden">
          {/* Image Section with Gallery - Desktop Only */}
          <div className="hidden md:block relative w-1/2 h-full bg-muted flex-shrink-0">
            <img
              src={allImages[currentImageIndex] || product.image_url}
              alt={product.name}
              className="w-full h-full object-contain"
            />

            {/* Image Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Image Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allImages.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-colors",
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {discount > 0 && (
              <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold z-10">
                -{discount}% OFF
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-card">
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-6 md:px-8 pt-12 sm:pt-10 md:pt-8 pb-3 custom-scrollbar"
            >

              {/* Mobile Image Gallery */}
              <div className="md:hidden relative aspect-[4/3] sm:aspect-square max-h-[42dvh] mx-auto w-full bg-muted rounded-xl mb-4 overflow-hidden">
                <img
                  src={allImages[currentImageIndex] || product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/55 text-white z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/55 text-white z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                      {allImages.map((_, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            idx === currentImageIndex ? "bg-white" : "bg-white/40"
                          )}
                          aria-label={`Image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {discount > 0 && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold z-10">
                    -{discount}% OFF
                  </div>
                )}
              </div>

              {/* Category & Stock */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2 sm:mb-3">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="inline-block px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                    {product.category}
                  </span>
                  {isResellerApiProduct(product) && (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      <Zap className="w-3 h-3 fill-current" />
                      Auto
                    </span>
                  )}
                </div>
                <StockIndicator status={product.stock_status} />
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 sm:mb-4 leading-snug pr-1">
                {product.name}
              </h2>

              {/* Share Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-foreground/70">Share:</span>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#25D366]/10 active:bg-[#25D366]/20 text-[#25D366] transition-colors touch-manipulation"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary active:bg-secondary/80 text-foreground transition-colors touch-manipulation"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <FormattedDescription description={product.description} />
              </div>

              {/* Pricing Plans */}
              {pricingPlans.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-3">
                    {product.use_variant_pricing ? 'Select Duration:' : 'Select Plan:'}
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {pricingPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "relative px-3 py-3 sm:px-4 rounded-xl border transition-all duration-200 text-left group min-h-[80px] flex flex-col justify-center",
                          selectedPlan?.id === plan.id
                            ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)] scale-[1.02]"
                            : "border-border hover:border-primary/30 bg-secondary/30 hover:bg-secondary/50"
                        )}
                      >
                        <div className="text-sm sm:text-base font-semibold text-foreground">
                          {plan.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {plan.duration}
                        </div>
                        {!product.use_variant_pricing && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-base sm:text-lg font-bold text-foreground">
                              {formatPrice(productPriceInLkr({ price: plan.price, reseller_product_id: product.reseller_product_id }))}
                            </span>
                            {plan.old_price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(productPriceInLkr({ price: plan.old_price, reseller_product_id: product.reseller_product_id }))}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedPlan?.id === plan.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}



              {/* Sub-Plans (Variants) Selector - Only show when variant pricing is enabled */}
              {product.use_variant_pricing && activeVariants.length > 0 && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Select Package:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {activeVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={cn(
                          "relative flex items-center justify-between px-3 py-3.5 sm:px-4 sm:py-4 rounded-xl border transition-all duration-200 group text-left min-h-[72px]",
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)] scale-[1.02]"
                            : "border-border hover:border-primary/30 bg-secondary/30 hover:bg-secondary/50 active:scale-[0.98]"
                        )}
                      >
                        <div className="flex flex-col flex-1 pr-2">
                          <span className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                            {variant.name}
                          </span>
                          {variant.stock_status !== 'in_stock' && (
                            <span className={cn(
                              "text-[10px] sm:text-xs font-medium mt-1",
                              variant.stock_status === 'limited' ? "text-amber-500" : "text-red-500"
                            )}>
                              {variant.stock_status === 'limited' ? 'Limited Stock' : 'Out of Stock'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                          {variant.old_price && (
                            <div className="text-[11px] sm:text-xs text-muted-foreground/80 line-through font-medium">
                              {formatPrice(productPriceInLkr({ price: variant.old_price, reseller_product_id: product.reseller_product_id }))}
                            </div>
                          )}
                          <div className={cn(
                            "font-bold whitespace-nowrap",
                            variant.old_price
                              ? "text-base sm:text-lg text-primary"
                              : "text-sm sm:text-base text-foreground"
                          )}>
                            {formatPrice(productPriceInLkr({ price: variant.price, reseller_product_id: product.reseller_product_id }))}
                          </div>
                          {variant.old_price && (
                            <div className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-500">
                              Save {Math.round(((variant.old_price - variant.price) / variant.old_price) * 100)}%
                            </div>
                          )}
                        </div>
                        {selectedVariant?.id === variant.id && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer — sticky on mobile with safe area */}
            <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-3.5 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-6">
              {/* Selected Plan Summary */}
              {selectedPlan && (
                <div className="flex items-center justify-between gap-2 mb-3 p-2.5 sm:p-3 rounded-xl bg-secondary/60">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Selected</p>
                    <div className="flex flex-wrap gap-1 items-center">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedPlan.name}</p>
                      {selectedVariant && (
                        <>
                          <span className="text-muted-foreground">›</span>
                          <span className="text-sm font-semibold text-primary truncate">{selectedVariant.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                      {formatPrice(currentPrice)}
                    </p>
                    {currentOldPrice && (
                      <p className="text-xs text-muted-foreground line-through tabular-nums">
                        {formatPrice(currentOldPrice)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:flex-1 min-h-12 h-12 rounded-xl border-2 border-border bg-card text-foreground font-bold hover:bg-secondary hover:text-foreground active:scale-[0.98] transition-all touch-manipulation"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="w-5 h-5 mr-2 shrink-0" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:flex-1 min-h-12 h-12 rounded-xl font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-all touch-manipulation"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  <Zap className="w-5 h-5 mr-2 fill-current shrink-0" />
                  {isOutOfStock ? 'Unavailable' : 'Buy Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;

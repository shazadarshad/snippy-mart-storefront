import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, Copy, MessageCircle, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
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
import ProductOptionPicker from './ProductOptionPicker';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const StockIndicator = ({
  status,
  count,
}: {
  status?: string;
  count?: number | null;
}) => {
  if (status === 'out_of_stock') {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Out of Stock</span>
      </div>
    );
  }
  if (status === 'limited') {
    return (
      <div className="flex items-center gap-2 text-amber-500">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {count != null && count > 0 ? `Only ${count} left` : 'Limited Availability'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-green-500">
      <Package className="w-4 h-4" />
      <span className="text-sm font-medium">
        {count != null && count > 0 ? `${count} in stock` : 'In Stock'}
      </span>
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

  // Calculate Display Price (LKR).
  // Priority: Selected Variant Price > Selected Plan Price > Product Base Price
  // API products store customer sell price already in LKR on product.price
  const rawPrice = selectedVariant?.price ?? selectedPlan?.price ?? product.price;
  const rawOldPrice = selectedVariant?.old_price ?? selectedPlan?.old_price ?? product.old_price;
  const priceSource = {
    price: rawPrice,
    old_price: rawOldPrice,
    reseller_product_id: product.reseller_product_id,
    reseller_cost_usd: product.reseller_cost_usd,
  };
  const currentPrice = productPriceInLkr(priceSource, 'price');
  const currentOldPrice = rawOldPrice != null ? productPriceInLkr(priceSource, 'old_price') : null;
  const hasPlans = pricingPlans.length > 0;
  const needsBothPicks = !!product.use_variant_pricing;
  const selectionComplete = !needsBothPicks || (!!selectedPlan && !!selectedVariant);
  const needsSelection = needsBothPicks && !selectionComplete;

  const planIds = new Set(pricingPlans.map((p) => p.id));
  const scopedVariants = selectedPlan
    ? activeVariants
    : allVariants.filter((v) => planIds.has(v.plan_id) && v.is_active);
  const fromRaw = (() => {
    const prices = scopedVariants
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length) return Math.min(...prices);
    return Number(selectedPlan?.price ?? product.price) || 0;
  })();
  const fromPriceLkr = productPriceInLkr({
    price: fromRaw,
    reseller_product_id: product.reseller_product_id,
    reseller_cost_usd: product.reseller_cost_usd,
  });
  const displayPriceLkr = selectionComplete ? currentPrice : fromPriceLkr;

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
    reseller_product_id: product.reseller_product_id ?? null,
    reseller_stock: product.reseller_stock ?? null,
    stock_status: currentStockStatus ?? product.stock_status ?? null,
    manual_fulfillment: product.manual_fulfillment ?? null,
  };

  const plansAreCreditPacks = pricingPlans.some((p) => /credit/i.test(p.name));
  const variantsAreWarranty = activeVariants.some((v) => /warranty|\bday\b/i.test(v.name));
  const selectionHint = plansAreCreditPacks
    ? 'Please select credits and warranty.'
    : 'Please select both duration and package option.';

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    // If variant pricing is enabled, require both plan and variant selection
    if (product.use_variant_pricing && (!selectedPlan || !selectedVariant)) {
      toast({
        title: "Selection required",
        description: selectionHint,
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
        description: selectionHint,
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
          "max-w-[calc(100vw-0.5rem)] sm:max-w-5xl",
          "w-full p-0 gap-0 overflow-hidden",
          "h-[min(94dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.35rem))]",
          "max-h-[min(94dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-0.35rem))]",
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

            {selectionComplete && discount > 0 && (
              <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold z-10">
                -{discount}% OFF
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-card">
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 md:px-8 pt-12 sm:pt-10 md:pt-8 pb-3 custom-scrollbar"
            >

              {/* Mobile Image Gallery — compact so pickers stay on screen */}
              <div className="md:hidden relative aspect-[16/10] max-h-[26dvh] mx-auto w-full bg-muted rounded-xl mb-3 overflow-hidden">
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

                {selectionComplete && discount > 0 && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold z-10">
                    -{discount}% OFF
                  </div>
                )}
              </div>

              {/* Category & Stock — hide internal "API Products" label from customers */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2 sm:mb-3">
                <div className="flex items-center flex-wrap gap-1.5">
                  {product.category &&
                    product.category.trim().toLowerCase() !== 'api products' && (
                      <span className="inline-block px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                        {product.category}
                      </span>
                    )}
                  {isResellerApiProduct(product) && (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      <Zap className="w-3 h-3 fill-current" />
                      Auto
                    </span>
                  )}
                </div>
                <StockIndicator status={currentStockStatus} count={product.reseller_stock} />
              </div>

              {/* Title + price (always visible, including API products without plans) */}
              <h2 className="text-base sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1.5 leading-snug pr-8">
                {product.name}
              </h2>
              <div className="mb-3 sm:mb-5">
                {needsSelection && (
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Starting from
                  </p>
                )}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl sm:text-3xl font-display font-black text-foreground tabular-nums">
                    {displayPriceLkr > 0 ? formatPrice(displayPriceLkr) : '—'}
                  </span>
                  {selectionComplete && currentOldPrice != null && currentOldPrice > currentPrice && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums">
                      {formatPrice(currentOldPrice)}
                    </span>
                  )}
                  {selectionComplete && discount > 0 && (
                    <span className="text-xs font-bold text-primary">−{discount}%</span>
                  )}
                </div>
              </div>

              {pricingPlans.length > 0 && (
                <div className="mb-4 sm:mb-5">
                  <ProductOptionPicker
                    product={product}
                    plans={pricingPlans}
                    activeVariants={activeVariants}
                    selectedPlan={selectedPlan}
                    selectedVariant={selectedVariant}
                    onSelectPlan={setSelectedPlan}
                    onSelectVariant={setSelectedVariant}
                    formatPrice={formatPrice}
                  />
                </div>
              )}

              {/* Share */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs text-muted-foreground">Share</span>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#25D366]/10 active:bg-[#25D366]/20 text-[#25D366] transition-colors touch-manipulation"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary active:bg-secondary/80 text-foreground transition-colors touch-manipulation"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-2">
                <details className="md:hidden group rounded-xl border border-border/70 bg-secondary/30">
                  <summary className="list-none flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-foreground cursor-pointer touch-manipulation [&::-webkit-details-marker]:hidden">
                    Product details
                    <span className="text-xs font-medium text-muted-foreground group-open:hidden">Show</span>
                    <span className="text-xs font-medium text-muted-foreground hidden group-open:inline">Hide</span>
                  </summary>
                  <div className="px-3 pb-3">
                    <FormattedDescription description={product.description} />
                  </div>
                </details>
                <div className="hidden md:block">
                  <FormattedDescription description={product.description} />
                </div>
              </div>
            </div>

            {/* Actions Footer — sticky on mobile with safe area */}
            <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-3.5 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-6">
              {/* Always show price — API products have no plans so this is required */}
              <div className="flex items-center justify-between gap-2 mb-3 p-2.5 sm:p-3 rounded-xl bg-secondary/60">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {needsSelection
                      ? 'Starting from'
                      : selectedPlan
                        ? 'Selected'
                        : 'Price'}
                  </p>
                  {selectedPlan ? (
                    <div className="flex flex-wrap gap-1 items-center">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedPlan.name}</p>
                      {selectedVariant ? (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm font-semibold text-primary truncate">{selectedVariant.name}</span>
                        </>
                      ) : needsBothPicks ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {variantsAreWarranty || plansAreCreditPacks ? 'pick warranty' : 'pick package'}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-foreground truncate">
                      {needsBothPicks
                        ? plansAreCreditPacks
                          ? 'Pick credits + warranty'
                          : 'Choose both options'
                        : isResellerApiProduct(product)
                          ? 'Auto delivery'
                          : hasPlans
                            ? 'Choose a plan'
                            : 'One-time'}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                    {displayPriceLkr > 0 ? formatPrice(displayPriceLkr) : '—'}
                  </p>
                  {selectionComplete && currentOldPrice != null && currentOldPrice > currentPrice && (
                    <p className="text-xs text-muted-foreground line-through tabular-nums">
                      {formatPrice(currentOldPrice)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 min-h-11 h-11 sm:min-h-12 sm:h-12 rounded-xl border-2 border-border bg-card text-foreground font-bold hover:bg-secondary hover:text-foreground active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 px-2 sm:px-4 text-xs sm:text-sm"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || needsSelection}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 shrink-0" />
                  {isOutOfStock
                    ? 'Sold out'
                    : needsSelection
                      ? !selectedPlan
                        ? plansAreCreditPacks
                          ? 'Credits'
                          : 'Select'
                        : variantsAreWarranty || plansAreCreditPacks
                          ? 'Warranty'
                          : 'Package'
                      : 'Add'}
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1 min-h-11 h-11 sm:min-h-12 sm:h-12 rounded-xl font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 px-2 sm:px-4 text-xs sm:text-sm"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || needsSelection}
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 fill-current shrink-0" />
                  {isOutOfStock
                    ? 'Unavailable'
                    : needsSelection
                      ? 'Select first'
                      : 'Buy now'}
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

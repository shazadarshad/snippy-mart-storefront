import { useState, useEffect } from 'react';
import { X, ShoppingCart, Zap, Check, Share2, Copy, MessageCircle, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCartStore } from '@/lib/store';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { usePricingPlans, type PricingPlan } from '@/hooks/usePricingPlans';
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
  const { data: additionalImages = [] } = useProductImages(product?.id);

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build images array: main image + additional images
  const allImages = product ? [product.image_url, ...additionalImages.map(img => img.image_url)] : [];

  // Set default plan when plans load
  useEffect(() => {
    if (pricingPlans.length > 0) {
      const defaultPlan = pricingPlans.find(p => p.is_default) || pricingPlans[0];
      setSelectedPlan(defaultPlan);
    } else if (product) {
      setSelectedPlan(null);
    }
  }, [pricingPlans, product]);

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

  const currentPrice = selectedPlan?.price ?? product.price;
  const currentOldPrice = selectedPlan?.old_price ?? product.old_price;
  const isOutOfStock = product.stock_status === 'out_of_stock';

  const discount = currentOldPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : 0;

  const cartProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: currentPrice,
    oldPrice: currentOldPrice ?? undefined,
    image: product.image_url,
    category: product.category,
    plan_id: selectedPlan?.id,
    plan_name: selectedPlan?.name,
    requirements: product.requirements,
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(cartProduct);
    toast({
      title: "Added to cart",
      description: `${cartProduct.name} has been added to your cart.`,
    });
    onClose();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(cartProduct);
    onClose();
    navigate('/checkout');
  };

  const handleShareWhatsApp = () => {
    const url = window.location.origin + '/products';
    const text = `Check out ${product.name} on Snippy Mart! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = async () => {
    const url = window.location.origin + '/products';
    await navigator.clipboard.writeText(url);
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
      <DialogContent className="max-w-5xl h-fit min-h-[50vh] p-0 gap-0 overflow-hidden bg-card border-border/50 rounded-[2rem] shadow-2xl">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden max-h-[90vh]">
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
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Image Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
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
          <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-card">
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 pt-12 md:pt-8 custom-scrollbar">

              {/* Mobile Image Gallery */}
              <div className="md:hidden relative aspect-square bg-muted rounded-2xl mb-6 overflow-hidden">
                <img
                  src={allImages[currentImageIndex] || product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />

                {allImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                    {allImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          idx === currentImageIndex ? "bg-white" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Category & Stock */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2 sm:mb-3">
                <span className="inline-block px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                  {product.category}
                </span>
                <StockIndicator status={product.stock_status} />
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 sm:mb-4">
                {product.name}
              </h2>

              {/* Share Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Share:</span>
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
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
                  <p className="text-sm font-medium text-foreground mb-3">Select Plan:</p>
                  <div className="flex flex-wrap gap-2">
                    {pricingPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "relative px-4 py-3 rounded-xl border transition-all duration-200 text-left group",
                          selectedPlan?.id === plan.id
                            ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)] scale-[1.02]"
                            : "border-border hover:border-primary/30 bg-secondary/30 hover:bg-secondary/50"
                        )}
                      >
                        <div className="text-sm font-semibold text-foreground">
                          {plan.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plan.duration}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
                            {formatPrice(plan.price)}
                          </span>
                          {plan.old_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(plan.old_price)}
                            </span>
                          )}
                        </div>
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

              {/* Price Display (when no plans) */}
              {pricingPlans.length === 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(currentPrice)}
                  </span>
                  {currentOldPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(currentOldPrice)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex-shrink-0 p-4 sm:p-6 md:p-8 pt-0 border-t border-border bg-card pb-6 md:pb-8">
              {/* Selected Plan Summary */}
              {selectedPlan && (
                <div className="flex items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Selected:</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">{selectedPlan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      {formatPrice(currentPrice)}
                    </p>
                    {currentOldPrice && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-through">
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
                  className="w-full sm:flex-1 h-12 rounded-xl border-2 font-bold hover:bg-secondary/80 active:scale-95 transition-all"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  <Zap className="w-5 h-5 mr-2 fill-current" />
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

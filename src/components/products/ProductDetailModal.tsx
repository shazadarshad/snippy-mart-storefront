import { useState, useEffect } from 'react';
import { X, ShoppingCart, Zap, Check, Share2, Copy, MessageCircle, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCartStore, formatPrice } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { usePricingPlans, type PricingPlan } from '@/hooks/usePricingPlans';
import { useProductImages } from '@/hooks/useProductImages';
import type { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

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

  // Parse description for formatting
  const formatDescription = (desc: string) => {
    const lines = desc.split('\n').filter(line => line.trim());
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        return (
          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
            <span>{trimmed.replace(/^[\*\-•]\s*/, '')}</span>
          </li>
        );
      }
      if (/^[🔥✨💎🎯🚀💡⭐]/.test(trimmed)) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-foreground mt-4 first:mt-0">
            {trimmed}
          </h3>
        );
      }
      return (
        <p key={idx} className="text-muted-foreground">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] bg-card border border-border rounded-2xl sm:rounded-2xl shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-2 sm:right-4 top-2 sm:top-4 z-10 p-2 rounded-full bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Image Section with Gallery - Hidden on Mobile */}
                <div className="hidden md:block relative w-full md:w-1/2 aspect-square bg-muted flex-shrink-0">
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
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Image Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      -{discount}% OFF
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-12 md:pt-8">
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
                    <div className="space-y-2 mb-6">
                      <ul className="space-y-2">
                        {formatDescription(product.description)}
                      </ul>
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
                                "relative px-4 py-3 rounded-xl border-2 transition-all duration-200",
                                selectedPlan?.id === plan.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 bg-secondary/30"
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
                  <div className="flex-shrink-0 p-4 sm:p-6 md:p-8 pt-0 border-t border-border bg-card">
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
                        className="w-full sm:flex-1 h-11 sm:h-12"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full sm:flex-1 h-11 sm:h-12"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                      >
                        <Zap className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                        {isOutOfStock ? 'Unavailable' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;

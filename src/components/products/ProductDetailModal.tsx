import { useState, useEffect } from 'react';
import { X, ShoppingCart, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCartStore, formatPrice } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { usePricingPlans, type PricingPlan } from '@/hooks/usePricingPlans';
import type { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const { data: pricingPlans = [] } = usePricingPlans(product?.id);
  
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  // Set default plan when plans load
  useEffect(() => {
    if (pricingPlans.length > 0) {
      const defaultPlan = pricingPlans.find(p => p.is_default) || pricingPlans[0];
      setSelectedPlan(defaultPlan);
    } else if (product) {
      // Fallback to product price if no plans
      setSelectedPlan(null);
    }
  }, [pricingPlans, product]);

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
  const planName = selectedPlan?.name ?? '';

  const discount = currentOldPrice
    ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
    : 0;

  const cartProduct = {
    id: selectedPlan ? `${product.id}-${selectedPlan.id}` : product.id,
    name: selectedPlan ? `${product.name} (${selectedPlan.name})` : product.name,
    description: product.description,
    price: currentPrice,
    oldPrice: currentOldPrice ?? undefined,
    image: product.image_url,
    category: product.category,
  };

  const handleAddToCart = () => {
    addItem(cartProduct);
    toast({
      title: "Added to cart",
      description: `${cartProduct.name} has been added to your cart.`,
    });
    onClose();
  };

  const handleBuyNow = () => {
    addItem(cartProduct);
    onClose();
    navigate('/checkout');
  };

  // Parse description for formatting
  const formatDescription = (desc: string) => {
    const lines = desc.split('\n').filter(line => line.trim());
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      // Check for bullet points
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        return (
          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
            <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
            <span>{trimmed.replace(/^[\*\-•]\s*/, '')}</span>
          </li>
        );
      }
      // Check for emoji headers
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-full md:max-w-4xl md:max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex flex-col md:flex-row h-full max-h-[calc(100vh-2rem)] md:max-h-[90vh]">
              {/* Image Section */}
              <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-muted flex-shrink-0">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    -{discount}% OFF
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {/* Category */}
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider mb-3">
                    {product.category}
                  </span>

                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                    {product.name}
                  </h2>

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

                  {/* Description */}
                  <div className="space-y-2">
                    <ul className="space-y-2">
                      {formatDescription(product.description)}
                    </ul>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex-shrink-0 p-6 md:p-8 pt-0">
                  {/* Selected Plan Summary */}
                  {selectedPlan && (
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="text-sm text-muted-foreground">Selected:</p>
                        <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          {formatPrice(currentPrice)}
                        </p>
                        {currentOldPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(currentOldPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="hero"
                      size="lg"
                      className="flex-1"
                      onClick={handleBuyNow}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;

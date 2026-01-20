import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCartStore, formatPrice } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:max-w-md bg-background/95 backdrop-blur-3xl border-l border-white/10 z-50 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col shadow-2xl',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-muted-foreground">
              {items.length} items
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add some amazing subscriptions to get started
              </p>
              <Button variant="default" onClick={onClose} asChild>
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{item.product.name}</h4>
                    {item.product.plan_name && (
                      <p className="text-xs text-muted-foreground truncate">Plan: {item.product.plan_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)}/mo</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90 transition-all"
                        onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                      <button
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-90 transition-all"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-foreground">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border/50 bg-secondary/30 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-2xl font-display font-bold text-foreground">{formatPrice(getTotal())}</span>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
              onClick={onClose}
              asChild
            >
              <Link to="/checkout">
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

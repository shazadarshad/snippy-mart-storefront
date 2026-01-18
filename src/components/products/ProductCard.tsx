import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, formatPrice } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = ({ product, className }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  // Convert Product from useProducts to cart format
  const cartProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.old_price ?? undefined,
    image: product.image_url,
    category: product.category,
  };

  const handleAddToCart = () => {
    addItem(cartProduct);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    addItem(cartProduct);
    navigate('/checkout');
  };

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card border border-border overflow-hidden card-hover",
        className
      )}
    >
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.old_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">/month</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={handleBuyNow}
          >
            <Zap className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

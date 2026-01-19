import { Eye, Star, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  className?: string;
  onViewDetails: (product: Product) => void;
}

const StockBadge = ({ status }: { status?: string }) => {
  if (!status || status === 'in_stock') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-500">
        <Package className="w-3 h-3" />
        In Stock
      </span>
    );
  }
  if (status === 'limited') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
        <AlertTriangle className="w-3 h-3" />
        Limited
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
      <AlertTriangle className="w-3 h-3" />
      Out of Stock
    </span>
  );
};

const ProductCard = ({ product, className, onViewDetails }: ProductCardProps) => {
  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const isOutOfStock = product.stock_status === 'out_of_stock';

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card border border-border overflow-hidden card-hover",
        isOutOfStock && "opacity-75",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.is_featured && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}
        {discount > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            -{discount}%
          </div>
        )}
      </div>

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
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {product.category}
          </span>
          <StockBadge status={product.stock_status} />
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
          <span className="text-xs text-muted-foreground">onwards</span>
        </div>

        {/* View Details Button */}
        <Button
          variant="hero"
          className="w-full"
          onClick={() => onViewDetails(product)}
          disabled={isOutOfStock}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'View Details'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;

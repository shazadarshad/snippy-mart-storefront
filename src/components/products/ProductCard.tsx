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

  const stripFormatting = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '');
  };

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
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-grow relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black font-mono text-primary uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            {product.category.toUpperCase()}
          </span>
          <StockBadge status={product.stock_status} />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-grow">
          {stripFormatting(product.description)}
        </p>

        {/* Separator */}
        <div className="h-px bg-border/50 w-full mb-4" />

        {/* Price & Action */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Starting at</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-display font-black text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-xs text-muted-foreground line-through decoration-destructive decoration-2 opacity-60">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="default" // Changed to default for better contrast with new card style
            className="rounded-xl font-bold text-xs h-9 px-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
            onClick={() => onViewDetails(product)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? (
              <span className="text-[10px]">Sold Out</span>
            ) : (
              <>
                View
                <Eye className="w-3.5 h-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

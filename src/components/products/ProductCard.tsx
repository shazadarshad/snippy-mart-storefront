import { Eye, Star, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
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
  const { formatPrice } = useCurrency();
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
        "group relative rounded-3xl border border-white/5 overflow-hidden card-hover glass-card shadow-2xl shadow-black/20",
        isOutOfStock && "opacity-75",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 ">
        {product.is_featured && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
            <Star className="w-2.5 h-2.5 fill-current" />
            Elite
          </div>
        )}
        {discount > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-lg shadow-primary/30">
            -{discount}%
          </div>
        )}
      </div>

      {/* Image Container with Glow */}
      <div className="relative aspect-square bg-[#0a0a0f] overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors z-10" />
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex flex-col h-full bg-card/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black font-mono text-primary uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
            {product.category.toUpperCase()}
          </span>
          <StockBadge status={product.stock_status} />
        </div>

        <h3 className="text-sm sm:text-lg font-black text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price & Action */}
        <div className="mt-auto space-y-3">
          <div className="flex flex-col items-start">
            <span className="text-[8px] sm:text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-0.5">Starting From</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-2xl font-display font-black text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through opacity-50">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            className="w-full rounded-2xl font-black text-[10px] uppercase tracking-widest h-10 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                <span>ACCESS</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

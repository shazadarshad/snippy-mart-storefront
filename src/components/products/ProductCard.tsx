import { Eye, Star, Package, AlertTriangle, ShoppingBag } from 'lucide-react';
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        In stock
      </span>
    );
  }
  if (status === 'limited') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
        <AlertTriangle className="w-3 h-3" />
        Limited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
      <AlertTriangle className="w-3 h-3" />
      Sold out
    </span>
  );
};

const ProductCard = ({ product, className, onViewDetails }: ProductCardProps) => {
  const { formatPrice } = useCurrency();
  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const isOutOfStock = product.stock_status === 'out_of_stock';

  /** Short plain teaser only — never dump full product body on the card */
  const shortTeaser = (() => {
    if (!product.description) return '';
    const plain = product.description
      .replace(/[*_~`#>]/g, ' ')
      .replace(/[✅⚡♻️✨☁️⚙️•·]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) return '';
    // First sentence-ish chunk, hard cap
    const first = plain.split(/(?<=[.!?])\s+/)[0] || plain;
    const max = 72;
    if (first.length <= max) return first;
    return `${first.slice(0, max).trim()}…`;
  })();

  const open = () => {
    if (!isOutOfStock) onViewDetails(product);
  };

  return (
    <article
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        'group relative flex flex-col rounded-2xl sm:rounded-[1.25rem] border border-border/70 overflow-hidden bg-card/90 backdrop-blur-sm',
        'shadow-sm hover:shadow-xl hover:shadow-primary/8 hover:border-primary/35 transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isOutOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {product.is_featured && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md">
            <Star className="w-2.5 h-2.5 fill-current" />
            Featured
          </div>
        )}
        {discount > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-md">
            -{discount}%
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-secondary/40 overflow-hidden">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background/90 text-[10px] font-bold border border-border backdrop-blur-sm">
            <Eye className="w-3 h-3" />
            View
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 truncate max-w-[60%]">
            {product.category || 'Digital'}
          </span>
          <StockBadge status={product.stock_status} />
        </div>

        <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {shortTeaser ? (
          <p
            className="text-[11px] sm:text-xs text-muted-foreground leading-snug overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            title={shortTeaser}
          >
            {shortTeaser}
          </p>
        ) : null}

        <div className="mt-auto pt-2 space-y-2.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider mb-0.5">
                From
              </p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-display font-black text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.old_price != null && product.old_price > product.price && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatPrice(product.old_price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full rounded-xl font-bold text-xs h-10 shadow-md shadow-primary/10 group-hover:shadow-primary/25 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? (
              'Sold out'
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                View & buy
              </span>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

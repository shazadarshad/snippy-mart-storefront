import { Star, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  className?: string;
  onViewDetails: (product: Product) => void;
}

const ProductCard = ({ product, className, onViewDetails }: ProductCardProps) => {
  const { formatPrice } = useCurrency();
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;
  const soldOut = product.stock_status === 'out_of_stock';
  const limited = product.stock_status === 'limited';

  const teaser = (() => {
    if (!product.description) return '';
    const plain = product.description
      .replace(/[*_~`#>]/g, ' ')
      .replace(/[✅⚡♻️✨☁️⚙️•·]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) return '';
    const first = plain.split(/(?<=[.!?])\s+/)[0] || plain;
    return first.length > 64 ? `${first.slice(0, 64).trim()}…` : first;
  })();

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => !soldOut && onViewDetails(product)}
      className={cn(
        'group text-left w-full flex flex-col overflow-hidden rounded-3xl',
        'border border-border/50 bg-card/90 backdrop-blur-sm',
        'shadow-[var(--shadow-sm)] transition-all duration-500 ease-out',
        'hover:border-primary/45 hover:shadow-[var(--shadow-md)] hover:shadow-primary/15 hover:-translate-y-1.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-55 disabled:pointer-events-none disabled:hover:translate-y-0',
        className
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-secondary/80 via-secondary/40 to-primary/5">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent opacity-90" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md shadow-amber-500/30">
              <Star className="w-3 h-3 fill-current" />
              Hot
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/30">
              −{discount}%
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 border border-border/80 backdrop-blur text-foreground shadow-lg">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-lg bg-secondary/90 border border-border/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {product.category || 'Digital'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-semibold',
              soldOut && 'text-destructive',
              limited && 'text-amber-500',
              !soldOut && !limited && 'text-emerald-500'
            )}
          >
            {(soldOut || limited) && <AlertTriangle className="w-3 h-3" />}
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                soldOut ? 'bg-destructive' : limited ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              )}
            />
            {soldOut ? 'Sold out' : limited ? 'Limited' : 'In stock'}
          </span>
        </div>

        <h3 className="font-display font-semibold text-[15px] sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        {teaser ? (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{teaser}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-border/40">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
              From
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.old_price != null && product.old_price > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
          </div>
          <span className="mb-0.5 rounded-full bg-primary/10 border border-primary/15 px-3.5 py-1.5 text-[11px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
            {soldOut ? 'Sold out' : 'View'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;

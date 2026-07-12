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
        'group text-left w-full flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card',
        'shadow-sm transition-all duration-400 ease-out',
        'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0',
        className
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-secondary/40">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              <Star className="w-3 h-3 fill-current" />
              Hot
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
              −{discount}%
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border backdrop-blur text-foreground">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {product.category || 'Digital'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold',
              soldOut && 'text-destructive',
              limited && 'text-amber-500',
              !soldOut && !limited && 'text-emerald-500'
            )}
          >
            {(soldOut || limited) && <AlertTriangle className="w-3 h-3" />}
            <span className={cn('h-1.5 w-1.5 rounded-full', soldOut ? 'bg-destructive' : limited ? 'bg-amber-500' : 'bg-emerald-500')} />
            {soldOut ? 'Sold out' : limited ? 'Limited' : 'In stock'}
          </span>
        </div>

        <h3 className="font-display font-semibold text-[15px] sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {teaser ? (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{teaser}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-border/50">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">From</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.old_price != null && product.old_price > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
          </div>
          <span className="mb-0.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {soldOut ? 'Sold out' : 'View'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;

import { memo } from 'react';
import { Star, AlertTriangle, ArrowUpRight, Zap } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { isResellerApiProduct, productPriceInLkr } from '@/hooks/useResellerApi';
import { cn } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  className?: string;
  onViewDetails: (product: Product) => void;
  /** Prioritize image decode for above-the-fold cards */
  priority?: boolean;
}

const ProductCard = memo(function ProductCard({
  product,
  className,
  onViewDetails,
  priority = false,
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const priceLkr = productPriceInLkr(product, 'price');
  const oldPriceLkr = product.old_price != null ? productPriceInLkr(product, 'old_price') : null;
  const discount =
    oldPriceLkr != null && oldPriceLkr > priceLkr
      ? Math.round(((oldPriceLkr - priceLkr) / oldPriceLkr) * 100)
      : 0;
  const soldOut = product.stock_status === 'out_of_stock';
  const limited = product.stock_status === 'limited';
  const isAuto = isResellerApiProduct(product);

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
      // Sold-out still openable for details; cart add is blocked in modal/checkout
      onClick={() => onViewDetails(product)}
      aria-label={soldOut ? `${product.name} (sold out)` : product.name}
      className={cn(
        'group text-left w-full min-w-0 flex flex-col overflow-hidden rounded-3xl content-auto',
        'border border-border/45 bg-card/90',
        'shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-200 ease-out',
        'hover:border-primary/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-[3px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        soldOut && 'opacity-75',
        'will-change-transform',
        className
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-secondary/80 via-secondary/40 to-primary/5">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          width={400}
          height={320}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isAuto && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md shadow-emerald-600/30">
              <Zap className="w-3 h-3 fill-current" />
              Auto
            </span>
          )}
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

        {soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground shadow-md">
              Sold out
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 border border-border/70 text-foreground shadow-md">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-lg bg-secondary/90 border border-border/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {product.category &&
            product.category.trim().toLowerCase() !== 'api products'
              ? product.category
              : isAuto
                ? 'Digital'
                : product.category || 'Digital'}
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
            {soldOut
              ? 'Sold out'
              : product.reseller_stock != null && product.reseller_stock > 0
                ? limited
                  ? `${product.reseller_stock} left`
                  : `${product.reseller_stock} in stock`
                : limited
                  ? 'Limited'
                  : 'In stock'}
          </span>
        </div>

        <h3 className="font-display font-semibold text-[15px] sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
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
                {formatPrice(priceLkr)}
              </span>
              {oldPriceLkr != null && oldPriceLkr > priceLkr && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(oldPriceLkr)}
                </span>
              )}
            </div>
          </div>
          <span className="mb-0.5 rounded-full bg-primary/10 border border-primary/15 px-3.5 py-1.5 text-[11px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-200">
            {soldOut ? 'Sold out' : 'View'}
          </span>
        </div>
      </div>
    </button>
  );
});

export default ProductCard;

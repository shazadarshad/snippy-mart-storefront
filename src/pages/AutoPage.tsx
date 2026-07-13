import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Wallet,
  Zap,
  Package,
  RefreshCw,
  ShoppingCart,
  Copy,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Mail,
  Minus,
  Plus,
  Filter,
  Sparkles,
  ShieldCheck,
  Clock,
  BadgePercent,
} from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  type AutoProduct,
  type AutoPurchaseResponse,
  type DeliveredAccount,
  fetchAutoBalance,
  fetchAutoProducts,
  purchaseAutoProduct,
  productUsdPrice,
  productLkrPrice,
  productAvailable,
  productImageUrl,
  formatUsd,
  formatLkr,
  getProductPromotions,
  categorizeProduct,
  AUTO_USD_TO_LKR,
} from '@/lib/autoBuyer';

type StockFilter = 'all' | 'in_stock' | 'out';
type SortKey = 'order' | 'price_asc' | 'price_desc' | 'stock' | 'name';

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

function accountLines(acc: DeliveredAccount): string {
  const parts: string[] = [];
  if (acc.user) parts.push(`User: ${acc.user}`);
  if (acc.password) parts.push(`Pass: ${acc.password}`);
  if (acc.verifyEmail) parts.push(`Recovery: ${acc.verifyEmail}`);
  // fallback dump other string fields
  for (const [k, v] of Object.entries(acc)) {
    if (['user', 'password', 'verifyEmail', 'productItemId', 'deliveredAt'].includes(k)) continue;
    if (typeof v === 'string' && v.trim()) parts.push(`${k}: ${v}`);
  }
  return parts.join('\n') || JSON.stringify(acc, null, 2);
}

const AutoPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('order');

  const [buyProduct, setBuyProduct] = useState<AutoProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [slotMonths, setSlotMonths] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<AutoPurchaseResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ['auto-products'],
    queryFn: fetchAutoProducts,
    staleTime: 30_000,
    retry: 1,
  });

  const balanceQuery = useQuery({
    queryKey: ['auto-balance'],
    queryFn: fetchAutoBalance,
    staleTime: 15_000,
    retry: 1,
  });

  const products = useMemo(
    () => (productsQuery.data?.products ?? []).filter((p): p is AutoProduct => !!p && !!p._id),
    [productsQuery.data?.products]
  );
  const balance = balanceQuery.data;
  const walletUsd =
    typeof balance?.balanceUsd === 'number'
      ? balance.balanceUsd
      : typeof balance?.balance === 'number'
        ? balance.balance
        : 0;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const c = categorizeProduct(p.product_name || '');
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      const name = p.product_name || '';
      const desc = p.description || '';
      const cat = categorizeProduct(name);
      const avail = productAvailable(p);
      if (category !== 'all' && cat !== category) return false;
      if (stockFilter === 'in_stock' && avail <= 0) return false;
      if (stockFilter === 'out' && avail > 0) return false;
      if (q && !`${name} ${desc} ${cat}`.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return productUsdPrice(a) - productUsdPrice(b);
        case 'price_desc':
          return productUsdPrice(b) - productUsdPrice(a);
        case 'stock':
          return productAvailable(b) - productAvailable(a);
        case 'name':
          return (a.product_name || '').localeCompare(b.product_name || '');
        default:
          return (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
      }
    });
    return list;
  }, [products, search, category, stockFilter, sortKey]);

  const inStockCount = products.filter((p) => productAvailable(p) > 0).length;

  const openBuy = useCallback((p: AutoProduct) => {
    setBuyProduct(p);
    setQty(typeof p.quantityFixed === 'number' && p.quantityFixed > 0 ? p.quantityFixed : 1);
    setCustomerEmail('');
    const durations = p.slotDurations?.filter((d) => Number.isFinite(d) && d > 0) ?? [];
    setSlotMonths(p.requiresSlotMonths || p.isSlotProduct ? durations[0] ?? 1 : null);
    setResult(null);
  }, []);

  const closeBuy = () => {
    if (buying) return;
    setBuyProduct(null);
    setResult(null);
  };

  const unitUsd = buyProduct ? productUsdPrice(buyProduct) : 0;
  const lineUsd = unitUsd * qty;
  const lineLkr = Math.round(lineUsd * AUTO_USD_TO_LKR);
  const maxQty = buyProduct
    ? Math.max(1, Math.min(100, productAvailable(buyProduct) || 1))
    : 1;
  const qtyLocked =
    typeof buyProduct?.quantityFixed === 'number' && buyProduct.quantityFixed > 0;

  const handlePurchase = async () => {
    if (!buyProduct) return;

    if (buyProduct.requiresCustomerEmail && !customerEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'This product needs a customer email.',
        variant: 'destructive',
      });
      return;
    }
    if (
      (buyProduct.requiresSlotMonths || buyProduct.isSlotProduct) &&
      (!slotMonths || slotMonths < 1)
    ) {
      toast({
        title: 'Duration required',
        description: 'Select slot duration in months.',
        variant: 'destructive',
      });
      return;
    }

    setBuying(true);
    try {
      const res = await purchaseAutoProduct({
        product_id: buyProduct._id,
        quantity: qty,
        customer_email: customerEmail.trim() || undefined,
        slot_months: slotMonths ?? undefined,
      });
      setResult(res);
      toast({
        title: 'Purchase successful',
        description: res.orderCode
          ? `Order ${res.orderCode} · ${res.finalQuantity ?? qty} item(s)`
          : 'Accounts delivered instantly.',
      });
      queryClient.invalidateQueries({ queryKey: ['auto-balance'] });
      queryClient.invalidateQueries({ queryKey: ['auto-products'] });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Purchase failed';
      toast({
        title: 'Purchase failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBuying(false);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await copyText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const refreshAll = () => {
    productsQuery.refetch();
    balanceQuery.refetch();
  };

  const loading = productsQuery.isLoading;
  const errorMsg =
    productsQuery.error instanceof Error
      ? productsQuery.error.message
      : productsQuery.isError
        ? 'Failed to load auto products'
        : null;

  return (
    <>
      <SEO
        title="Auto Instant Delivery"
        description="Instant digital products — auto stock with live inventory and wallet delivery."
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(172_80%_40%_/_0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(262_70%_50%_/_0.1),_transparent_50%)]" />
          <div className="container relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  Instant auto delivery
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Auto Stock
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Live inventory from our auto supplier. Buy with wallet balance — accounts
                  delivered instantly on success.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Secure proxy checkout
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Instant credentials
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Rate {AUTO_USD_TO_LKR} LKR / $1 display
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                    Wallet
                  </div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {balanceQuery.isLoading ? '…' : formatUsd(walletUsd)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {balance?.balanceText || balance?.walletCurrency || 'USD'}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Products
                  </div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {loading ? '…' : products.length}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {inStockCount} in stock
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:col-span-1">
                  <Button
                    variant="outline"
                    className="h-full w-full gap-2"
                    onClick={refreshAll}
                    disabled={productsQuery.isFetching || balanceQuery.isFetching}
                  >
                    <RefreshCw
                      className={cn(
                        'h-4 w-4',
                        (productsQuery.isFetching || balanceQuery.isFetching) && 'animate-spin'
                      )}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {walletUsd <= 0 && !balanceQuery.isLoading && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Wallet balance is $0.00</p>
                  <p className="text-muted-foreground">
                    Top up the Canboso / bot wallet linked to this buyer key before purchasing.
                    Catalog browsing still works.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="container mx-auto max-w-7xl space-y-3 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search auto products…"
                  className="h-11 pl-9"
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                  <SelectTrigger className="h-11 w-[140px]">
                    <Filter className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stock</SelectItem>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="out">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-11 w-[150px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Default</SelectItem>
                    <SelectItem value="price_asc">Price ↑</SelectItem>
                    <SelectItem value="price_desc">Price ↓</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  category === 'all'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                All ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    category === c.name
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="container mx-auto max-w-7xl px-4 py-8">
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
                />
              ))}
            </div>
          )}

          {errorMsg && !loading && (
            <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
              <h2 className="text-lg font-semibold">Could not load auto catalog</h2>
              <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
              <Button className="mt-4" onClick={refreshAll}>
                Try again
              </Button>
            </div>
          )}

          {!loading && !errorMsg && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No products match your filters.
            </div>
          )}

          {!loading && !errorMsg && filtered.length > 0 && (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
              }}
            >
              {filtered.map((p) => {
                const avail = productAvailable(p);
                const usd = productUsdPrice(p);
                const lkr = productLkrPrice(p);
                const img = productImageUrl(p);
                const promos = getProductPromotions(p);
                const out = avail <= 0;
                const cat = categorizeProduct(p.product_name || '');

                return (
                  <motion.article
                    key={p._id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md',
                      out && 'opacity-75'
                    )}
                  >
                    <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover opacity-90 transition group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="h-10 w-10 text-primary/40" />
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {cat}
                        </Badge>
                      </div>
                      <div className="absolute right-3 top-3">
                        <Badge
                          className={cn(
                            'text-[10px]',
                            out
                              ? 'bg-destructive/90 hover:bg-destructive/90'
                              : 'bg-emerald-600 hover:bg-emerald-600'
                          )}
                        >
                          {out ? 'Out of stock' : `${avail} left`}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {p.product_name}
                      </h3>
                      {p.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground whitespace-pre-line">
                          {p.description}
                        </p>
                      )}

                      {promos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {promos.slice(0, 2).map((pr, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground dark:text-accent"
                            >
                              <BadgePercent className="h-3 w-3" />
                              {pr.type === 'bulk_bonus' || pr.bonusQty
                                ? `Buy ${pr.minQty}+ get +${pr.bonusQty}`
                                : pr.percent
                                  ? `${pr.percent}% off ${pr.minQty}+`
                                  : pr.type || 'Promo'}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <div>
                          <div className="text-lg font-bold tabular-nums text-primary">
                            {formatUsd(usd)}
                          </div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            ~{formatLkr(lkr)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={out}
                          onClick={() => openBuy(p)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Buy
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>

      {/* Buy dialog */}
      <Dialog open={!!buyProduct} onOpenChange={(o) => !o && closeBuy()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6">
              {result?.success ? 'Delivery ready' : 'Instant purchase'}
            </DialogTitle>
            <DialogDescription>
              {result?.success
                ? 'Copy credentials below. Keep them safe.'
                : buyProduct?.product_name}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!result?.success && buyProduct ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                {buyProduct.description && (
                  <div className="max-h-28 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {buyProduct.description}
                  </div>
                )}


                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unit price</span>
                    <span className="font-semibold tabular-nums">
                      {formatUsd(unitUsd)}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        (~{formatLkr(productLkrPrice(buyProduct))})
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <span className="tabular-nums">
                      {productAvailable(buyProduct)} available
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="tabular-nums">{formatUsd(walletUsd)}</span>
                  </div>
                </div>

                {!qtyLocked && (
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={qty <= 1}
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={maxQty}
                        value={qty}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          setQty(Math.min(maxQty, Math.max(1, n)));
                        }}
                        className="h-10 text-center tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={qty >= maxQty}
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {buyProduct?.requiresCustomerEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="auto-email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Customer email
                    </Label>
                    <Input
                      id="auto-email"
                      type="email"
                      placeholder="customer@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                )}

                {(buyProduct?.requiresSlotMonths || buyProduct?.isSlotProduct) && (
                  <div className="space-y-2">
                    <Label>Duration (months)</Label>
                    <Select
                      value={String(slotMonths ?? '')}
                      onValueChange={(v) => setSlotMonths(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select months" />
                      </SelectTrigger>
                      <SelectContent>
                        {(buyProduct?.slotDurations?.length
                          ? buyProduct.slotDurations
                          : [1, 3, 6, 12]
                        ).map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {m} month{m === 1 ? '' : 's'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatUsd(lineUsd)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground tabular-nums">
                    ~{formatLkr(lineLkr)} · charged from wallet
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Order {result.orderCode || 'OK'}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {result.productType} · qty {result.finalQuantity ?? result.quantity}
                    {result.bonusQuantity ? ` (+${result.bonusQuantity} bonus)` : ''}
                  </div>
                  {result.amountText && (
                    <div className="mt-1 text-muted-foreground">Paid {result.amountText}</div>
                  )}
                  {result.balanceText && (
                    <div className="text-muted-foreground">
                      New balance {result.balanceText}
                    </div>
                  )}
                </div>

                {(result.deliveredAccounts?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Delivered accounts</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() =>
                          handleCopy(
                            'all',
                            (result.deliveredAccounts || [])
                              .map((a, i) => `#${i + 1}\n${accountLines(a)}`)
                              .join('\n\n')
                          )
                        }
                      >
                        {copiedKey === 'all' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy all
                      </Button>
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {result.deliveredAccounts!.map((acc, i) => {
                        const text = accountLines(acc);
                        const key = `acc-${i}`;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-border/70 bg-muted/20 p-3 font-mono text-xs"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="font-sans text-[11px] font-medium text-muted-foreground">
                                Item {i + 1}
                              </span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                onClick={() => handleCopy(key, text)}
                              >
                                {copiedKey === key ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                Copy
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap break-all">{text}</pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Purchase succeeded but no account payload was returned. Check the bot /
                    supplier panel for delivery.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-2 sm:gap-0">
            {!result?.success ? (
              <>
                <Button type="button" variant="outline" onClick={closeBuy} disabled={buying}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePurchase}
                  disabled={buying || !buyProduct || productAvailable(buyProduct) <= 0}
                  className="gap-2"
                >
                  {buying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Purchasing…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Pay & deliver
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                  }}
                >
                  Buy again
                </Button>
                <Button type="button" onClick={closeBuy}>
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoPage;

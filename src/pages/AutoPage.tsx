import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
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
  Building2,
  Upload,
  Image as ImageIcon,
  FileText,
  User,
  Phone,
} from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCreateOrder } from '@/hooks/useOrders';
import { generateOrderId } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { cn, getCountry } from '@/lib/utils';
import {
  type AutoProduct,
  type AutoProductGroup,
  type DeliveredAccount,
  fetchAutoProducts,
  purchaseAutoProduct,
  productLkrPrice,
  productUsdPrice,
  productAvailable,
  formatLkr,
  getProductPromotions,
  groupAutoProducts,
  variantLabel,
  displayTitle,
  displayDescription,
  accountLines,
  productProvider,
  providerLabel,
  AUTO_MIN_MARGIN_LKR,
} from '@/lib/autoBuyer';

type StockFilter = 'all' | 'in_stock' | 'out';
type SortKey = 'order' | 'price_asc' | 'price_desc' | 'stock' | 'name';

const AutoPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const createOrder = useCreateOrder();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'canboso' | 'akunding'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('order');
  /** Selected variant id per group key (for card UI) */
  const [cardVariantId, setCardVariantId] = useState<Record<string, string>>({});

  const [buyProduct, setBuyProduct] = useState<AutoProduct | null>(null);
  const [buyGroup, setBuyGroup] = useState<AutoProductGroup | null>(null);
  const [qty, setQty] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [slotMonths, setSlotMonths] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<DeliveredAccount[] | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const orderIdRef = useRef(generateOrderId());

  const bankName = settings?.bank_name || 'Sampath Bank';
  const bankBranch = settings?.bank_branch || 'Horana';
  const bankAccountName = settings?.bank_account_name || 'M A MUSAMMIL';
  const bankAccountNumber = settings?.bank_account_number || '105752093919';

  const productsQuery = useQuery({
    queryKey: ['auto-products-v2'],
    queryFn: fetchAutoProducts,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const products = productsQuery.data ?? [];
  const groups = useMemo(() => groupAutoProducts(products), [products]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of groups) {
      map.set(g.category, (map.get(g.category) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = groups.filter((g) => {
      if (providerFilter !== 'all' && g.provider !== providerFilter) return false;
      if (category !== 'all' && g.category !== category) return false;
      if (stockFilter === 'in_stock' && g.totalAvailable <= 0) return false;
      if (stockFilter === 'out' && g.totalAvailable > 0) return false;
      if (q) {
        const hay = [
          g.title,
          g.description,
          g.category,
          ...g.variants.map((v) => `${v.product_name} ${displayTitle(v)} ${variantLabel(v)}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return a.minLkr - b.minLkr;
        case 'price_desc':
          return b.maxLkr - a.maxLkr;
        case 'stock':
          return b.totalAvailable - a.totalAvailable;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return (a.defaultVariant.displayOrder ?? 999) - (b.defaultVariant.displayOrder ?? 999);
      }
    });
    return list;
  }, [groups, search, category, providerFilter, stockFilter, sortKey]);

  const inStockCount = products.filter((p) => productAvailable(p) > 0).length;

  const resolveCardVariant = (g: AutoProductGroup): AutoProduct => {
    const id = cardVariantId[g.key];
    return g.variants.find((v) => v._id === id) || g.defaultVariant;
  };

  const openBuy = useCallback((p: AutoProduct, group?: AutoProductGroup | null) => {
    setBuyProduct(p);
    setBuyGroup(group || null);
    setQty(typeof p.quantityFixed === 'number' && p.quantityFixed > 0 ? p.quantityFixed : 1);
    setCustomerEmail('');
    const durations = p.slotDurations?.filter((d) => Number.isFinite(d) && d > 0) ?? [];
    setSlotMonths(p.requiresSlotMonths || p.isSlotProduct ? durations[0] ?? 1 : null);
    setNotes('');
    setProofFile(null);
    setDelivery(null);
    setLastOrderId(null);
    orderIdRef.current = generateOrderId();
  }, []);

  const selectBuyVariant = (variantId: string) => {
    if (!buyGroup) return;
    const v = buyGroup.variants.find((x) => x._id === variantId);
    if (!v) return;
    setBuyProduct(v);
    setQty(typeof v.quantityFixed === 'number' && v.quantityFixed > 0 ? v.quantityFixed : 1);
    const durations = v.slotDurations?.filter((d) => Number.isFinite(d) && d > 0) ?? [];
    setSlotMonths(v.requiresSlotMonths || v.isSlotProduct ? durations[0] ?? 1 : null);
  };

  const closeBuy = () => {
    if (submitting) return;
    setBuyProduct(null);
    setBuyGroup(null);
    setDelivery(null);
  };

  const unitLkr = buyProduct ? productLkrPrice(buyProduct) : 0;
  const lineLkr = unitLkr * qty;
  const maxQty = buyProduct
    ? Math.max(1, Math.min(50, productAvailable(buyProduct) || 1))
    : 1;
  const qtyLocked =
    typeof buyProduct?.quantityFixed === 'number' && buyProduct.quantityFixed > 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied` });
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const onProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast({
        title: 'Invalid file',
        description: 'Upload JPG, PNG, WebP or PDF.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Max 10MB.',
        variant: 'destructive',
      });
      return;
    }
    setProofFile(file);
  };

  const handlePlaceOrder = async () => {
    if (!buyProduct) return;

    const wa = whatsapp.trim();
    if (!wa || wa.replace(/\D/g, '').length < 9) {
      toast({
        title: 'WhatsApp required',
        description: 'Enter a valid WhatsApp number so we can reach you.',
        variant: 'destructive',
      });
      return;
    }
    if (!proofFile) {
      toast({
        title: 'Payment proof required',
        description: 'Transfer to our bank account, then upload the receipt screenshot.',
        variant: 'destructive',
      });
      return;
    }
    if (buyProduct.requiresCustomerEmail && !customerEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'This product needs a customer email for delivery.',
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
        description: 'Select how many months.',
        variant: 'destructive',
      });
      return;
    }
    if (productAvailable(buyProduct) < qty) {
      toast({
        title: 'Not enough stock',
        description: 'Reduce quantity or pick another product.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const orderId = orderIdRef.current;

    try {
      // 1) Upload bank transfer screenshot
      const ext = proofFile.name.split('.').pop() || 'jpg';
      const fileName = `auto-${orderId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);
      if (uploadError) throw new Error(uploadError.message || 'Failed to upload payment proof');

      const country = await getCountry();

      // 2) Create store order (pending verification / auto delivery)
      await createOrder.mutateAsync({
        order_number: orderId,
        customer_name: name.trim() || 'Customer',
        customer_whatsapp: wa,
        customer_email: customerEmail.trim() || undefined,
        total_amount: lineLkr,
        notes: [
          '[AUTO STOCK ORDER]',
          `Display name: ${displayTitle(buyProduct)}`,
          `Supplier product (raw): ${buyProduct.product_name}`,
          `Supplier ID: ${buyProduct._id}`,
          `Qty: ${qty}`,
          slotMonths ? `Slot months: ${slotMonths}` : null,
          notes.trim() ? `Customer notes: ${notes.trim()}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        payment_method: 'bank_transfer',
        payment_proof_url: fileName,
        customer_country: country,
        currency_code: 'LKR',
        currency_symbol: 'Rs.',
        currency_rate: 1,
        items: [
          {
            // External auto SKU — not a products table UUID
            // Clean name for customer-facing order; raw kept in credentials
            product_name: `[Auto] ${displayTitle(buyProduct)}`,
            plan_name: variantLabel(buyProduct) || (slotMonths ? `${slotMonths} month(s)` : 'Instant delivery'),
            quantity: qty,
            unit_price: unitLkr,
            total_price: lineLkr,
            customer_credentials: {
              auto_source: productProvider(buyProduct),
              auto_product_id: buyProduct._id,
              auto_provider_product_id:
                buyProduct.provider_product_id ||
                buyProduct._id.replace(/^(canboso|akunding):/, ''),
              auto_product_name: buyProduct.product_name,
              auto_display_name: displayTitle(buyProduct),
              delivery_email: customerEmail.trim() || null,
              slot_months: slotMonths,
              cost_usd: productUsdPrice(buyProduct),
              sell_lkr: unitLkr,
              // Supplier wallet is charged cost_usd only; sell_lkr is customer bank-transfer amount
            },
          },
        ],
      });

      setLastOrderId(orderId);

      // 3) Try instant supplier delivery (uses store wallet — not shown to customer)
      let delivered: DeliveredAccount[] = [];
      let autoOk = false;
      try {
        const purchase = await purchaseAutoProduct({
          product_id: buyProduct._id,
          provider: productProvider(buyProduct),
          quantity: qty,
          customer_email: customerEmail.trim() || undefined,
          slot_months: slotMonths ?? undefined,
          idempotency_key: orderId,
        });
        if (purchase?.success && Array.isArray(purchase.deliveredAccounts)) {
          delivered = purchase.deliveredAccounts;
          autoOk = delivered.length > 0;
        }
      } catch (purchaseErr) {
        // Expected when store wallet is empty — order still placed for admin/manual or later auto
        console.warn('[auto] Instant delivery deferred:', purchaseErr);
      }

      if (autoOk) {
        setDelivery(delivered);
        // Persist delivery into order notes (best effort)
        try {
          const deliveryText = delivered
            .map((a, i) => `#${i + 1}\n${accountLines(a)}`)
            .join('\n\n');
          await supabase
            .from('orders')
            .update({
              notes: [
                '[AUTO STOCK ORDER — DELIVERED]',
                `Order ${orderId}`,
                `Supplier: ${buyProduct.product_name}`,
                `Qty: ${qty}`,
                '',
                'CREDENTIALS:',
                deliveryText,
              ].join('\n'),
              status: 'completed',
            })
            .eq('order_number', orderId);
        } catch {
          /* ignore */
        }

        toast({
          title: 'Order delivered!',
          description: `${orderId} — copy your credentials below.`,
        });
      } else {
        setDelivery([]);
        toast({
          title: 'Order placed',
          description: `${orderId} received. We verify payment and deliver shortly on WhatsApp.`,
        });
      }

      // Refresh stock
      productsQuery.refetch();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Order failed';
      toast({ title: 'Order failed', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = productsQuery.isLoading;
  const errorMsg =
    productsQuery.error instanceof Error
      ? productsQuery.error.message
      : productsQuery.isError
        ? 'Failed to load catalog'
        : null;

  const orderDone = !!lastOrderId;

  return (
    <>
      <SEO
        title="Auto Instant Delivery"
        description="Instant digital products — bank transfer, upload proof, get delivered fast."
      />

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(172_80%_40%_/_0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(262_70%_50%_/_0.1),_transparent_50%)]" />
          <div className="container relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  Instant auto delivery
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Auto Stock</h1>
                <p className="mt-2 text-muted-foreground">
                  Pick a product, pay by bank transfer, upload your receipt — we deliver accounts
                  as soon as payment is confirmed (often instantly when stock is ready).
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Bank transfer checkout
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Upload receipt screenshot
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Fast delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Prices include margin (min LKR {AUTO_MIN_MARGIN_LKR})
                  </span>
                </div>
              </div>

              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Products
                  </div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {loading ? '…' : groups.length}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {products.length} options · {inStockCount} in stock
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <Button
                    variant="outline"
                    className="h-full w-full gap-2"
                    onClick={() => productsQuery.refetch()}
                    disabled={productsQuery.isFetching}
                  >
                    <RefreshCw
                      className={cn('h-4 w-4', productsQuery.isFetching && 'animate-spin')}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
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
                <Select
                  value={providerFilter}
                  onValueChange={(v) => setProviderFilter(v as 'all' | 'canboso' | 'akunding')}
                >
                  <SelectTrigger className="h-11 w-[140px]">
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    <SelectItem value="canboso">Canboso</SelectItem>
                    <SelectItem value="akunding">Akunding</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="flex gap-2 overflow-x-auto pb-1">
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
                All ({groups.length})
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
              <h2 className="text-lg font-semibold">Could not load catalog</h2>
              <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
              <Button className="mt-4" onClick={() => productsQuery.refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!loading && !errorMsg && filteredGroups.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No products match your filters.
            </div>
          )}

          {!loading && !errorMsg && filteredGroups.length > 0 && (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
              }}
            >
              {filteredGroups.map((g) => {
                const selected = resolveCardVariant(g);
                const avail = productAvailable(selected);
                const lkr = productLkrPrice(selected);
                const multi = g.variants.length > 1;
                const out = g.totalAvailable <= 0;
                const promos = getProductPromotions(selected);

                return (
                  <motion.article
                    key={g.key}
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
                      {g.image ? (
                        <img
                          src={g.image}
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
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {g.category}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            g.provider === 'akunding'
                              ? 'bg-violet-600 hover:bg-violet-600'
                              : 'bg-sky-600 hover:bg-sky-600'
                          )}
                        >
                          {providerLabel(g.provider)}
                        </Badge>
                        {multi && (
                          <Badge className="bg-accent text-[10px] text-accent-foreground hover:bg-accent">
                            {g.variants.length} options
                          </Badge>
                        )}
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
                          {out ? 'Out of stock' : `${g.totalAvailable} left`}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {g.title}
                      </h3>
                      {g.description && (
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                          {g.description}
                        </p>
                      )}

                      {multi && (
                        <div className="mt-3 space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Variant</Label>
                          <Select
                            value={selected._id}
                            onValueChange={(id) =>
                              setCardVariantId((prev) => ({ ...prev, [g.key]: id }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {g.variants.map((v) => {
                                const vAvail = productAvailable(v);
                                return (
                                  <SelectItem
                                    key={v._id}
                                    value={v._id}
                                    disabled={vAvail <= 0}
                                    className="text-xs"
                                  >
                                    {variantLabel(v)} · {formatLkr(productLkrPrice(v))}
                                    {vAvail <= 0 ? ' (out)' : ` · ${vAvail} left`}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {promos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {promos.slice(0, 2).map((pr, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              <BadgePercent className="h-3 w-3" />
                              {pr.bonusQty
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
                            {multi && g.minLkr !== g.maxLkr && selected._id === g.defaultVariant._id
                              ? `from ${formatLkr(g.minLkr)}`
                              : formatLkr(lkr)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {multi ? 'selected option' : 'per unit'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={out || avail <= 0}
                          onClick={() => openBuy(selected, g)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Order
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

      <Dialog
        open={!!buyProduct}
        onOpenChange={(o) => {
          if (!o) closeBuy();
        }}
      >
        {buyProduct ? (
          <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="pr-6">
                {orderDone
                  ? delivery && delivery.length > 0
                    ? 'Delivered'
                    : 'Order placed'
                  : 'Checkout'}
              </DialogTitle>
              <DialogDescription>
                {orderDone
                  ? `Order ${lastOrderId}`
                  : buyGroup?.title || displayTitle(buyProduct)}
              </DialogDescription>
            </DialogHeader>

            {!orderDone ? (
              <div className="space-y-4">
                {buyGroup && buyGroup.variants.length > 1 && (
                  <div className="space-y-2">
                    <Label>Choose option / plan</Label>
                    <Select value={buyProduct._id} onValueChange={selectBuyVariant}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {buyGroup.variants.map((v) => {
                          const vAvail = productAvailable(v);
                          return (
                            <SelectItem key={v._id} value={v._id} disabled={vAvail <= 0}>
                              {variantLabel(v)} — {formatLkr(productLkrPrice(v))}
                              {vAvail <= 0 ? ' (out)' : ` · ${vAvail} left`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {displayDescription(buyProduct) && (
                  <div className="max-h-24 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {displayDescription(buyProduct)}
                  </div>
                )}

                <div className="rounded-xl border border-border/70 bg-card p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Selected</span>
                    <span className="max-w-[65%] text-right text-xs font-medium leading-snug">
                      {displayTitle(buyProduct)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="font-semibold tabular-nums">{formatLkr(unitLkr)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <span className="tabular-nums">{productAvailable(buyProduct)} available</span>
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="auto-name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Name
                    </Label>
                    <Input
                      id="auto-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto-wa" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      WhatsApp *
                    </Label>
                    <Input
                      id="auto-wa"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+9477…"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email {buyProduct.requiresCustomerEmail ? '*' : '(optional)'}
                  </Label>
                  <Input
                    id="auto-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>

                {(buyProduct.requiresSlotMonths || buyProduct.isSlotProduct) && (
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
                        {(buyProduct.slotDurations?.length
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

                {/* Bank details */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="h-4 w-4 text-primary" />
                    Pay by bank transfer
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transfer exactly <strong className="text-foreground">{formatLkr(lineLkr)}</strong>{' '}
                    then upload the screenshot.
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { label: 'Bank', value: bankName },
                      { label: 'Branch', value: bankBranch },
                      { label: 'Account name', value: bankAccountName, copy: true },
                      { label: 'Account number', value: bankAccountNumber, copy: true },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-muted-foreground">{row.label}: </span>
                          <span className={cn('font-medium', row.copy && 'font-mono')}>
                            {row.value}
                          </span>
                        </div>
                        {row.copy && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(row.value, row.label)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span>Order ID (put in bank remark if possible)</span>
                      <button
                        type="button"
                        className="font-mono text-primary hover:underline"
                        onClick={() => copyToClipboard(orderIdRef.current, 'Order ID')}
                      >
                        {orderIdRef.current}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment screenshot *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={onProofChange}
                  />
                  {!proofFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      <Upload className="h-6 w-6" />
                      Upload receipt (JPG, PNG, PDF)
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        {proofFile.type === 'application/pdf' ? (
                          <FileText className="h-5 w-5 shrink-0 text-destructive" />
                        ) : (
                          <ImageIcon className="h-5 w-5 shrink-0 text-primary" />
                        )}
                        <span className="truncate">{proofFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProofFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-notes">Notes (optional)</Label>
                  <Textarea
                    id="auto-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any extra info…"
                    rows={2}
                  />
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total to pay</span>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatLkr(lineLkr)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={cn(
                    'rounded-xl border p-3 text-sm',
                    delivery && delivery.length > 0
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-primary/25 bg-primary/5'
                  )}
                >
                  <div className="font-semibold">
                    {delivery && delivery.length > 0
                      ? 'Payment received · product delivered'
                      : 'Order submitted · delivery pending'}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Order <span className="font-mono text-foreground">{lastOrderId}</span>
                    {delivery && delivery.length === 0 && (
                      <>
                        {' '}
                        — we verify your bank transfer and send credentials on WhatsApp as soon as
                        ready. Track anytime on the Track page.
                      </>
                    )}
                  </p>
                </div>

                {delivery && delivery.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Your credentials</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() =>
                          handleCopy(
                            'all',
                            delivery.map((a, i) => `#${i + 1}\n${accountLines(a)}`).join('\n\n')
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
                      {delivery.map((acc, i) => {
                        const text = accountLines(acc);
                        const key = `acc-${i}`;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-border/70 bg-muted/20 p-3 font-mono text-xs"
                          >
                            <div className="mb-2 flex justify-between">
                              <span className="font-sans text-[11px] text-muted-foreground">
                                Item {i + 1}
                              </span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-[11px] text-primary"
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
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {!orderDone ? (
                <>
                  <Button type="button" variant="outline" onClick={closeBuy} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={submitting || productAvailable(buyProduct) <= 0}
                    className="gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Placing order…
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Pay & order · {formatLkr(lineLkr)}
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
                      if (lastOrderId) navigate(`/track-order?order=${lastOrderId}`);
                      else navigate('/track-order');
                    }}
                  >
                    Track order
                  </Button>
                  <Button type="button" onClick={closeBuy}>
                    Done
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
};

export default AutoPage;

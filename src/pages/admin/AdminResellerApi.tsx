import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Save,
  Wallet,
  Package,
  KeyRound,
  CheckCircle2,
  XCircle,
  Copy,
  Zap,
  Download,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  useResellerSettings,
  useSaveResellerSettings,
  useResellerBalance,
  useResellerProducts,
  useResellerDeliveries,
  useImportResellerProducts,
  useRefreshResellerPresentation,
  useRoundApiPricesTo99,
  useSetApiProductPrice,
  isResellerApiProduct,
  calcApiCustomerPriceLkr,
  roundSellLkr,
  DEFAULT_SMART_TIERS,
  RESELLER_USD_TO_LKR,
  RESELLER_DEFAULT_MARKUP_PERCENT,
  RESELLER_DEFAULT_MIN_PROFIT_LKR,
  type ResellerPricingMode,
} from '@/hooks/useResellerApi';
import { usePinProductsToTop, useProducts } from '@/hooks/useProducts';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OFFER_PRODUCT_ORDER = [
  'a16b3eb3-762f-4ce6-b031-6c2f046a2034', // Gemini AI Pro 18 Months — Rs. 499
  '2e2abf9c-f38e-4190-a68a-88e1c6ae4d75', // Linkedin Career 2 Months — Rs. 1,399
  '9159477c-ee6b-4e69-8dfd-c43d10058d06', // Framer Pro 12 Months — Rs. 2,999
  'f5bdddb0-22fc-472f-a73e-e589f9c33d2f', // Granola Business 10 Seats 12 Months — Rs. 2,999
  '7bc6b849-e104-448d-a113-2e6b705f0a9c', // Magic Patterns Starter 12 Months — Rs. 2,999
  '6df0a082-abc2-46f9-8777-bc3c134a2ee4', // Warp Build 12 Months — Rs. 2,999
  'cd309458-8ab5-48d3-85c3-64ae7e1495cb', // Gumloop Pro 12 Months — Rs. 3,999
  'af636a12-996f-4186-bd11-7e738691514f', // Mobbin 10x Seat 12 Months — Rs. 3,999
  '7cddc05a-2793-47fe-b9fd-e53d29657aa4', // Railway Hobby 12 Months — Rs. 3,999
  'dec7d059-86c4-41a8-918c-82f2cfe7b216', // N8N Starter 12 Months — Rs. 5,599
  '5f34107f-94e3-4f59-aca0-f11b9f11bb86', // Notion Business 12 Months — Rs. 5,599
  '0ba14559-d0da-4f99-8977-ef27f270d911', // Replit Core 12 Months — Rs. 6,999
  '7b70fa29-b40b-4eb6-81c0-31f56e0ec95c', // Wispr Flow Pro 12 Months — Rs. 6,999
  '7383de18-2d7e-49da-942a-807842294cea', // Canva Business 12 Months — Rs. 8,999
  '9533ac49-a065-4e1b-bd35-57e00f6367ed', // Supabase Pro — Rs. 9,599
  '71550e06-dc7e-4d87-ae90-484b838dd8e3', // Gamma Pro 12 Months — Rs. 11,999
  '247b32b8-ac94-438f-9c54-ed7764d2b8d6', // Lovablee Pro 12 Months — Rs. 12,999
  '28c6d051-e114-4c67-a71a-3d7f9cb72b9a', // Manus Pro 12 Months — Rs. 13,999
  '8f60bd36-6d15-4ac2-bb94-02ba67a7efa7', // Cursor Pro 12 Months — Rs. 18,999
  '3d49e622-3908-4b5e-9caf-681c09004544', // Higgsfield Pro 12 Months — Rs. 42,999
];

const AdminResellerApi = () => {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } =
    useResellerSettings();
  const saveSettings = useSaveResellerSettings();
  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    error: balanceErr,
    refetch: refetchBalance,
  } = useResellerBalance(!!settings?.has_api_key);
  const { data: remoteProducts = [], isLoading: productsLoading, refetch: refetchProducts } =
    useResellerProducts(!!settings?.has_api_key);
  const { data: deliveries = [], isLoading: deliveriesLoading, refetch: refetchDeliveries } =
    useResellerDeliveries(true);
  const { data: localProducts = [] } = useProducts(true);
  const importProducts = useImportResellerProducts();
  const refreshPresentation = useRefreshResellerPresentation();
  const pinProductsToTop = usePinProductsToTop();
  const roundTo99 = useRoundApiPricesTo99();
  const setApiPrice = useSetApiProductPrice();
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoDeliver, setAutoDeliver] = useState(true);
  const [autoComplete, setAutoComplete] = useState(true);
  const [usdToLkr, setUsdToLkr] = useState(String(RESELLER_USD_TO_LKR));
  const [markupPercent, setMarkupPercent] = useState(String(RESELLER_DEFAULT_MARKUP_PERCENT));
  const [pricingMode, setPricingMode] = useState<ResellerPricingMode>('smart');
  const [minProfitLkr, setMinProfitLkr] = useState(String(RESELLER_DEFAULT_MIN_PROFIT_LKR));
  const [selectedRemote, setSelectedRemote] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!settings) return;
    setBaseUrl(settings.base_url || '');
    setIsEnabled(!!settings.is_enabled);
    setAutoDeliver(settings.auto_deliver_on_processing !== false);
    setAutoComplete(settings.auto_complete_on_success !== false);
    setUsdToLkr(String(settings.usd_to_lkr ?? RESELLER_USD_TO_LKR));
    setMarkupPercent(String(settings.markup_percent ?? RESELLER_DEFAULT_MARKUP_PERCENT));
    setPricingMode(settings.pricing_mode === 'fixed' ? 'fixed' : 'smart');
    setMinProfitLkr(String(settings.min_profit_lkr ?? RESELLER_DEFAULT_MIN_PROFIT_LKR));
  }, [settings]);

  const rateNum = Number(usdToLkr) > 0 ? Number(usdToLkr) : RESELLER_USD_TO_LKR;
  const markupNum =
    Number.isFinite(Number(markupPercent)) && Number(markupPercent) >= 0
      ? Number(markupPercent)
      : RESELLER_DEFAULT_MARKUP_PERCENT;
  const minProfitNum =
    Number.isFinite(Number(minProfitLkr)) && Number(minProfitLkr) >= 0
      ? Number(minProfitLkr)
      : RESELLER_DEFAULT_MIN_PROFIT_LKR;
  const priceOpts = {
    rate: rateNum,
    pricingMode,
    markupPercent: markupNum,
    minProfitLkr: minProfitNum,
  };
  const exampleCosts = [300, 500, 1200, 2500, 5000, 10000];

  const existingResellerIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of localProducts as any[]) {
      if (p.reseller_product_id) set.add(String(p.reseller_product_id));
    }
    return set;
  }, [localProducts]);

  const apiLocalProducts = useMemo(
    () => (localProducts as any[]).filter((p) => isResellerApiProduct(p)),
    [localProducts],
  );

  // The custom-price table must show the current supplier charge, not a stale
  // import-time snapshot. Stored cost remains a fallback while the API loads.
  const livePanelCosts = useMemo(() => {
    const costs = new Map<string, number>();
    for (const product of remoteProducts) {
      const cost = Number(product.price);
      if (Number.isFinite(cost) && cost >= 0) costs.set(String(product.id), cost);
    }
    return costs;
  }, [remoteProducts]);

  const newRemoteCount = remoteProducts.filter((rp) => !existingResellerIds.has(String(rp.id))).length;

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync({
        api_key: apiKey.trim() || undefined,
        base_url: baseUrl.trim() || undefined,
        is_enabled: isEnabled,
        auto_deliver_on_processing: autoDeliver,
        auto_complete_on_success: autoComplete,
        usd_to_lkr: rateNum,
        markup_percent: markupNum,
        pricing_mode: pricingMode,
        min_profit_lkr: minProfitNum,
      });
      setApiKey('');
      toast({
        title: 'Settings saved',
        description: 'Reseller API configuration updated.',
      });
      refetchBalance();
      refetchProducts();
    } catch (e: any) {
      toast({
        title: 'Save failed',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const balanceDisplay = (() => {
    if (!balance) return null;
    if (typeof balance === 'number') return `$${balance.toFixed(2)} USDT`;
    if (typeof balance.balance === 'number') return `$${Number(balance.balance).toFixed(2)} USDT`;
    if (typeof balance.balance === 'string') return `${balance.balance} USDT`;
    if (balance.amount != null) return `$${Number(balance.amount).toFixed(2)} USDT`;
    if (balance.usdt != null) return `$${Number(balance.usdt).toFixed(2)} USDT`;
    try {
      return JSON.stringify(balance);
    } catch {
      return String(balance);
    }
  })();

  const runImport = async (productIds?: string[]) => {
    try {
      const res = await importProducts.mutateAsync({
        productIds,
        markActive: true,
      });
      toast({
        title: res.added > 0 ? 'Products added' : 'Nothing new to add',
        description:
          res.added > 0
            ? `Added ${res.added} new API product(s). Skipped ${res.skipped} already in catalog. Your existing store products were not changed.`
            : `All selected/remote products are already in your catalog (${res.skipped} skipped). Existing products left as-is.`,
      });
      setSelectedRemote(new Set());
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    }
  };

  const toggleRemote = (id: string) => {
    setSelectedRemote((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied' });
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-8">
      <div className="admin-page-header mb-0 items-start">
        <div className="min-w-0">
          <h1 className="admin-page-title">Reseller API</h1>
          <p className="admin-page-subtitle max-w-xl">
            Top up USDT on the seller panel, import products as <strong>new</strong> catalog items,
            and auto-deliver on purchase.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-xl touch-manipulation shrink-0"
          onClick={() => {
            refetchSettings();
            refetchBalance();
            refetchProducts();
            refetchDeliveries();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 admin-stagger">
        <div className="admin-stat p-4 sm:p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Wallet className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Panel balance</p>
          </div>
          {balanceLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : balanceError ? (
            <p className="text-sm text-destructive">
              {(balanceErr as Error)?.message || 'Could not load balance'}
            </p>
          ) : (
            <p className="text-2xl font-black">{balanceDisplay || '—'}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Top up on the seller dashboard. Delivery deducts this balance.
          </p>
        </div>
        <div className="admin-stat p-4 sm:p-5">
          <div className="flex items-center gap-2 text-primary mb-2">
            <KeyRound className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">API key</p>
          </div>
          <p className="text-sm font-mono font-bold break-all">
            {settingsLoading
              ? '…'
              : settings?.has_api_key
                ? settings.api_key_preview
                : 'Not configured'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            {settings?.is_enabled ? (
              <span className="text-success font-bold">Enabled</span>
            ) : (
              <span className="text-muted-foreground">Disabled</span>
            )}
          </p>
        </div>
        <div className="admin-stat p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Package className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">API products</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
            {apiLocalProducts.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Separate from normal products · {newRemoteCount} new to import
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="admin-card p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wider">Connection settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>API key</Label>
            <Input
              type="password"
              placeholder={
                settings?.has_api_key
                  ? 'Leave blank to keep current key'
                  : 'vex_sk_… paste from seller panel'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored server-side only. Never exposed to the storefront.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="font-mono text-xs"
              placeholder="https://…/functions/v1/reseller-api"
            />
          </div>
        </div>

        {/* Margin: smart tiers vs fixed % */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Customer margin (smart pricing)
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Panel only deducts API <strong>$ cost</strong>. Customers pay a higher LKR sell price.
              <strong> Smart mode</strong> uses lower % on expensive products and higher % on cheap
              ones + a minimum profit floor — not one fixed % for everything.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Pricing mode</Label>
              <Select
                value={pricingMode}
                onValueChange={(v) => setPricingMode(v as ResellerPricingMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">Smart tiers (recommended)</SelectItem>
                  <SelectItem value="fixed">Fixed % all products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>USD → LKR rate (cost)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={usdToLkr}
                onChange={(e) => setUsdToLkr(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">$1 cost = Rs. {rateNum}</p>
            </div>
            <div className="space-y-2">
              <Label>Min profit (LKR)</Label>
              <Input
                type="number"
                min={0}
                step={50}
                value={minProfitLkr}
                onChange={(e) => setMinProfitLkr(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Never profit less than this</p>
            </div>
            <div className="space-y-2">
              <Label>Fixed markup % {pricingMode === 'smart' && '(only if Fixed mode)'}</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                disabled={pricingMode === 'smart'}
              />
            </div>
          </div>

          {pricingMode === 'smart' && (
            <div className="overflow-x-auto rounded-lg border border-border bg-background/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>If your cost LKR is…</TableHead>
                    <TableHead>Markup used</TableHead>
                    <TableHead>Example cost → sell</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEFAULT_SMART_TIERS.map((t, i) => {
                    const sample =
                      i === 0
                        ? Math.round(t.upToCostLkr * 0.75)
                        : Math.round(
                            (DEFAULT_SMART_TIERS[i - 1].upToCostLkr +
                              Math.min(t.upToCostLkr, 20000)) /
                              2,
                          );
                    const costSample = Math.min(sample, t.upToCostLkr === 1e12 ? 12000 : t.upToCostLkr);
                    // reverse from cost LKR to fake USD for calc
                    const fakeUsd = costSample / rateNum;
                    const p = calcApiCustomerPriceLkr(fakeUsd, priceOpts);
                    const label =
                      t.upToCostLkr >= 1e11
                        ? 'Above previous band'
                        : `Up to Rs. ${t.upToCostLkr.toLocaleString()}`;
                    return (
                      <TableRow key={t.upToCostLkr}>
                        <TableCell className="text-xs font-medium">{label}</TableCell>
                        <TableCell className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {t.markupPercent}%
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          Rs. {p.costLkr.toLocaleString()} →{' '}
                          <span className="font-bold text-foreground">
                            Rs. {p.sellLkr.toLocaleString()}
                          </span>{' '}
                          (profit {p.profitLkr.toLocaleString()})
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {exampleCosts.map((cost) => {
              const p = calcApiCustomerPriceLkr(cost / rateNum, priceOpts);
              return (
                <div
                  key={cost}
                  className="rounded-lg border border-border bg-background/80 px-2 py-2 text-[10px]"
                >
                  <p className="text-muted-foreground">Cost {cost.toLocaleString()}</p>
                  <p className="font-black text-sm text-foreground">
                    Rs. {p.sellLkr.toLocaleString()}
                  </p>
                  <p className="text-emerald-600">+{p.markupPercent}% · profit {p.profitLkr}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sell prices round up to <strong>xx99</strong> (e.g. 368 → 399, 400 → 499). You can set a
            custom customer price per product below or in Admin → Products — that does not change
            panel cost.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
            {[368, 420, 500, 890, 1200].map((n) => (
              <span key={n} className="px-2 py-1 rounded bg-background border border-border">
                {n} → {roundSellLkr(n)}
              </span>
            ))}
          </div>
        </div>

        {/* Custom customer prices for imported API products */}
        {apiLocalProducts.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Custom customer prices</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Set what users pay (LKR). Panel cost is live from the reseller API. Saves as xx99.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={roundTo99.isPending}
                onClick={async () => {
                  try {
                    const res = await roundTo99.mutateAsync();
                    toast({
                      title: `Rounded ${res.updated} price(s) to .99`,
                      description:
                        res.samples?.length > 0
                          ? res.samples.join(' · ')
                          : `Checked ${res.total} API products.`,
                    });
                  } catch (e: any) {
                    toast({
                      title: 'Round failed',
                      description: e.message,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                {roundTo99.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Round all existing to .99
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pinProductsToTop.isPending}
                onClick={async () => {
                  try {
                    const result = await pinProductsToTop.mutateAsync(OFFER_PRODUCT_ORDER);
                    toast({
                      title: 'Offer products moved to the top',
                      description: `${result.moved} selected products are now at the top from lowest to highest price.`,
                    });
                  } catch (e: any) {
                    toast({
                      title: 'Could not update order',
                      description: e.message,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                {pinProductsToTop.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Move 20 offers to top · lowest price first
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={refreshPresentation.isPending}
                onClick={async () => {
                  try {
                    const result = await refreshPresentation.mutateAsync({
                      productIds: OFFER_PRODUCT_ORDER,
                    });
                    toast({
                      title: 'Offer product details refreshed',
                      description: `${result.updated} selected products refreshed from the reseller API; ${result.descUpdated ?? 0} API descriptions applied.`,
                    });
                  } catch (e: any) {
                    toast({
                      title: 'Could not refresh offer details',
                      description: e.message,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                {refreshPresentation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refresh 20 offer products from API
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Panel cost</TableHead>
                    <TableHead>Customer price (LKR)</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLocalProducts.map((p: any) => {
                    const draft =
                      priceDrafts[p.id] ??
                      String(Math.round(Number(p.price) || 0));
                    const liveCost = livePanelCosts.get(String(p.reseller_product_id));
                    const panelCost = liveCost ?? p.reseller_cost_usd;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium max-w-[200px]">
                          <span className="line-clamp-2">{p.name}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {panelCost != null ? (
                            <div className="space-y-0.5">
                              <div>${Number(panelCost).toFixed(2)}</div>
                              <div className="font-medium text-foreground/80">
                                Rs. {(Number(panelCost) * rateNum).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="1"
                            min={99}
                            className="h-9 w-28 font-mono"
                            value={draft}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                          />
                          <span className="text-[10px] text-muted-foreground ml-2">
                            → {roundSellLkr(Number(draft) || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            disabled={setApiPrice.isPending}
                            onClick={async () => {
                              try {
                                const saved = await setApiPrice.mutateAsync({
                                  productId: p.id,
                                  priceLkr: Number(draft),
                                });
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: String(saved.price),
                                }));
                                toast({
                                  title: 'Price saved',
                                  description: `${saved.name}: Rs. ${saved.price}`,
                                });
                              } catch (e: any) {
                                toast({
                                  title: 'Save failed',
                                  description: e.message,
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!isEnabled && settings?.has_api_key && (
          <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm text-amber-900 dark:text-amber-100">
            <strong>Master switch is OFF.</strong> Status → Payment confirmed will{' '}
            <em>not</em> auto-deliver. Turn on “Enable auto-delivery” and click{' '}
            <strong>Save settings</strong>. You can still deliver one order from Admin → Orders using
            “Deliver via Reseller API”.
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="reseller-enabled" />
            <Label htmlFor="reseller-enabled" className="cursor-pointer">
              Enable auto-delivery (master)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={autoDeliver} onCheckedChange={setAutoDeliver} id="auto-deliver" />
            <Label htmlFor="auto-deliver" className="cursor-pointer">
              When status → Payment confirmed (only if master is ON)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={autoComplete} onCheckedChange={setAutoComplete} id="auto-complete" />
            <Label htmlFor="auto-complete" className="cursor-pointer">
              Mark order completed on success
            </Label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save settings
        </Button>
      </div>

      {/* Import from API — add only, never replace */}
      <div className="p-6 rounded-2xl border border-emerald-500/25 bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-black uppercase tracking-wider">Import API products</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Adds seller catalog items as <strong>new</strong> products (never replaces yours).
              Titles, descriptions, and images are rewritten for customers (proper grammar + store
              layout). Images are branded cards with an <strong>Auto Product</strong> subtitle.
              Use <strong>Refresh catalog details</strong> to update products already imported, including
              their supplier panel cost. Your custom customer prices stay unchanged.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={apiLocalProducts.length === 0 || refreshPresentation.isPending}
              onClick={async () => {
                try {
                  const res = await refreshPresentation.mutateAsync();
                  const sample =
                    res.samples?.length > 0
                      ? ` Examples: ${res.samples.slice(0, 2).join('; ')}`
                      : ' Titles already clean or re-applied.';
                  toast({
                    title: `Refreshed ${res.updated} product(s)`,
                    description: `Titles, stock, images, and ${res.costUpdated ?? 0} panel cost(s) updated. Descriptions rewritten per product from API (${res.descUpdated ?? 0} with API text). Custom customer prices unchanged.${sample}${
                      res.failed ? ` (${res.failed} failed)` : ''
                    }${res.errors?.length ? ` ${res.errors[0]}` : ''}`,
                  });
                } catch (e: any) {
                  toast({
                    title: 'Refresh failed',
                    description: e.message,
                    variant: 'destructive',
                  });
                }
              }}
            >
              {refreshPresentation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh catalog details
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!settings?.has_api_key || selectedRemote.size === 0 || importProducts.isPending}
              onClick={() => runImport([...selectedRemote])}
            >
              {importProducts.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add selected ({selectedRemote.size})
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              size="sm"
              disabled={!settings?.has_api_key || newRemoteCount === 0 || importProducts.isPending}
              onClick={() => runImport()}
            >
              {importProducts.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Add all new ({newRemoteCount})
            </Button>
          </div>
        </div>

        {!settings?.has_api_key ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Save an API key first to load the seller catalog.
          </p>
        ) : productsLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : remoteProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No products returned from the seller API.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Seller product</TableHead>
                  <TableHead>API $ (cost)</TableHead>
                  <TableHead>Your cost LKR</TableHead>
                  <TableHead>Customer sees</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>In your store</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remoteProducts.map((rp) => {
                  const id = String(rp.id);
                  const already = existingResellerIds.has(id);
                  const usd = Number(rp.price);
                  const pricing = Number.isFinite(usd)
                    ? calcApiCustomerPriceLkr(usd, priceOpts)
                    : null;
                  return (
                    <TableRow
                      key={id}
                      className={cn(already && 'bg-emerald-500/5')}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          disabled={already}
                          checked={selectedRemote.has(id)}
                          onChange={() => toggleRemote(id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{rp.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground break-all">{id}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {Number.isFinite(usd) ? `$${usd}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pricing ? `Rs. ${pricing.costLkr.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {pricing ? `Rs. ${pricing.sellLkr.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{rp.stock != null ? String(rp.stock) : '—'}</TableCell>
                      <TableCell>
                        {already ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Already added
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not in catalog</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Recent deliveries */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider">Recent deliveries</h2>
        {deliveriesLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reseller deliveries yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery data</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(d.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {(d.orders as any)?.order_number || d.order_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm">{d.product_name}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-bold',
                          d.status === 'delivered' && 'text-success',
                          d.status === 'failed' && 'text-destructive',
                          d.status === 'pending' && 'text-muted-foreground',
                        )}
                      >
                        {d.status === 'delivered' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : d.status === 'failed' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : null}
                        {d.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {d.delivered_data ? (
                        <button
                          type="button"
                          className="font-mono text-xs truncate max-w-full text-left hover:text-primary"
                          onClick={() => copyText(d.delivered_data!)}
                          title="Click to copy"
                        >
                          {d.delivered_data}
                          <Copy className="w-3 h-3 inline ml-1 opacity-50" />
                        </button>
                      ) : (
                        <span className="text-xs text-destructive">
                          {d.error_message || '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.amount != null ? `$${Number(d.amount).toFixed(2)}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResellerApi;

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
  isResellerApiProduct,
  calcApiCustomerPriceLkr,
  DEFAULT_SMART_TIERS,
  RESELLER_USD_TO_LKR,
  RESELLER_DEFAULT_MARKUP_PERCENT,
  RESELLER_DEFAULT_MIN_PROFIT_LKR,
  type ResellerPricingMode,
} from '@/hooks/useResellerApi';
import { useProducts } from '@/hooks/useProducts';
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight">Reseller API</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Top up USDT on the seller panel, import their products as <strong>new</strong> catalog
            items (never replaces your existing products), and auto-deliver on purchase.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card">
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
        <div className="p-5 rounded-2xl border border-border bg-card">
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
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Package className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">API products in store</p>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {apiLocalProducts.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Separate from your normal store products · {newRemoteCount} new available to import
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
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
            Prices round up to nearest Rs. 50. You can still edit any product sell price manually in
            Admin → Products after import.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="reseller-enabled" />
            <Label htmlFor="reseller-enabled" className="cursor-pointer">
              Enable auto-delivery
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={autoDeliver} onCheckedChange={setAutoDeliver} id="auto-deliver" />
            <Label htmlFor="auto-deliver" className="cursor-pointer">
              Auto-deliver when status → processing
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
              Use <strong>Refresh titles and images</strong> to upgrade products already imported.
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
                    description: `Titles, descriptions, stock, and images updated. Prices unchanged.${sample}${
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
              Refresh titles and images
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

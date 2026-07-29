import { useState, useEffect } from 'react';
import {
  Building2,
  Bitcoin,
  Save,
  Plus,
  Trash2,
  Wallet,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import {
  DEFAULT_CRYPTO_LKR_PER_USD,
  DEFAULT_CRYPTO_MARKUP_PERCENT,
  DEFAULT_CRYPTO_WALLETS,
  parseCryptoSettings,
  type CryptoWallet,
} from '@/lib/cryptoPayments';

const PaymentSettingsSection = () => {
  const { toast } = useToast();
  const { data: siteSettings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [bankSettings, setBankSettings] = useState({
    bank_name: 'Sampath Bank',
    bank_branch: 'Horana',
    bank_account_name: 'M A MUSAMMIL',
    bank_account_number: '105752093919',
  });

  const [binanceSettings, setBinanceSettings] = useState({
    binance_id: '1190172947',
    binance_name: 'Snippy Mart',
    binance_coin: 'USDT',
  });

  const [upiId, setUpiId] = useState('7411760671-3@ybl');

  const [markupPercent, setMarkupPercent] = useState(String(DEFAULT_CRYPTO_MARKUP_PERCENT));
  const [lkrPerUsd, setLkrPerUsd] = useState(String(DEFAULT_CRYPTO_LKR_PER_USD));
  const [wallets, setWallets] = useState<CryptoWallet[]>(
    DEFAULT_CRYPTO_WALLETS.map((w) => ({ ...w })),
  );

  useEffect(() => {
    if (!siteSettings) return;
    setBankSettings({
      bank_name: siteSettings.bank_name || 'Sampath Bank',
      bank_branch: siteSettings.bank_branch || 'Horana',
      bank_account_name: siteSettings.bank_account_name || 'M A MUSAMMIL',
      bank_account_number: siteSettings.bank_account_number || '105752093919',
    });
    setBinanceSettings({
      binance_id: siteSettings.binance_id || '1190172947',
      binance_name: siteSettings.binance_name || 'Snippy Mart',
      binance_coin: siteSettings.binance_coin || 'USDT',
    });
    setUpiId(
      (siteSettings as any).upi_id ||
        (siteSettings as any).upi_vpa ||
        '7411760671-3@ybl',
    );
    const crypto = parseCryptoSettings(
      siteSettings.crypto_wallets,
      siteSettings.crypto_markup_percent,
      siteSettings.crypto_lkr_per_usd,
    );
    setWallets(crypto.wallets);
    setMarkupPercent(String(crypto.markup_percent));
    setLkrPerUsd(String(crypto.lkr_per_usd));
  }, [siteSettings]);

  const handleSaveBankSettings = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'bank_name', value: bankSettings.bank_name }),
        updateSetting.mutateAsync({ key: 'bank_branch', value: bankSettings.bank_branch }),
        updateSetting.mutateAsync({ key: 'bank_account_name', value: bankSettings.bank_account_name }),
        updateSetting.mutateAsync({ key: 'bank_account_number', value: bankSettings.bank_account_number }),
      ]);
      toast({ title: 'Bank settings saved', description: 'Bank transfer details updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save bank settings.', variant: 'destructive' });
    }
  };

  const handleSaveBinanceSettings = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'binance_id', value: binanceSettings.binance_id }),
        updateSetting.mutateAsync({ key: 'binance_name', value: binanceSettings.binance_name }),
        updateSetting.mutateAsync({ key: 'binance_coin', value: binanceSettings.binance_coin }),
      ]);
      toast({ title: 'Binance settings saved', description: 'Binance Pay details updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save Binance settings.', variant: 'destructive' });
    }
  };

  const handleSaveUpi = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'upi_id', value: upiId.trim() });
      toast({ title: 'UPI saved', description: 'Checkout UPI ID updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save UPI ID.', variant: 'destructive' });
    }
  };

  const handleSaveCrypto = async () => {
    const markup = Number(markupPercent);
    const rate = Number(lkrPerUsd);
    if (!Number.isFinite(markup) || markup < 0 || markup > 25) {
      toast({
        title: 'Invalid markup',
        description: 'Safety markup must be between 0 and 25%.',
        variant: 'destructive',
      });
      return;
    }
    if (!Number.isFinite(rate) || rate < 100 || rate > 1000) {
      toast({
        title: 'Invalid LKR rate',
        description: 'LKR per USD should be a realistic number (e.g. 320–370).',
        variant: 'destructive',
      });
      return;
    }

    const cleaned = wallets.map((w) => ({
      ...w,
      symbol: w.symbol.trim().toUpperCase(),
      address: w.address.trim(),
      network: w.network.trim(),
      name: w.name.trim() || w.symbol,
      coingecko_id: w.coingecko_id.trim().toLowerCase() || 'tether',
      decimals: Math.min(12, Math.max(0, Math.floor(Number(w.decimals) || 6))),
    }));

    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'crypto_wallets', value: JSON.stringify(cleaned) }),
        updateSetting.mutateAsync({ key: 'crypto_markup_percent', value: String(markup) }),
        updateSetting.mutateAsync({ key: 'crypto_lkr_per_usd', value: String(rate) }),
      ]);
      toast({
        title: 'Crypto settings saved',
        description: 'Wallets and conversion safety settings are live on checkout.',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to save crypto settings.', variant: 'destructive' });
    }
  };

  const updateWallet = (id: string, patch: Partial<CryptoWallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const addWallet = () => {
    setWallets((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        symbol: 'USDT',
        name: 'Custom wallet',
        network: 'Network',
        address: '',
        coingecko_id: 'tether',
        decimals: 2,
        is_active: false,
      },
    ]);
  };

  const removeWallet = (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-secondary/50 rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      {/* Bank Transfer Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bank Transfer</h2>
            <p className="text-sm text-muted-foreground">Configure bank transfer payment details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={bankSettings.bank_name}
                onChange={(e) => setBankSettings((p) => ({ ...p, bank_name: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label htmlFor="bank_branch">Branch</Label>
              <Input
                id="bank_branch"
                value={bankSettings.bank_branch}
                onChange={(e) => setBankSettings((p) => ({ ...p, bank_branch: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bank_account_name">Account Name</Label>
            <Input
              id="bank_account_name"
              value={bankSettings.bank_account_name}
              onChange={(e) => setBankSettings((p) => ({ ...p, bank_account_name: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
          </div>
          <div>
            <Label htmlFor="bank_account_number">Account Number</Label>
            <Input
              id="bank_account_number"
              value={bankSettings.bank_account_number}
              onChange={(e) => setBankSettings((p) => ({ ...p, bank_account_number: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border font-mono"
            />
          </div>
          <Button onClick={handleSaveBankSettings} disabled={updateSetting.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Bank Settings
          </Button>
        </div>
      </div>

      {/* UPI India */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <span className="text-lg font-black text-orange-500">₹</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">UPI (India)</h2>
            <p className="text-sm text-muted-foreground">
              VPA shown on checkout for GPay / PhonePe / UPI apps
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="upi_id">UPI ID (VPA)</Label>
            <Input
              id="upi_id"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@ybl"
              className="mt-1.5 bg-secondary/50 border-border font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: 7411760671-3@ybl — customers pay this and upload a screenshot.
            </p>
          </div>
          <Button
            onClick={handleSaveUpi}
            disabled={updateSetting.isPending}
            variant="outline"
            className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save UPI ID
          </Button>
        </div>
      </div>

      {/* Binance Pay */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-[#F0B90B]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Binance Pay</h2>
            <p className="text-sm text-muted-foreground">
              Shown inside the Crypto modal as Binance option
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="binance_name">Account Name</Label>
              <Input
                id="binance_name"
                value={binanceSettings.binance_name}
                onChange={(e) => setBinanceSettings((p) => ({ ...p, binance_name: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label htmlFor="binance_coin">Coin</Label>
              <Input
                id="binance_coin"
                value={binanceSettings.binance_coin}
                onChange={(e) => setBinanceSettings((p) => ({ ...p, binance_coin: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="binance_id">Binance ID</Label>
            <Input
              id="binance_id"
              value={binanceSettings.binance_id}
              onChange={(e) => setBinanceSettings((p) => ({ ...p, binance_id: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border font-mono"
            />
          </div>
          <Button
            onClick={handleSaveBinanceSettings}
            disabled={updateSetting.isPending}
            variant="outline"
            className="border-[#F0B90B]/30 text-[#F0B90B] hover:bg-[#F0B90B]/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Binance Settings
          </Button>
        </div>
      </div>

      {/* Crypto wallets + conversion safety */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Crypto wallets & rates</h2>
            <p className="text-sm text-muted-foreground">
              On-chain addresses customers can pay to (with live converted amounts)
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground mb-6 mt-4">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Conversion always <strong className="text-foreground">rounds up</strong> and adds your
            safety markup so you never receive less than the LKR order value. Amounts use live USD
            coin prices (CoinGecko) + your LKR/USD rate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="crypto_markup">Safety markup (%)</Label>
            <Input
              id="crypto_markup"
              type="number"
              min={0}
              max={25}
              step={0.5}
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              className="mt-1.5 bg-secondary/50 border-border"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Recommended 1.5–3%. Extra buffer on top of market rate.
            </p>
          </div>
          <div>
            <Label htmlFor="crypto_lkr_usd">LKR per 1 USD (crypto quotes)</Label>
            <Input
              id="crypto_lkr_usd"
              type="number"
              min={100}
              max={1000}
              step={1}
              value={lkrPerUsd}
              onChange={(e) => setLkrPerUsd(e.target.value)}
              className="mt-1.5 bg-secondary/50 border-border"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Default 320 LKR per USD. System also applies a tiny extra safety factor automatically.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={w.is_active}
                    onCheckedChange={(v) => updateWallet(w.id, { is_active: v })}
                  />
                  <span className="text-sm font-semibold">
                    {w.symbol} · {w.network || 'Network'}
                  </span>
                  {!w.address && w.is_active && (
                    <span className="text-[10px] text-destructive font-bold">Needs address</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => removeWallet(w.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Symbol</Label>
                  <Input
                    value={w.symbol}
                    onChange={(e) => updateWallet(w.id, { symbol: e.target.value.toUpperCase() })}
                    className="mt-1 h-9 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={w.name}
                    onChange={(e) => updateWallet(w.id, { name: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Network</Label>
                  <Input
                    value={w.network}
                    onChange={(e) => updateWallet(w.id, { network: e.target.value })}
                    className="mt-1 h-9"
                    placeholder="TRC20 / ERC20 / BEP20"
                  />
                </div>
                <div>
                  <Label className="text-xs">Decimals</Label>
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={w.decimals}
                    onChange={(e) => updateWallet(w.id, { decimals: Number(e.target.value) || 0 })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Wallet address</Label>
                  <Input
                    value={w.address}
                    onChange={(e) => updateWallet(w.id, { address: e.target.value })}
                    className="mt-1 h-9 font-mono text-xs"
                    placeholder="Paste deposit address"
                  />
                </div>
                <div>
                  <Label className="text-xs">CoinGecko ID (for live price)</Label>
                  <Input
                    value={w.coingecko_id}
                    onChange={(e) => updateWallet(w.id, { coingecko_id: e.target.value.toLowerCase() })}
                    className="mt-1 h-9 font-mono text-xs"
                    placeholder="tether, bitcoin, ethereum…"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button type="button" variant="outline" onClick={addWallet}>
            <Plus className="w-4 h-4 mr-2" />
            Add wallet
          </Button>
          <Button onClick={handleSaveCrypto} disabled={updateSetting.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save crypto settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsSection;

import { useMemo, useRef, useState } from 'react';
import {
  Building2,
  Bitcoin,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Copy,
  CreditCard,
  Lock,
  ChevronDown,
  Wallet,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import {
  activeWallets,
  parseCryptoSettings,
  type CryptoWallet,
} from '@/lib/cryptoPayments';
import { quoteCrypto, quoteUsdt, useCryptoRates } from '@/hooks/useCryptoRates';

export type PaymentMethod = 'bank_transfer' | 'binance_usdt' | 'crypto_onchain' | 'card';

export type CryptoSelection =
  | { kind: 'binance' }
  | { kind: 'wallet'; wallet: CryptoWallet }
  | null;

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod | null) => void;
  binanceId: string;
  onBinanceIdChange: (id: string) => void;
  proofFile: File | null;
  onProofFileChange: (file: File | null) => void;
  orderId: string;
  /** Order total in LKR (catalog currency) for accurate crypto quotes */
  totalLkr: number;
  cryptoSelection: CryptoSelection;
  onCryptoSelectionChange: (sel: CryptoSelection) => void;
  onPreRegister: () => Promise<void>;
  isPreRegistering: boolean;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  binanceId,
  onBinanceIdChange,
  proofFile,
  onProofFileChange,
  orderId,
  totalLkr,
  cryptoSelection,
  onCryptoSelectionChange,
}: PaymentMethodSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'binance' | 'wallets'>('binance');

  const cryptoSettings = useMemo(
    () =>
      parseCryptoSettings(
        settings?.crypto_wallets,
        settings?.crypto_markup_percent,
        settings?.crypto_lkr_per_usd,
      ),
    [settings],
  );

  const wallets = useMemo(() => activeWallets(cryptoSettings), [cryptoSettings]);
  const coinIds = useMemo(() => {
    const ids = wallets.map((w) => w.coingecko_id);
    ids.push('tether');
    return [...new Set(ids)];
  }, [wallets]);

  const { data: ratesData, isLoading: ratesLoading, isFetching } = useCryptoRates(coinIds);
  const prices = ratesData?.prices;
  const rateSource = ratesData?.source;

  const usdtQuote = useMemo(
    () => quoteUsdt(totalLkr, cryptoSettings, prices?.tether || 1),
    [totalLkr, cryptoSettings, prices],
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image (JPG, PNG, WebP) or PDF file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      onProofFileChange(file);
    }
  };

  const removeFile = () => {
    onProofFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = () => {
    if (!proofFile) return null;
    if (proofFile.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-destructive" />;
    }
    return <ImageIcon className="w-5 h-5 text-primary" />;
  };

  const bankName = settings?.bank_name || 'Sampath Bank';
  const bankBranch = settings?.bank_branch || 'Horana';
  const bankAccountName = settings?.bank_account_name || 'M A MUSAMMIL';
  const bankAccountNumber = settings?.bank_account_number || '105752093919';
  const storeBinanceId = settings?.binance_id || '1190172947';
  const storeBinanceName = settings?.binance_name || 'Snippy Mart';
  const storeBinanceCoin = settings?.binance_coin || 'USDT';

  const isBank = selectedMethod === 'bank_transfer';
  const isCrypto =
    selectedMethod === 'binance_usdt' || selectedMethod === 'crypto_onchain';

  const selectBinance = () => {
    onCryptoSelectionChange({ kind: 'binance' });
    onMethodChange('binance_usdt');
    setCryptoModalOpen(false);
  };

  const selectWallet = (wallet: CryptoWallet) => {
    onCryptoSelectionChange({ kind: 'wallet', wallet });
    onMethodChange('crypto_onchain');
    setCryptoModalOpen(false);
  };

  const openCrypto = () => {
    setCryptoModalOpen(true);
    if (!isCrypto) {
      // Don't set method until they pick inside modal
    }
  };

  const ProofUpload = ({ accent = 'primary' }: { accent?: 'primary' | 'crypto' }) => (
    <div>
      <Label className="text-sm text-foreground">
        Upload payment proof <span className="text-destructive">*</span>
      </Label>
      <p className="text-xs text-muted-foreground mb-2">
        Screenshot of transfer / Binance confirmation (JPG, PNG, PDF · max 10MB)
      </p>
      {!proofFile ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full p-6 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center gap-2',
            accent === 'crypto'
              ? 'border-border hover:border-[#F0B90B]/50 hover:bg-[#F0B90B]/5'
              : 'border-border hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload proof</p>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{proofFile.name}</p>
            <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={removeFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const selectedWalletQuote =
    cryptoSelection?.kind === 'wallet'
      ? quoteCrypto(totalLkr, cryptoSelection.wallet, cryptoSettings, prices)
      : null;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <Label className="text-foreground text-base font-semibold">
        Payment Method <span className="text-destructive">*</span>
      </Label>
      <p className="text-xs text-muted-foreground -mt-2">
        Bank transfer or crypto (Binance Pay / on-chain wallets). Card is temporarily disabled.
      </p>

      {/* Bank Transfer */}
      <div
        className={cn(
          'border rounded-xl overflow-hidden transition-all duration-300 ease-out',
          isBank
            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
            : 'border-border hover:border-primary/50',
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => {
            onMethodChange('bank_transfer');
            onCryptoSelectionChange(null);
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                isBank ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
              )}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Bank Transfer</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Available
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transfer to our bank account &amp; upload receipt
              </p>
            </div>
          </div>
          {isBank && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isBank ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="p-4 pt-0 space-y-4">
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside bg-secondary/40 rounded-lg p-3 border border-border/60">
              <li>Transfer the exact order total to the account below</li>
              <li>
                Put your <strong className="text-foreground">Order ID</strong> in the bank remarks
              </li>
              <li>Upload the payment receipt screenshot</li>
              <li>Place order — we verify and deliver on WhatsApp</li>
            </ol>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Bank Details</p>
              <div className="space-y-2.5 text-sm">
                <div>
                  <span className="text-muted-foreground">Bank:</span>{' '}
                  <span className="font-medium text-foreground">{bankName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Branch:</span>{' '}
                  <span className="font-medium text-foreground">{bankBranch}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Account name:</span>{' '}
                    <span className="font-medium text-foreground">{bankAccountName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(bankAccountName, 'Account name')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Account number:</span>{' '}
                    <span className="font-medium text-foreground font-mono">{bankAccountNumber}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(bankAccountNumber, 'Account number')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Order ID (remarks)</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(orderId, 'Order ID')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-mono font-bold text-primary">{orderId}</p>
                </div>
              </div>
            </div>

            <ProofUpload />
          </div>
        </div>
      </div>

      {/* Crypto — opens modal */}
      <div
        className={cn(
          'border rounded-xl overflow-hidden transition-all duration-300 ease-out',
          isCrypto
            ? 'border-violet-500 bg-violet-500/5 shadow-md shadow-violet-500/10'
            : 'border-border hover:border-violet-500/50 hover:bg-secondary/30',
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => {
            if (isCrypto && cryptoSelection) {
              // Toggle collapse by re-opening modal to change option
              openCrypto();
            } else {
              openCrypto();
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                isCrypto ? 'bg-violet-500 text-white' : 'bg-secondary text-muted-foreground',
              )}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Crypto</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Available
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Binance Pay or on-chain wallet (USDT, BTC, ETH…)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCrypto && (
              <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {/* Selected crypto summary + proof */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isCrypto && cryptoSelection ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="p-4 pt-0 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-foreground/70">
                {ratesLoading || isFetching ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Updating amount…
                  </span>
                ) : (
                  'Send the exact amount shown below'
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-foreground border-border"
                onClick={openCrypto}
              >
                Change option
              </Button>
            </div>

            {cryptoSelection?.kind === 'binance' && (
              <div className="p-4 rounded-lg bg-card border border-[#F0B90B]/40 space-y-3 text-foreground">
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-[#D4A017]" />
                  <p className="text-sm font-bold text-foreground">Binance Pay · {storeBinanceCoin}</p>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold">
                    Send exactly
                  </p>
                  <p className="text-2xl font-black text-[#B8860B] dark:text-[#F0B90B] tabular-nums">
                    {usdtQuote.formatted}
                  </p>
                </div>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-foreground/70">Name:</span>{' '}
                    <span className="font-semibold text-foreground">{storeBinanceName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-foreground/70">Binance ID:</span>{' '}
                      <span className="font-mono font-semibold text-foreground">{storeBinanceId}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-foreground"
                      onClick={() => copyToClipboard(storeBinanceId, 'Binance ID')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-foreground/70">Note / Order ID</p>
                      <p className="font-mono font-bold text-foreground">{orderId}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-foreground"
                      onClick={() => copyToClipboard(orderId, 'Order ID')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="binance-id" className="text-sm text-foreground">
                    Your Binance ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="binance-id"
                    placeholder="Enter your Binance ID"
                    value={binanceId}
                    onChange={(e) => onBinanceIdChange(e.target.value)}
                    className="mt-1.5 h-12 bg-background border-border text-foreground"
                  />
                </div>
              </div>
            )}

            {cryptoSelection?.kind === 'wallet' && (
              <div className="p-4 rounded-lg bg-card border border-violet-500/40 space-y-3 text-foreground">
                <p className="text-sm font-bold text-foreground">
                  {cryptoSelection.wallet.symbol} · {cryptoSelection.wallet.network}
                </p>
                <div className="p-3 rounded-lg bg-background border border-border">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold">
                    Send exactly
                  </p>
                  <p className="text-2xl font-black text-violet-700 dark:text-violet-300 tabular-nums">
                    {selectedWalletQuote?.formatted || '—'}
                  </p>
                  <p className="text-[11px] text-foreground/70 mt-0.5">
                    Use the correct network only
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/70 mb-1 font-medium">Deposit address</p>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-xs font-mono break-all font-semibold text-foreground bg-background p-2 rounded-lg border border-border">
                      {cryptoSelection.wallet.address}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-foreground"
                      onClick={() =>
                        copyToClipboard(cryptoSelection.wallet.address, 'Wallet address')
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs text-foreground/70">Memo / Order ID (if available)</p>
                    <p className="font-mono font-bold text-foreground text-sm">
                      {orderId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="text-foreground"
                    onClick={() => copyToClipboard(orderId, 'Order ID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <ProofUpload accent="crypto" />
          </div>
        </div>
      </div>

      {/* Card disabled */}
      <div
        className="border border-border/60 rounded-xl overflow-hidden opacity-60 cursor-not-allowed bg-muted/20"
        aria-disabled="true"
      >
        <div className="w-full p-4 flex items-center justify-between text-left pointer-events-none select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-muted-foreground">Card Payment</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Unavailable
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Temporarily disabled
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground opacity-40" />
        </div>
      </div>

      {/* Crypto options modal */}
      <Dialog open={cryptoModalOpen} onOpenChange={setCryptoModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Pay with crypto</DialogTitle>
            <DialogDescription className="text-foreground/70">
              Choose Binance Pay or a wallet transfer, then send the exact amount shown.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 p-1 rounded-xl bg-secondary border border-border">
            <button
              type="button"
              onClick={() => setModalTab('binance')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors',
                modalTab === 'binance'
                  ? 'bg-[#F0B90B] text-black shadow'
                  : 'text-foreground/70 hover:text-foreground',
              )}
            >
              Binance Pay
            </button>
            <button
              type="button"
              onClick={() => setModalTab('wallets')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors',
                modalTab === 'wallets'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-foreground/70 hover:text-foreground',
              )}
            >
              Wallet transfer
            </button>
          </div>

          {(ratesLoading || isFetching) && (
            <p className="text-xs text-foreground/70 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating amount…
            </p>
          )}

          {modalTab === 'binance' && (
            <div className="space-y-4 text-foreground">
              <div className="p-4 rounded-xl border border-border bg-background">
                <p className="text-xs text-foreground/70 font-semibold uppercase tracking-wider">
                  You will send
                </p>
                <p className="text-3xl font-black text-[#B8860B] dark:text-[#F0B90B] tabular-nums mt-1">
                  {usdtQuote.formatted}
                </p>
              </div>
              <div className="text-sm space-y-2.5 p-4 rounded-xl bg-background border border-border">
                <p>
                  <span className="text-foreground/70">Pay to:</span>{' '}
                  <strong className="text-foreground font-semibold">{storeBinanceName}</strong>
                </p>
                <p className="font-mono">
                  <span className="text-foreground/70">ID:</span>{' '}
                  <strong className="text-foreground font-semibold">{storeBinanceId}</strong>
                </p>
                <p>
                  <span className="text-foreground/70">Coin:</span>{' '}
                  <strong className="text-foreground font-semibold">{storeBinanceCoin}</strong>
                </p>
              </div>
              <Button
                type="button"
                className="w-full h-12 font-bold bg-[#F0B90B] text-black hover:bg-[#F0B90B]/90"
                onClick={selectBinance}
              >
                <Bitcoin className="w-4 h-4 mr-2" />
                Use Binance Pay
              </Button>
            </div>
          )}

          {modalTab === 'wallets' && (
            <div className="space-y-3 text-foreground">
              {wallets.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-border bg-background">
                  <Wallet className="w-8 h-8 mx-auto text-foreground/50 mb-2" />
                  <p className="text-sm font-medium text-foreground">No wallets enabled yet</p>
                  <p className="text-xs text-foreground/70 mt-1">
                    Please use Binance Pay for now.
                  </p>
                </div>
              ) : (
                wallets.map((w) => {
                  const q = quoteCrypto(totalLkr, w, cryptoSettings, prices);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => selectWallet(w)}
                      className="w-full text-left p-4 rounded-xl border border-border bg-background hover:border-violet-500/60 hover:bg-violet-500/5 transition-colors text-foreground"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">
                            {w.symbol}{' '}
                            <span className="text-foreground/70 font-medium text-sm">
                              · {w.network}
                            </span>
                          </p>
                          <p className="text-[11px] font-mono text-foreground/70 mt-1 truncate max-w-[240px]">
                            {w.address.slice(0, 12)}…{w.address.slice(-8)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-violet-700 dark:text-violet-300 tabular-nums">
                            {q.formatted}
                          </p>
                          <p className="text-[10px] text-foreground/70">send this amount</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodSelector;

import { useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';

export type PaymentMethod = 'bank_transfer' | 'binance_usdt' | 'card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod | null) => void;
  binanceId: string;
  onBinanceIdChange: (id: string) => void;
  proofFile: File | null;
  onProofFileChange: (file: File | null) => void;
  orderId: string;
  onPreRegister: () => Promise<void>;
  isPreRegistering: boolean;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  proofFile,
  onProofFileChange,
  orderId,
}: PaymentMethodSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
  const storeBinanceCoin = settings?.binance_coin || 'USDT';

  const isBank = selectedMethod === 'bank_transfer';

  return (
    <div className="space-y-4">
      <Label className="text-foreground text-base font-semibold">
        Payment Method <span className="text-destructive">*</span>
      </Label>
      <p className="text-xs text-muted-foreground -mt-2">
        Bank transfer is available now. Other methods are temporarily disabled.
      </p>

      {/* Bank Transfer — only active method */}
      <div
        className={cn(
          'border rounded-xl overflow-hidden transition-all duration-300 ease-out',
          isBank
            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => onMethodChange('bank_transfer')}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                isBank
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
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

        {/* Always show bank details when bank is selected (default) */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isBank ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
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
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Bank:</span>{' '}
                    <span className="font-medium text-foreground">{bankName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-muted-foreground">Branch:</span>{' '}
                    <span className="font-medium text-foreground">{bankBranch}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Account Name:</span>{' '}
                    <span className="font-medium text-foreground">{bankAccountName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(bankAccountName, 'Account name')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Account Number:</span>{' '}
                    <span className="font-medium text-foreground font-mono">
                      {bankAccountNumber}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(bankAccountNumber, 'Account number')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Your Order ID:</span>
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
                <p className="text-xs text-primary/80 mt-1">
                  Enter this Order ID as beneficiary remarks when transferring
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">
                Upload Receipt <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Screenshot or photo of your payment receipt (JPG, PNG, PDF · max 10MB)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!proofFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload receipt</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {proofFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Binance — disabled */}
      <div
        className="border border-border/60 rounded-xl overflow-hidden opacity-60 cursor-not-allowed bg-muted/20"
        aria-disabled="true"
      >
        <div className="w-full p-4 flex items-center justify-between text-left pointer-events-none select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground">
              <Bitcoin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-muted-foreground">Binance {storeBinanceCoin}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  Temporarily disabled
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Not available right now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card — disabled */}
      <div
        className="border border-border/60 rounded-xl overflow-hidden opacity-60 cursor-not-allowed bg-muted/20"
        aria-disabled="true"
      >
        <div className="w-full p-4 flex items-center justify-between text-left pointer-events-none select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-muted-foreground">Card Payment (Visa / Master)</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  Temporarily disabled
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Not available right now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;

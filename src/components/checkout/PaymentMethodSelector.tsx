import { useState, useRef } from 'react';
import { Building2, Bitcoin, ChevronDown, Upload, X, FileText, Image as ImageIcon, Check, Copy, CreditCard, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  binanceId,
  onBinanceIdChange,
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
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image (JPG, PNG, WebP) or PDF file',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (max 10MB)
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

  // Bank details from settings
  const bankName = settings?.bank_name || 'Sampath Bank';
  const bankBranch = settings?.bank_branch || 'Horana';
  const bankAccountName = settings?.bank_account_name || 'M A MUSAMMIL';
  const bankAccountNumber = settings?.bank_account_number || '105752093919';

  // Binance details from settings
  const storeBinanceId = settings?.binance_id || '1190172947';
  const storeBinanceName = settings?.binance_name || 'Snippy Mart';
  const storeBinanceCoin = settings?.binance_coin || 'USDT';

  return (
    <div className="space-y-6">
      <Label className="text-foreground text-base font-semibold">
        Payment Method <span className="text-destructive">*</span>
      </Label>

      {/* Bank Transfer Option */}
      <div
        className={cn(
          "border rounded-xl overflow-hidden transition-all duration-300 ease-out",
          selectedMethod === 'bank_transfer'
            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-secondary/30 active:scale-[0.99]"
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => onMethodChange(selectedMethod === 'bank_transfer' ? null : 'bank_transfer')}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              selectedMethod === 'bank_transfer'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Bank Transfer</p>
              <p className="text-sm text-muted-foreground">Transfer to our bank account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedMethod === 'bank_transfer' && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300",
              selectedMethod === 'bank_transfer' && "rotate-180"
            )} />
          </div>
        </button>

        {/* Expanded Content for Bank Transfer */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          selectedMethod === 'bank_transfer' ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 pt-0 space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Bank Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Bank:</span>{' '}
                    <span className="font-medium text-foreground">{bankName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Branch:</span>{' '}
                    <span className="font-medium text-foreground">{bankBranch}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Account Name:</span>{' '}
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Account Number:</span>{' '}
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
                  ⚡ Enter this Order ID as beneficiary remarks
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">
                Upload Receipt <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a screenshot or photo of your payment receipt (JPG, PNG, PDF)
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
                    <p className="text-sm font-medium text-foreground truncate">{proofFile.name}</p>
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

      {/* Binance USDT Option */}
      <div
        className={cn(
          "border rounded-xl overflow-hidden transition-all duration-300 ease-out",
          selectedMethod === 'binance_usdt'
            ? "border-[#F0B90B] bg-[#F0B90B]/5 shadow-md shadow-[#F0B90B]/5 scale-[1.01]"
            : "border-border hover:border-[#F0B90B]/50 hover:bg-secondary/30 active:scale-[0.99]"
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => onMethodChange(selectedMethod === 'binance_usdt' ? null : 'binance_usdt')}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              selectedMethod === 'binance_usdt'
                ? "bg-[#F0B90B] text-black"
                : "bg-secondary text-muted-foreground"
            )}>
              <Bitcoin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Binance {storeBinanceCoin}</p>
              <p className="text-sm text-muted-foreground">Pay with Binance Pay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedMethod === 'binance_usdt' && (
              <div className="w-5 h-5 rounded-full bg-[#F0B90B] flex items-center justify-center">
                <Check className="w-3 h-3 text-black" />
              </div>
            )}
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300",
              selectedMethod === 'binance_usdt' && "rotate-180"
            )} />
          </div>
        </button>

        {/* Expanded Content for Binance */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          selectedMethod === 'binance_usdt' ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 pt-0 space-y-4">
            <div className="p-4 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/20">
              <p className="text-sm font-medium text-foreground mb-3">Binance Pay Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Account Name:</span>{' '}
                    <span className="font-medium text-foreground">{storeBinanceName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Binance ID:</span>{' '}
                    <span className="font-medium text-foreground font-mono">{storeBinanceId}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(storeBinanceId, 'Binance ID')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Coin:</span>{' '}
                    <span className="font-medium text-foreground">{storeBinanceCoin}</span>
                  </div>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  Use Binance Pay to send {storeBinanceCoin} - it's instant and free!
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-[#F0B90B]/20">
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
                <p className="text-sm font-mono font-bold text-[#F0B90B]">{orderId}</p>
                <p className="text-xs text-[#F0B90B]/80 mt-1">
                  ⚡ Enter this Order ID as note when sending
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="binance-id" className="text-sm text-foreground">
                Your Binance ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="binance-id"
                type="text"
                placeholder="Enter your Binance ID"
                value={binanceId}
                onChange={(e) => onBinanceIdChange(e.target.value)}
                className="mt-1.5 h-12 bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We need this to verify your payment
              </p>
            </div>

            <div>
              <Label className="text-sm text-foreground">
                Upload Screenshot <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a screenshot of your payment confirmation
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
                  className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-[#F0B90B]/50 hover:bg-[#F0B90B]/5 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proofFile.name}</p>
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

      {/* Card Payment Option */}
      <div
        className={cn(
          "border rounded-xl overflow-hidden transition-all duration-300 ease-out",
          selectedMethod === 'card'
            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-secondary/30 active:scale-[0.99]"
        )}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => onMethodChange(selectedMethod === 'card' ? null : 'card')}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              selectedMethod === 'card'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Card Payment (Visa / Master)</p>
              <p className="text-sm text-muted-foreground">Pay with Credit or Debit card</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedMethod === 'card' && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300",
              selectedMethod === 'card' && "rotate-180"
            )} />
          </div>
        </button>

        {/* Expanded Content for Card Payment */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          selectedMethod === 'card' ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-4 pt-0 space-y-4">
            {/* WhatsApp Contact Section */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-1">Step 1: Get Card Payment Link</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Contact us on WhatsApp to receive your secure card payment link. We'll send you a personalized checkout link for this order.
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/${settings?.whatsapp_number || '94787767869'}?text=${encodeURIComponent(`Hi! I'd like to pay by card for Order ${orderId}. Please send me the payment link.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact on WhatsApp</span>
              </a>
            </div>

            {/* Order ID Display */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
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
                ⚡ Share this ID when contacting us
              </p>
            </div>

            {/* Upload Proof Section */}
            <div>
              <Label className="text-sm text-foreground">
                Step 2: Upload Payment Confirmation <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                After completing the card payment, upload a screenshot of your confirmation
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
                  <p className="text-sm text-muted-foreground">Click to upload confirmation</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proofFile.name}</p>
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

      {!selectedMethod && (
        <p className="text-xs text-muted-foreground">
          Select a payment method to continue
        </p>
      )}
    </div>
  );
};

export default PaymentMethodSelector;

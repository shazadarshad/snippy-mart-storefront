import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CreditCard,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/seo/SEO';
import { useTrackOrder } from '@/hooks/useOrders';
import { formatCatalogLkr } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseEdgeFunctionError } from '@/utils/parseEdgeFunctionError';
import { cn } from '@/lib/utils';

const CardPaymentPage = () => {
  const { orderNumber: raw } = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(String(raw || '').trim());
  const { data: order, isLoading, isFetched, refetch } = useTrackOrder(orderNumber);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) {
      setProofFile(null);
      return;
    }
    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ]);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf']);
    if ((!file.type || !allowedTypes.has(file.type)) && !allowedExt.has(ext)) {
      toast({
        title: 'Invalid file',
        description: 'Upload an image (JPG, PNG, WebP, HEIC) or PDF.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB.', variant: 'destructive' });
      return;
    }
    setProofFile(file);
  };

  const handleUploadProof = async () => {
    if (!order || !proofFile) return;
    setUploading(true);
    try {
      const rawExt = (proofFile.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileExt = rawExt || (proofFile.type === 'application/pdf' ? 'pdf' : 'jpg');
      const fileName = `${order.order_number}-card-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);
      if (uploadError) throw new Error(uploadError.message || 'Upload failed');

      const { data, error } = await supabase.functions.invoke('attach-payment-proof', {
        body: { order_number: order.order_number, payment_proof_url: fileName },
      });
      if (error || data?.error) {
        const { error: upErr } = await supabase
          .from('orders')
          .update({ payment_proof_url: fileName })
          .eq('order_number', order.order_number);
        if (upErr) {
          throw new Error(
            (data?.error && String(data.error)) ||
              (error ? await parseEdgeFunctionError(error) : upErr.message),
          );
        }
      }

      setUploaded(true);
      setProofFile(null);
      refetch();
      toast({
        title: 'Proof uploaded',
        description: 'We’ll verify your card payment and update the order.',
      });
    } catch (e) {
      toast({
        title: 'Could not save proof',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <SEO title="Card payment" noindex path={`/payment/${orderNumber}`} />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isFetched && !order) {
    return (
      <div className="min-h-dvh page-mesh pt-24 pb-16 px-4">
        <SEO title="Payment not found" noindex path={`/payment/${orderNumber}`} />
        <div className="max-w-md mx-auto text-center space-y-4">
          <Package className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Order not found</h1>
          <p className="text-sm text-muted-foreground">
            Check the Order ID in the link, or ask us on WhatsApp for a new payment page.
          </p>
          <Button asChild variant="outline">
            <Link to="/track-order">Track an order</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const payUrl = String(order.card_checkout_url || '').trim();
  const hasProof = !!order.payment_proof_url || uploaded;
  const closed = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="min-h-dvh page-mesh pt-24 pb-16 px-4">
      <SEO
        title={`Pay ${order.order_number}`}
        description="Complete your Snippy Mart card payment."
        noindex
        path={`/payment/${order.order_number}`}
      />
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Card payment
            </p>
            <h1 className="text-xl font-display font-bold">{order.order_number}</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/95 p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Pay exactly</p>
              <p className="text-2xl font-black tabular-nums">{formatCatalogLkr(order.total_amount)}</p>
            </div>
            <span className="self-start text-[10px] font-black uppercase px-2 py-1 rounded-full border border-border">
              {order.status}
            </span>
          </div>
          <p className="text-sm text-foreground/80">Hi {order.customer_name || 'there'}</p>
          <div className="space-y-2 pt-1 border-t border-border">
            {(order.order_items || []).map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.product_name}</p>
                  {(item.plan_name || item.variant_name) && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[item.plan_name, item.variant_name].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <p className="tabular-nums shrink-0">
                  ×{item.quantity} · {formatCatalogLkr(item.total_price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {closed ? (
          <p className="text-sm text-destructive font-semibold">This order is no longer open for payment.</p>
        ) : payUrl ? (
          <Button
            type="button"
            variant="hero"
            size="xl"
            className="w-full min-h-14 h-14 text-base font-bold"
            onClick={() => window.open(payUrl, '_blank', 'noopener,noreferrer')}
          >
            Proceed to payment
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Payment link is not ready yet. Reply on WhatsApp and we’ll send it.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/95 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">After you pay — upload confirmation</h2>
          </div>
          {hasProof ? (
            <p className="text-sm text-emerald-600 font-semibold">
              Confirmation on file. We’ll verify and update your order.
            </p>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              {!proofFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[6.5rem] p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50"
                >
                  <Upload className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm font-medium">Tap to upload screenshot / PDF</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  {proofFile.type === 'application/pdf' ? (
                    <FileText className="w-5 h-5 text-destructive" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => handleFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                className="w-full min-h-12"
                disabled={!proofFile || uploading || closed}
                onClick={handleUploadProof}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                I’ve paid — submit proof
              </Button>
            </>
          )}
        </div>

        <p className={cn('text-center text-xs text-muted-foreground')}>
          <Link to={`/track-order?orderId=${encodeURIComponent(order.order_number)}`} className="text-primary font-semibold">
            Track this order
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CardPaymentPage;

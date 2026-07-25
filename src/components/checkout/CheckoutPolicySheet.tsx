import type { ReactNode } from 'react';
import { usePolicy } from '@/hooks/usePolicies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutPolicyKey = 'privacy_policy' | 'refund_policy' | 'terms_of_service';

const META: Record<
  CheckoutPolicyKey,
  { title: string; description: string; fallback: ReactNode }
> = {
  privacy_policy: {
    title: 'Privacy Policy',
    description: 'How Snippy Mart collects and uses your information.',
    fallback: (
      <>
        <h3>Information we collect</h3>
        <p>
          We collect details you provide at checkout (name, WhatsApp, email if given, payment proof)
          to process and support your order.
        </p>
        <h3>How we use it</h3>
        <p>
          Order fulfillment, status updates, customer support, and improving our service. We do not
          sell your personal data.
        </p>
        <h3>Contact</h3>
        <p>WhatsApp +94 78 776 7869 for privacy questions.</p>
      </>
    ),
  },
  refund_policy: {
    title: 'Refund Policy',
    description: 'When refunds apply for digital products.',
    fallback: (
      <>
        <h3>Digital products</h3>
        <p>
          Digital goods are generally non-refundable after delivery or activation. Refunds may apply
          for non-delivery or major defects as described on our full Refund Policy page.
        </p>
        <h3>Non-warranty items</h3>
        <p>
          Products marked Non Warranty / No Warranty are not eligible for refund or replacement after
          delivery.
        </p>
        <h3>Contact</h3>
        <p>WhatsApp +94 78 776 7869 with your Order ID.</p>
      </>
    ),
  },
  terms_of_service: {
    title: 'Terms of Service',
    description: 'Terms for using Snippy Mart.',
    fallback: (
      <>
        <h3>Agreement</h3>
        <p>
          By using snippymart.com and placing an order you agree to these terms and our Privacy and
          Refund policies.
        </p>
        <h3>Digital goods</h3>
        <p>
          You are responsible for providing accurate contact details and for using delivered
          credentials according to each service’s rules.
        </p>
        <h3>Support</h3>
        <p>Contact us on WhatsApp for order help and disputes.</p>
      </>
    ),
  },
};

type Props = {
  policyKey: CheckoutPolicyKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CheckoutPolicySheet({ policyKey, open, onOpenChange }: Props) {
  const key = policyKey || 'privacy_policy';
  const { data: policy, isLoading, isError } = usePolicy(key);
  const meta = META[key];

  const html = (policy?.content || '').trim();
  // Treat tag-only / whitespace HTML as empty so we never show a blank sheet
  const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  const showHtml = !isLoading && !isError && !!html && textOnly.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-lg w-[calc(100%-1rem)] sm:w-full p-0 gap-0 overflow-hidden flex flex-col',
          'max-h-[min(88dvh,720px)]',
        )}
      >
        <DialogHeader className="p-4 sm:p-5 border-b border-border shrink-0 text-left space-y-1 pr-12">
          <DialogTitle className="text-lg font-bold">{meta.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {meta.description} You stay on checkout — close this sheet to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">Loading policy…</p>
            </div>
          ) : showHtml ? (
            <div
              className="policy-sheet-content prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-foreground
                prose-p:text-muted-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="policy-sheet-content space-y-3 text-sm text-muted-foreground [&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-1 [&_h3:first-child]:mt-0 [&_p]:leading-relaxed">
              {meta.fallback}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border p-3 sm:p-4 bg-background/95">
          <Button
            type="button"
            className="w-full h-12 rounded-xl font-bold touch-manipulation"
            onClick={() => onOpenChange(false)}
          >
            Back to checkout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

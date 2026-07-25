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
import {
  Loader2,
  FileText,
  Shield,
  RotateCcw,
  Scale,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutPolicyKey = 'privacy_policy' | 'refund_policy' | 'terms_of_service';

const META: Record<
  CheckoutPolicyKey,
  {
    title: string;
    short: string;
    description: string;
    icon: typeof FileText;
    accent: string;
    fallback: ReactNode;
  }
> = {
  privacy_policy: {
    title: 'Privacy Policy',
    short: 'Privacy',
    description: 'How we collect, use, and protect your information at checkout.',
    icon: Shield,
    accent: 'from-sky-500/20 to-blue-600/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    fallback: (
      <>
        <section>
          <h3>1. Information we collect</h3>
          <p>
            We collect details you provide at checkout — name, WhatsApp number, optional email, order
            notes, and payment proof — so we can process and support your order.
          </p>
        </section>
        <section>
          <h3>2. How we use it</h3>
          <ul>
            <li>Order fulfillment and delivery</li>
            <li>Status updates and customer support</li>
            <li>Payment verification and fraud prevention</li>
            <li>Improving our store and services</li>
          </ul>
        </section>
        <section>
          <h3>3. Sharing</h3>
          <p>
            We do not sell your personal data. We only share what’s needed with trusted tools that help
            run the store (payments, hosting, messaging).
          </p>
        </section>
        <section>
          <h3>4. Contact</h3>
          <p>Questions? WhatsApp +94 78 776 7869 with your Order ID.</p>
        </section>
      </>
    ),
  },
  refund_policy: {
    title: 'Refund Policy',
    short: 'Refunds',
    description: 'When refunds apply for digital products and how to request help.',
    icon: RotateCcw,
    accent: 'from-amber-500/20 to-orange-600/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    fallback: (
      <>
        <section>
          <h3>1. Digital products</h3>
          <p>
            Digital goods are generally non-refundable after delivery or activation. Refunds may apply
            for non-delivery or a major defect that we cannot fix.
          </p>
        </section>
        <section>
          <h3>2. Non-warranty items</h3>
          <p>
            Products marked <strong>Non Warranty / No Warranty</strong> are not eligible for refund or
            replacement after delivery.
          </p>
        </section>
        <section>
          <h3>3. How to request help</h3>
          <ul>
            <li>Message us on WhatsApp with your Order ID</li>
            <li>Describe the issue clearly (screenshots help)</li>
            <li>We review and reply as quickly as possible</li>
          </ul>
        </section>
        <section>
          <h3>4. Contact</h3>
          <p>WhatsApp +94 78 776 7869 — keep your Order ID ready.</p>
        </section>
      </>
    ),
  },
  terms_of_service: {
    title: 'Terms of Service',
    short: 'Terms',
    description: 'Rules for using Snippy Mart and placing an order.',
    icon: Scale,
    accent: 'from-violet-500/20 to-purple-600/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    fallback: (
      <>
        <section>
          <h3>1. Agreement</h3>
          <p>
            By using snippymart.com and placing an order you agree to these terms and our Privacy and
            Refund policies.
          </p>
        </section>
        <section>
          <h3>2. Digital goods</h3>
          <p>
            You are responsible for providing accurate contact details and for using delivered
            credentials according to each service’s rules.
          </p>
        </section>
        <section>
          <h3>3. Orders & payment</h3>
          <p>
            Orders are processed after payment is verified. Delivery times vary by product (auto
            products often appear on Track Order after confirmation).
          </p>
        </section>
        <section>
          <h3>4. Support</h3>
          <p>Contact us on WhatsApp for order help and disputes. Include your Order ID.</p>
        </section>
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
  const Icon = meta.icon;

  const html = (policy?.content || '').trim();
  const textOnly = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const showHtml = !isLoading && !isError && !!html && textOnly.length > 0;

  const displayTitle = (policy?.title || meta.title).trim() || meta.title;
  const lastUpdated = policy?.last_updated
    ? new Date(policy.last_updated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Layout shell — flex column, no default dialog padding
          'flex flex-col gap-0 p-0 overflow-hidden border-border bg-background text-foreground shadow-2xl',
          // Mobile: bottom sheet (full width, docked to bottom)
          'left-0 right-0 top-auto bottom-0 translate-x-0 translate-y-0',
          'w-full max-w-none rounded-t-[1.35rem] rounded-b-none',
          'h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))]',
          'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))]',
          // Desktop: centered card
          'sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto',
          'sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-full sm:max-w-xl md:max-w-2xl',
          'sm:h-auto sm:max-h-[min(86dvh,720px)]',
          'sm:rounded-2xl',
          // Animation: sheet up on mobile, zoom on desktop
          'data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0',
          'data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=closed]:slide-out-to-bottom-0',
        )}
      >
        {/* Mobile drag affordance */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0" aria-hidden>
          <div className="h-1.5 w-11 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Gradient accent bar */}
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-cyan-400 to-accent" />

        {/* Header */}
        <DialogHeader className="shrink-0 text-left space-y-0 border-b border-border/80 bg-card/40 px-4 pt-3 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4 pr-14 sm:pr-14">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-sm',
                meta.accent,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <FileText className="h-3 w-3" />
                  Legal
                </span>
                {lastUpdated && (
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                    Updated {lastUpdated}
                  </span>
                )}
              </div>
              <DialogTitle className="text-lg sm:text-xl font-display font-bold tracking-tight text-foreground leading-tight">
                {displayTitle}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {meta.description}
              </DialogDescription>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            You stay on checkout — close this to continue ordering
          </p>
        </DialogHeader>

        {/* Scrollable body */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">Loading {meta.short}…</p>
            </div>
          ) : showHtml ? (
            <div
              className="checkout-policy-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="checkout-policy-body checkout-policy-fallback">{meta.fallback}</div>
          )}
        </div>

        {/* Sticky footer */}
        <div
          className={cn(
            'shrink-0 border-t border-border bg-background/95 backdrop-blur-md',
            'px-4 sm:px-6 pt-3',
            'pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:pb-4',
            'space-y-2.5',
          )}
        >
          <Button
            type="button"
            variant="hero"
            className="w-full h-12 sm:h-12 rounded-xl text-base font-bold touch-manipulation shadow-md shadow-primary/20"
            onClick={() => onOpenChange(false)}
          >
            Got it — back to checkout
          </Button>
          <a
            href="https://wa.me/94787767869?text=Hi%20Snippy%20Mart%2C%20I%20have%20a%20question%20about%20your%20policies."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/10 transition-colors touch-manipulation"
          >
            <MessageCircle className="h-4 w-4" />
            Questions? WhatsApp us
          </a>
        </div>

        {/* Scoped typography — readable on phone + desktop */}
        <style>{`
          .checkout-policy-body {
            color: hsl(var(--muted-foreground));
            font-size: 0.9375rem;
            line-height: 1.7;
            max-width: 100%;
            word-wrap: break-word;
            overflow-wrap: anywhere;
          }
          @media (min-width: 640px) {
            .checkout-policy-body {
              font-size: 0.975rem;
              line-height: 1.75;
            }
          }
          .checkout-policy-body h1,
          .checkout-policy-body h2,
          .checkout-policy-body h3,
          .checkout-policy-body h4 {
            font-family: var(--font-display), system-ui, sans-serif;
            font-weight: 700;
            color: hsl(var(--foreground));
            line-height: 1.3;
            margin-top: 1.35rem;
            margin-bottom: 0.55rem;
            letter-spacing: -0.01em;
          }
          .checkout-policy-body h1:first-child,
          .checkout-policy-body h2:first-child,
          .checkout-policy-body h3:first-child,
          .checkout-policy-body section:first-child h3 {
            margin-top: 0;
          }
          .checkout-policy-body h1 { font-size: 1.25rem; }
          .checkout-policy-body h2 {
            font-size: 1.1rem;
            padding-bottom: 0.4rem;
            border-bottom: 1px solid hsl(var(--border) / 0.7);
          }
          .checkout-policy-body h3 {
            font-size: 1.02rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          .checkout-policy-body h3::before {
            content: '';
            width: 0.35rem;
            height: 0.35rem;
            border-radius: 999px;
            background: hsl(var(--primary));
            flex-shrink: 0;
          }
          .checkout-policy-body p {
            margin: 0 0 0.85rem;
            color: hsl(var(--muted-foreground));
          }
          .checkout-policy-body p:last-child { margin-bottom: 0; }
          .checkout-policy-body strong,
          .checkout-policy-body b {
            color: hsl(var(--foreground));
            font-weight: 700;
          }
          .checkout-policy-body a {
            color: hsl(var(--primary));
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .checkout-policy-body ul,
          .checkout-policy-body ol {
            margin: 0.65rem 0 1rem;
            padding-left: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
          }
          .checkout-policy-body li {
            position: relative;
            padding: 0.65rem 0.75rem 0.65rem 2.1rem;
            border-radius: 0.75rem;
            background: hsl(var(--secondary) / 0.55);
            border: 1px solid hsl(var(--border) / 0.6);
            color: hsl(var(--foreground) / 0.88);
            font-size: 0.9rem;
            line-height: 1.5;
          }
          .checkout-policy-body li::before {
            content: '';
            position: absolute;
            left: 0.85rem;
            top: 1rem;
            width: 0.4rem;
            height: 0.4rem;
            border-radius: 999px;
            background: hsl(var(--primary));
          }
          .checkout-policy-body ol {
            counter-reset: policy-ol;
          }
          .checkout-policy-body ol li {
            counter-increment: policy-ol;
          }
          .checkout-policy-body ol li::before {
            content: counter(policy-ol);
            width: auto;
            height: auto;
            top: 0.55rem;
            left: 0.65rem;
            background: transparent;
            color: hsl(var(--primary));
            font-weight: 800;
            font-size: 0.75rem;
          }
          .checkout-policy-body section {
            margin-bottom: 1.15rem;
            padding-bottom: 1rem;
            border-bottom: 1px dashed hsl(var(--border) / 0.65);
          }
          .checkout-policy-body section:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .checkout-policy-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.75rem 0 1rem;
            font-size: 0.85rem;
          }
          .checkout-policy-body th,
          .checkout-policy-body td {
            border: 1px solid hsl(var(--border));
            padding: 0.5rem 0.65rem;
            text-align: left;
          }
          .checkout-policy-body th {
            background: hsl(var(--secondary));
            color: hsl(var(--foreground));
            font-weight: 700;
          }
          .checkout-policy-body blockquote {
            margin: 0.75rem 0;
            padding: 0.75rem 1rem;
            border-left: 3px solid hsl(var(--primary));
            background: hsl(var(--primary) / 0.06);
            border-radius: 0 0.75rem 0.75rem 0;
            color: hsl(var(--foreground) / 0.9);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

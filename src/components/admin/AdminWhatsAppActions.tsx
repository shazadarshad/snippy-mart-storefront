import { MessageCircle, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCatalogLkr } from '@/hooks/useCurrency';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  detectWhatsAppScenario,
  getOrderWhatsAppLink,
  scenarioLabel,
  type OrderForWhatsApp,
  type DeliveryRowLite,
  type WhatsAppScenario,
} from '@/lib/adminOrderWhatsApp';

const SECONDARY: WhatsAppScenario[] = [
  'auto_ready',
  'auto_processing',
  'pending_payment',
  'card_link',
  'payment_rejected',
  'manual_ready',
  'generic_support',
];

type Props = {
  order: OrderForWhatsApp;
  deliveries?: DeliveryRowLite[];
  /** Icon-only (list rows) */
  compact?: boolean;
  /** Sticky modal footer: primary + copy, no chip list */
  footer?: boolean;
  className?: string;
};

export function AdminWhatsAppActions({
  order,
  deliveries = [],
  compact = false,
  footer = false,
  className,
}: Props) {
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const waExtras = {
    cardPaymentLink: settings?.card_payment_link || null,
    amountLabel:
      order.total_amount != null && Number.isFinite(Number(order.total_amount))
        ? formatCatalogLkr(Number(order.total_amount))
        : null,
  };
  const primary = getOrderWhatsAppLink(order, undefined, deliveries, waExtras);

  const openScenario = (scenario: WhatsAppScenario) => {
    const link = getOrderWhatsAppLink(order, scenario, deliveries, waExtras);
    if (!link.url) {
      toast({
        title: 'Invalid WhatsApp number',
        description: link.display || 'Add a valid number with country code.',
        variant: 'destructive',
      });
      return;
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const copyMessage = (scenario?: WhatsAppScenario) => {
    const link = getOrderWhatsAppLink(order, scenario, deliveries, waExtras);
    navigator.clipboard.writeText(link.message);
    toast({
      title: 'Message copied',
      description: scenarioLabel(link.scenario),
    });
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 text-success hover:text-success', className)}
        disabled={!primary.ok}
        title={
          primary.ok
            ? scenarioLabel(primary.scenario)
            : 'Invalid phone — open order to fix'
        }
        onClick={(e) => {
          e.stopPropagation();
          openScenario(primary.scenario);
        }}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    );
  }

  if (footer) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground truncate">
            {primary.display || 'No number'}
            {primary.fixed && primary.ok ? ' · fixed for WA' : ''}
          </p>
          {!primary.ok && (
            <span className="text-[10px] text-destructive font-bold shrink-0">Invalid #</span>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            variant="whatsapp"
            className="min-h-11 h-11 rounded-xl font-bold text-xs sm:text-sm touch-manipulation"
            disabled={!primary.ok}
            onClick={() => openScenario(primary.scenario)}
          >
            <MessageCircle className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">WA: {scenarioLabel(primary.scenario)}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 h-11 w-11 p-0 rounded-xl touch-manipulation shrink-0"
            onClick={() => copyMessage(primary.scenario)}
            title="Copy message"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#25D366]/25 bg-[#25D366]/5 p-3.5 xs:p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#128C7E]">
            WhatsApp customer
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5 break-all">
            {primary.display || order.customer_whatsapp || '—'}
          </p>
          {primary.fixed && primary.ok && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
              Normalized for WhatsApp (e.g. 07… → +94…)
            </p>
          )}
          {!primary.ok && (
            <p className="text-[11px] text-destructive mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Number may not work on WhatsApp — check country code
            </p>
          )}
        </div>
      </div>

      <Button
        variant="whatsapp"
        className="w-full min-h-12 h-12 rounded-xl font-bold text-sm touch-manipulation"
        disabled={!primary.ok}
        onClick={() => openScenario(primary.scenario)}
      >
        <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
        <span className="truncate">WA: {scenarioLabel(primary.scenario)}</span>
        <ExternalLink className="w-3.5 h-3.5 ml-2 shrink-0 opacity-80" />
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-11 rounded-xl font-semibold text-xs touch-manipulation"
          onClick={() => copyMessage(primary.scenario)}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
          Copy message
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-11 rounded-xl font-semibold text-xs touch-manipulation"
          disabled={!primary.ok}
          onClick={() => openScenario('generic_support')}
        >
          Support chat
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SECONDARY.filter((s) => s !== primary.scenario).map((s) => (
          <Button
            key={s}
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-[10px] font-bold rounded-full px-2.5 touch-manipulation"
            disabled={!primary.ok}
            onClick={() => openScenario(s)}
          >
            {scenarioLabel(s)}
          </Button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground leading-snug">
        Default: <strong className="text-foreground">{scenarioLabel(detectWhatsAppScenario(order, deliveries))}</strong>
        . Auto products: send Track Order steps — codes stay on the track page.
      </p>
    </div>
  );
}

/** Open smart WA link from outside (toasts, etc.) */
export function openOrderWhatsApp(
  order: OrderForWhatsApp,
  deliveries: DeliveryRowLite[] = [],
  scenario?: WhatsAppScenario,
): boolean {
  const link = getOrderWhatsAppLink(order, scenario, deliveries);
  if (!link.url) return false;
  window.open(link.url, '_blank', 'noopener,noreferrer');
  return true;
}

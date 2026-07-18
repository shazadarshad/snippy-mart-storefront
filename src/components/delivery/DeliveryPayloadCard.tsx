import { Copy, ExternalLink, CheckCircle2, KeyRound, Ticket, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  parseDeliveryPayload,
  deliveryKindBadge,
  type DeliveryKind,
} from '@/lib/deliveryPayload';
import { cn } from '@/lib/utils';

function kindIcon(kind: DeliveryKind) {
  switch (kind) {
    case 'url':
      return <Link2 className="w-4 h-4" />;
    case 'coupon':
    case 'code':
      return <Ticket className="w-4 h-4" />;
    case 'login':
      return <KeyRound className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

type Props = {
  deliveredData: string;
  productName?: string | null;
  vendorOrderId?: string | null;
  className?: string;
};

export function DeliveryPayloadCard({
  deliveredData,
  productName,
  vendorOrderId,
  className,
}: Props) {
  const { toast } = useToast();
  const parsed = parseDeliveryPayload(deliveredData, productName);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] overflow-hidden',
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{parsed.title}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to use
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
          {kindIcon(parsed.kind)}
          {deliveryKindBadge(parsed.kind)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {parsed.fields.map((f, i) => (
          <div
            key={`${f.label}-${i}`}
            className="rounded-xl bg-background/80 border border-border p-3"
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
              {f.label}
            </p>
            <div className="flex items-start justify-between gap-2">
              {f.isUrl ? (
                <a
                  href={f.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm font-bold text-primary break-all underline-offset-2 hover:underline"
                >
                  {f.value}
                </a>
              ) : (
                <p className="font-mono text-sm font-bold text-foreground break-all whitespace-pre-wrap">
                  {f.isSecret ? f.value : f.value}
                </p>
              )}
              <div className="flex gap-1 shrink-0">
                {f.isUrl && (
                  <Button size="sm" variant="outline" className="h-8 px-2" asChild>
                    <a href={f.value} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Open
                    </a>
                  </Button>
                )}
                {f.copyable !== false && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2"
                    onClick={() => copy(f.value, f.label)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {parsed.steps.length > 0 && (
          <div className="rounded-xl bg-secondary/40 border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
              How to use
            </p>
            <ol className="space-y-1.5">
              {parsed.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-black text-emerald-600 tabular-nums shrink-0">
                    {i + 1}.
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {parsed.tip && (
          <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-emerald-500/40 pl-3">
            {parsed.tip}
          </p>
        )}

        {vendorOrderId && (
          <p className="text-[10px] text-muted-foreground font-mono">Ref: {vendorOrderId}</p>
        )}
      </div>
    </div>
  );
}

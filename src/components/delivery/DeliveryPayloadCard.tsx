import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  Copy,
  ExternalLink,
  CheckCircle2,
  KeyRound,
  Ticket,
  Link2,
  FileText,
  Eye,
  EyeOff,
  AlertTriangle,
  Mail,
  GraduationCap,
  ShieldCheck,
  ListOrdered,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  parseDeliveryPayload,
  deliveryKindBadge,
  type DeliveryKind,
  type ParsedDelivery,
  type ParsedField,
  type CourseraApiLayout,
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
    case 'coursera_api':
      return <KeyRound className="w-4 h-4" />;
    case 'empty':
      return <AlertTriangle className="w-4 h-4" />;
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

function CredRow({
  label,
  value,
  secret,
  onCopy,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: (text: string, label: string) => void;
}) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  const display = secret && !show ? '••••••••••••' : value;

  return (
    <div className="rounded-xl bg-background border border-border p-3 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between">
        <p className="font-mono text-[13px] sm:text-sm font-bold text-foreground break-all min-w-0">
          {display}
        </p>
        <div className="flex gap-1.5 shrink-0 w-full xs:w-auto">
          {secret && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-10 min-h-10 flex-1 xs:flex-none px-3 touch-manipulation rounded-xl"
              onClick={() => setShow((s) => !s)}
            >
              {show ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {show ? 'Hide' : 'Show'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-10 min-h-10 flex-1 xs:flex-none px-3 touch-manipulation rounded-xl"
            onClick={() => onCopy(value, label)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  n,
  icon,
  title,
  subtitle,
  children,
  accent = 'emerald',
}: {
  n: number;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: 'emerald' | 'blue' | 'amber';
}) {
  const ring =
    accent === 'blue'
      ? 'border-blue-500/25 bg-blue-500/[0.05]'
      : accent === 'amber'
        ? 'border-amber-500/25 bg-amber-500/[0.05]'
        : 'border-emerald-500/25 bg-emerald-500/[0.05]';
  const badge =
    accent === 'blue'
      ? 'bg-blue-600'
      : accent === 'amber'
        ? 'bg-amber-600'
        : 'bg-emerald-600';

  return (
    <section className={cn('rounded-2xl border overflow-hidden', ring)}>
      <div className="flex items-start gap-2.5 px-3 xs:px-3.5 py-3 border-b border-border/50 bg-background/40">
        <span
          className={cn(
            'w-8 h-8 rounded-xl text-white text-sm font-black flex items-center justify-center shrink-0',
            badge,
          )}
        >
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <h3 className="text-sm font-bold text-foreground leading-snug">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-3 xs:p-3.5 space-y-2.5">{children}</div>
    </section>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Button
      asChild
      variant="default"
      className="w-full h-11 min-h-11 rounded-xl font-bold touch-manipulation"
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
        {label}
      </a>
    </Button>
  );
}

/**
 * Dedicated layout — Coursera Premium Readymade API only.
 * Generic products never render this component.
 */
function CourseraApiDeliveryView({
  title,
  incomplete,
  layout,
  onCopy,
}: {
  title: string;
  incomplete?: boolean;
  layout: CourseraApiLayout;
  onCopy: (text: string, label: string) => void;
}) {
  const { accounts, orgLinks, deliveredAt, setupInstructions } = layout;
  const multi = accounts.length > 1;

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden',
        incomplete
          ? 'border-amber-500/35 bg-amber-500/[0.06]'
          : 'border-emerald-500/25 bg-emerald-500/[0.06]',
      )}
    >
      <div className="px-3 xs:px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] xs:text-sm font-bold text-foreground break-words leading-snug">
            {title}
          </p>
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-0.5',
              incomplete ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600',
            )}
          >
            {incomplete ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Incomplete — contact support
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Ready · follow steps below
              </>
            )}
          </p>
          {deliveredAt && (
            <p className="text-[10px] text-muted-foreground mt-1">Delivered {deliveredAt}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shrink-0',
            incomplete ? 'bg-amber-600' : 'bg-emerald-600',
          )}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Coursera
        </span>
      </div>

      <div className="p-3 xs:p-4 space-y-3">
        {/* STEP 1 — Temp mail */}
        <StepShell
          n={1}
          icon={<Mail className="w-4 h-4" />}
          title="Open temp mail"
          subtitle="Log in on mail.tm with the email below. Use this inbox for any Coursera codes."
          accent="blue"
        >
          <LinkButton href="https://mail.tm" label="Open mail.tm" />
          {accounts.map((a, i) => (
            <div key={`mail-${i}`} className="space-y-2">
              {multi && (
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Account {i + 1} of {accounts.length}
                </p>
              )}
              <CredRow label="Email" value={a.email} onCopy={onCopy} />
              <CredRow
                label="Email password"
                value={a.emailPassword}
                secret
                onCopy={onCopy}
              />
            </div>
          ))}
        </StepShell>

        {/* STEP 2 — Coursera login */}
        <StepShell
          n={2}
          icon={<GraduationCap className="w-4 h-4" />}
          title="Log in to Coursera"
          subtitle="Use the Coursera email + password. Same email as temp mail if login was blank."
          accent="emerald"
        >
          <LinkButton href="https://www.coursera.org" label="Open coursera.org" />
          {accounts.map((a, i) => (
            <div key={`cr-${i}`} className="space-y-2">
              {multi && (
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Account {i + 1} of {accounts.length}
                </p>
              )}
              <CredRow label="Coursera email" value={a.courseraEmail} onCopy={onCopy} />
              <CredRow
                label="Coursera password"
                value={a.courseraPassword}
                secret
                onCopy={onCopy}
              />
            </div>
          ))}
        </StepShell>

        {/* STEP 3 — Org link if needed */}
        <StepShell
          n={3}
          icon={<Link2 className="w-4 h-4" />}
          title="If courses are missing"
          subtitle="Stay logged into Coursera, then open the access link below."
          accent="amber"
        >
          {orgLinks.length > 0 ? (
            orgLinks.map((url, i) => (
              <div key={url} className="space-y-2">
                {orgLinks.length > 1 && (
                  <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                    Link {i + 1}
                  </p>
                )}
                <div className="rounded-xl bg-background border border-border p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                    Org access link
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] sm:text-sm font-bold text-primary break-all underline-offset-2 hover:underline block mb-2.5"
                  >
                    {url}
                  </a>
                  <div className="flex gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      className="h-10 min-h-10 flex-1 rounded-xl font-bold touch-manipulation"
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Open link
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-10 min-h-10 flex-1 rounded-xl touch-manipulation"
                      onClick={() => onCopy(url, 'Org access link')}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              No access link in this delivery. If you still don&apos;t see courses after login,
              message support with your Order ID.
            </p>
          )}
        </StepShell>

        {/* STEP 4 — Setup instructions (this product only) */}
        <StepShell
          n={4}
          icon={<ShieldCheck className="w-4 h-4" />}
          title="After you log in"
          subtitle="Do these once so your account stays safe."
          accent="emerald"
        >
          <ul className="space-y-2.5">
            {setupInstructions.map((line, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[13px] text-foreground leading-snug"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{line}</span>
              </li>
            ))}
          </ul>
        </StepShell>

        <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-emerald-500/40 pl-3">
          Do not share these passwords. Save your Order ID to reopen Track Order later.
        </p>
      </div>
    </div>
  );
}

function GenericField({
  f,
  i,
  revealed,
  setRevealed,
  copy,
}: {
  f: ParsedField;
  i: number;
  revealed: Record<number, boolean>;
  setRevealed: Dispatch<SetStateAction<Record<number, boolean>>>;
  copy: (text: string, label: string) => void;
}) {
  const showSecret = !!revealed[i];
  const display = f.isSecret && !showSecret ? '••••••••••••' : f.value;

  return (
    <div className="rounded-xl bg-background/80 border border-border p-2.5 xs:p-3 min-w-0 overflow-hidden">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
        {f.label}
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        {f.isUrl && !f.isSecret ? (
          <a
            href={f.value}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[13px] xs:text-sm font-bold text-primary break-all underline-offset-2 hover:underline min-w-0"
          >
            {f.value}
          </a>
        ) : (
          <p className="font-mono text-[13px] xs:text-sm font-bold text-foreground break-all whitespace-pre-wrap min-w-0">
            {display}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 shrink-0 w-full sm:w-auto sm:justify-end">
          {f.isSecret && (
            <Button
              size="sm"
              variant="ghost"
              className="min-h-10 h-10 px-3 flex-1 sm:flex-none touch-manipulation"
              type="button"
              onClick={() => setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
            >
              {showSecret ? (
                <EyeOff className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Eye className="w-3.5 h-3.5 mr-1" />
              )}
              {showSecret ? 'Hide' : 'Show'}
            </Button>
          )}
          {f.isUrl && (
            <Button
              size="sm"
              variant="outline"
              className="min-h-10 h-10 px-3 flex-1 sm:flex-none touch-manipulation"
              asChild
            >
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
              className="min-h-10 h-10 px-3 flex-1 sm:flex-none touch-manipulation"
              type="button"
              onClick={() => copy(f.value, f.label)}
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function GenericDeliveryView({
  parsed,
  incomplete,
  vendorOrderId,
  copy,
}: {
  parsed: ParsedDelivery;
  incomplete: boolean;
  vendorOrderId?: string | null;
  copy: (text: string, label: string) => void;
}) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden',
        incomplete
          ? 'border-amber-500/35 bg-amber-500/[0.06]'
          : 'border-emerald-500/25 bg-emerald-500/[0.06]',
      )}
    >
      <div className="px-3 xs:px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] xs:text-sm font-bold text-foreground break-words leading-snug">
            {parsed.title}
          </p>
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-0.5',
              incomplete ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600',
            )}
          >
            {incomplete ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Incomplete — contact support
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Ready to use
              </>
            )}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shrink-0',
            incomplete ? 'bg-amber-600' : 'bg-emerald-600',
          )}
        >
          {kindIcon(parsed.kind)}
          {deliveryKindBadge(parsed.kind)}
        </span>
      </div>

      <div className="p-3 xs:p-4 space-y-2.5 xs:space-y-3">
        {parsed.fields.map((f, i) => (
          <GenericField
            key={`${f.label}-${i}`}
            f={f}
            i={i}
            revealed={revealed}
            setRevealed={setRevealed}
            copy={copy}
          />
        ))}

        {parsed.steps.length > 0 && (
          <div className="rounded-xl bg-secondary/40 border border-border p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" />
              How to use
            </p>
            <ol className="space-y-1.5">
              {parsed.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span
                    className={cn(
                      'font-black tabular-nums shrink-0',
                      incomplete ? 'text-amber-600' : 'text-emerald-600',
                    )}
                  >
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

  const incomplete = parsed.incomplete || parsed.fields.length === 0;

  // STRICT: special UI only for Coursera Premium Readymade API packs
  if (parsed.kind === 'coursera_api' && parsed.courseraApi) {
    return (
      <div className={className}>
        <CourseraApiDeliveryView
          title={parsed.title}
          incomplete={incomplete}
          layout={parsed.courseraApi}
          onCopy={copy}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <GenericDeliveryView
        parsed={parsed}
        incomplete={incomplete}
        vendorOrderId={vendorOrderId}
        copy={copy}
      />
    </div>
  );
}

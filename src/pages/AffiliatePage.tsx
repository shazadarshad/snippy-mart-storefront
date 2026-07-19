import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  CheckCircle2,
  Loader2,
  Users,
  Wallet,
  Link2,
  Sparkles,
  Building2,
  Smartphone,
  Bitcoin,
  MessageCircle,
  Clock,
  ShieldAlert,
  LogOut,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SEO from '@/components/seo/SEO';
import PageHero from '@/components/layout/PageHero';
import { useToast } from '@/hooks/use-toast';
import {
  useApplyAffiliate,
  useAffiliateDashboard,
  useRequestAffiliatePayout,
} from '@/hooks/useAffiliate';
import { buildAffiliateLink } from '@/lib/affiliate';
import { toWhatsAppDigits } from '@/lib/phoneWhatsApp';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'snippy_aff_session';
const SUPPORT_WA = '94787767869';

type PayoutMethodKey = 'bank' | 'upi' | 'binance' | 'other';
type AffSession = { code: string; whatsapp: string };

const PAYOUT_METHODS: {
  key: PayoutMethodKey;
  label: string;
  hint: string;
  icon: typeof Building2;
}[] = [
  { key: 'bank', label: 'Bank transfer (LK)', hint: 'Sri Lankan bank account', icon: Building2 },
  { key: 'upi', label: 'UPI (India)', hint: 'GPay / PhonePe / UPI ID', icon: Smartphone },
  { key: 'binance', label: 'Binance / USDT', hint: 'Binance ID or wallet', icon: Bitcoin },
  { key: 'other', label: 'Other', hint: 'Describe how we pay you', icon: Wallet },
];

function methodLabel(key: PayoutMethodKey): string {
  return PAYOUT_METHODS.find((m) => m.key === key)?.label || key;
}

function buildPayoutNote(
  key: PayoutMethodKey,
  d: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    upiId: string;
    binanceId: string;
    other: string;
  },
): string {
  switch (key) {
    case 'bank':
      return [
        `Bank: ${d.bankName.trim()}`,
        `Account name: ${d.accountName.trim()}`,
        `Account number: ${d.accountNumber.trim()}`,
      ].join('\n');
    case 'upi':
      return `UPI ID: ${d.upiId.trim()}`;
    case 'binance':
      return `Binance / USDT: ${d.binanceId.trim()}`;
    case 'other':
      return d.other.trim();
    default:
      return '';
  }
}

function normalizeSessionWhatsApp(raw: string): string {
  const wa = toWhatsAppDigits(raw, { defaultCountry: 'LK' });
  return wa.ok ? wa.digits : raw.trim();
}

function loadSession(): AffSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as AffSession;
    if (p?.code && p?.whatsapp) {
      return { code: String(p.code).toUpperCase(), whatsapp: String(p.whatsapp) };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(s: AffSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function shareMessage(code: string, link: string) {
  return [
    'Hey! 👋',
    '',
    'I use Snippy Mart for digital tools & subscriptions — fair prices, fast delivery.',
    '',
    `Shop with my link (saves you hassle):`,
    link,
    '',
    'Or open snippymart.com and use my ref if asked.',
    `Code: ${code}`,
  ].join('\n');
}

const AffiliatePage = () => {
  const { toast } = useToast();
  const apply = useApplyAffiliate();
  const requestPayout = useRequestAffiliatePayout();

  const [guestMode, setGuestMode] = useState<'apply' | 'login'>('apply');
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    notes: '',
    code: '',
  });
  const [login, setLogin] = useState({ code: '', whatsapp: '' });
  const [session, setSession] = useState<AffSession | null>(() => loadSession());

  const dash = useAffiliateDashboard(
    session?.code || '',
    session?.whatsapp || '',
    !!session,
  );

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethodKey, setPayoutMethodKey] = useState<PayoutMethodKey>('bank');
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    upiId: '',
    binanceId: '',
    other: '',
  });

  const link = useMemo(() => {
    if (dash.data?.link) return dash.data.link;
    if (session?.code) return buildAffiliateLink(session.code);
    return '';
  }, [dash.data?.link, session?.code]);

  const waPreview = toWhatsAppDigits(
    session ? session.whatsapp : guestMode === 'apply' ? form.whatsapp : login.whatsapp,
    { defaultCountry: 'LK' },
  );

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied` });
  };

  const switchAccount = () => {
    clearSession();
    setSession(null);
    setGuestMode('login');
    setLogin({ code: '', whatsapp: '' });
  };

  const onApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const wa = normalizeSessionWhatsApp(form.whatsapp);
    if (!toWhatsAppDigits(form.whatsapp, { defaultCountry: 'LK' }).ok) {
      toast({
        title: 'Check WhatsApp number',
        description: 'Use a valid number (e.g. 07… becomes +94…).',
        variant: 'destructive',
      });
      return;
    }
    try {
      const res = await apply.mutateAsync({
        name: form.name.trim(),
        whatsapp: wa,
        email: form.email || undefined,
        notes: form.notes || undefined,
        code: form.code || undefined,
      });
      const next: AffSession = { code: res.code, whatsapp: wa };
      setSession(next);
      saveSession(next);
      toast({
        title: 'Application sent',
        description: res.message || `Code ${res.code} — pending approval.`,
      });
    } catch (err: any) {
      toast({
        title: 'Could not apply',
        description: err.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = login.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const wa = normalizeSessionWhatsApp(login.whatsapp);
    if (code.length < 2) {
      toast({ title: 'Enter your code', variant: 'destructive' });
      return;
    }
    if (!toWhatsAppDigits(login.whatsapp, { defaultCountry: 'LK' }).ok) {
      toast({
        title: 'Check WhatsApp number',
        description: 'Must match the number you applied with.',
        variant: 'destructive',
      });
      return;
    }
    const next = { code, whatsapp: wa };
    setSession(next);
    saveSession(next);
  };

  const onPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !dash.data) return;

    const amount = Number(payoutAmount);
    const minPayout = Number((dash.data as any)?.rules?.min_payout) || 2000;
    const available = Number(dash.data.totals?.available) || 0;

    if (!Number.isFinite(amount) || amount < minPayout) {
      toast({
        title: 'Invalid amount',
        description: `Minimum payout is Rs. ${minPayout.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }
    if (amount > available) {
      toast({
        title: 'Too much',
        description: `Available balance is Rs. ${available.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    const note = buildPayoutNote(payoutMethodKey, payoutDetails);
    if (!note || note.length < 4) {
      toast({
        title: 'Payout details required',
        description: 'Fill in where we should send your money.',
        variant: 'destructive',
      });
      return;
    }
    if (payoutMethodKey === 'bank') {
      if (
        !payoutDetails.bankName.trim() ||
        !payoutDetails.accountName.trim() ||
        !payoutDetails.accountNumber.trim()
      ) {
        toast({
          title: 'Bank details incomplete',
          description: 'Bank name, account name, and account number are required.',
          variant: 'destructive',
        });
        return;
      }
    }
    if (payoutMethodKey === 'upi' && !payoutDetails.upiId.includes('@')) {
      toast({
        title: 'Invalid UPI ID',
        description: 'Enter a full UPI ID like name@ybl',
        variant: 'destructive',
      });
      return;
    }
    if (payoutMethodKey === 'binance' && payoutDetails.binanceId.trim().length < 3) {
      toast({
        title: 'Binance details required',
        description: 'Enter your Binance ID or USDT receive details.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await requestPayout.mutateAsync({
        code: session.code,
        whatsapp: session.whatsapp,
        amount,
        method: methodLabel(payoutMethodKey),
        note,
      });
      toast({
        title: 'Payout requested',
        description: (res as any)?.message || 'We will process soon.',
      });
      setPayoutAmount('');
      dash.refetch();
    } catch (err: any) {
      toast({
        title: 'Payout failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const status = dash.data?.affiliate?.status;
  const isActive = status === 'active';
  const isPending = status === 'pending';
  const isBlocked = status === 'rejected' || status === 'disabled';

  return (
    <div className="min-h-dvh page-mesh overflow-x-hidden pb-safe pb-16 sm:pb-20">
      <SEO
        title="Affiliate Program"
        description="Earn ~7% commission promoting Snippy Mart. Share your link, get paid via bank, UPI, or Binance."
      />
      <PageHero
        eyebrow="Partners"
        title={
          <>
            Affiliate <span className="gradient-text">program</span>
          </>
        }
        description="Share one link. Earn when friends complete an order. No password account — just WhatsApp + your code."
      />

      <section className="mx-auto w-full max-w-4xl px-3 xs:px-4 sm:px-5 space-y-5 sm:space-y-8">
        {/* Program overview — always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {[
            {
              t: '1. Apply',
              d: 'WhatsApp + name. We review and activate (no signup password).',
            },
            {
              t: '2. Share',
              d: 'Your link: snippymart.com/?ref=CODE — works on product pages too.',
            },
            {
              t: '3. Earn',
              d: '~7% when their order completes. Short hold, then request payout.',
            },
          ].map((s) => (
            <div key={s.t} className="surface-card p-3.5 sm:p-4 border border-border min-w-0">
              <p className="font-bold text-foreground text-sm">{s.t}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { l: 'Commission', v: '~7%' },
            { l: 'Min payout', v: 'Rs. 2k' },
            { l: 'Hold', v: '~5 days' },
            { l: 'Self-ref', v: 'Blocked' },
          ].map((f) => (
            <div
              key={f.l}
              className="rounded-xl border border-border bg-card/80 px-2 xs:px-3 py-2.5 text-center min-w-0"
            >
              <p className="text-xs xs:text-sm font-black text-foreground tabular-nums leading-tight">
                {f.v}
              </p>
              <p className="text-[9px] xs:text-[10px] font-bold uppercase text-muted-foreground tracking-wide mt-0.5">
                {f.l}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 sm:p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            Fair-use rules
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>No self-purchases with your link or the same WhatsApp</li>
            <li>
              Commission may stay <strong className="text-foreground">on hold ~5 days</strong> after
              order complete
            </li>
            <li>One application per WhatsApp · first payout is reviewed manually</li>
            <li>Min payout <strong className="text-foreground">Rs. 2,000</strong> from Available balance</li>
          </ul>
        </div>

        {/* ─── GUEST: apply or login ─── */}
        {!session && (
          <div className="space-y-4">
            <div className="flex rounded-xl border border-border p-1 bg-secondary/40 gap-1">
              <button
                type="button"
                onClick={() => setGuestMode('apply')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-bold touch-manipulation transition-colors',
                  guestMode === 'apply'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setGuestMode('login')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-bold touch-manipulation transition-colors',
                  guestMode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                Open dashboard
              </button>
            </div>

            {guestMode === 'apply' ? (
              <div className="surface-card p-4 xs:p-5 sm:p-8 border border-border overflow-hidden">
                <h2 className="text-base xs:text-lg font-display font-bold mb-1">Join as an affiliate</h2>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  No password account. Apply with WhatsApp — after approval, open the dashboard with
                  your <strong className="text-foreground">code + WhatsApp</strong>.
                </p>
                <form onSubmit={onApply} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="h-12"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        WhatsApp <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        required
                        value={form.whatsapp}
                        onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                        className="h-12"
                        placeholder="077… or +94 7…"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      {form.whatsapp.trim() && (
                        <p
                          className={cn(
                            'text-[11px] font-medium',
                            waPreview.ok
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700',
                          )}
                        >
                          {waPreview.ok
                            ? `Saved as ${waPreview.e164Display}${waPreview.fixed ? ' (country code added)' : ''}`
                            : 'Check number — include country code if outside Sri Lanka'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred code (optional)</Label>
                    <Input
                      value={form.code}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        }))
                      }
                      className="h-12 font-mono"
                      placeholder="e.g. AHMED"
                      maxLength={12}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>How will you promote? (optional)</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="min-h-[80px]"
                      placeholder="WhatsApp groups, TikTok, friends…"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full min-h-12 h-12 font-bold touch-manipulation"
                    disabled={apply.isPending}
                  >
                    {apply.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Apply now
                  </Button>
                </form>
              </div>
            ) : (
              <div className="surface-card p-4 xs:p-5 sm:p-8 border border-border overflow-hidden">
                <h2 className="text-base xs:text-lg font-display font-bold mb-1">Open your dashboard</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Use the same code and WhatsApp you applied with.
                </p>
                <form onSubmit={onLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Affiliate code</Label>
                    <Input
                      required
                      value={login.code}
                      onChange={(e) =>
                        setLogin((l) => ({
                          ...l,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        }))
                      }
                      className="h-12 font-mono"
                      placeholder="YOURCODE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input
                      required
                      value={login.whatsapp}
                      onChange={(e) => setLogin((l) => ({ ...l, whatsapp: e.target.value }))}
                      className="h-12"
                      placeholder="077… or +94…"
                      inputMode="tel"
                    />
                    {login.whatsapp.trim() && waPreview.ok && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Using {waPreview.e164Display}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full min-h-12 h-12 font-bold touch-manipulation">
                    Open dashboard
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ─── PARTNER HUB (no apply form) ─── */}
        {session && (
          <div className="space-y-4">
            {dash.isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your partner hub…</p>
              </div>
            )}

            {dash.isError && (
              <div className="surface-card p-6 border border-destructive/30 text-center space-y-3">
                <p className="text-sm text-destructive font-semibold">
                  {(dash.error as Error)?.message || 'Could not load dashboard'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Check code + WhatsApp match your application. Local 07… is normalized to +94.
                </p>
                <Button variant="outline" className="h-11 font-bold" onClick={switchAccount}>
                  Try another account
                </Button>
              </div>
            )}

            {dash.data && !dash.isLoading && (
              <>
                {/* Header */}
                <div className="surface-card p-3.5 sm:p-5 border border-border overflow-hidden">
                  <div className="flex flex-col xs:flex-row xs:flex-wrap items-stretch xs:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {dash.data.affiliate.name}
                      </p>
                      <p className="font-mono text-xl xs:text-2xl font-black text-foreground break-all leading-tight">
                        {dash.data.affiliate.code}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase px-2 py-0.5 rounded-full border',
                            isActive &&
                              'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
                            isPending &&
                              'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
                            isBlocked &&
                              'bg-destructive/10 text-destructive border-destructive/25',
                          )}
                        >
                          {status}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {dash.data.affiliate.commission_percent}% commission
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 w-full xs:w-auto font-bold shrink-0 touch-manipulation"
                      onClick={switchAccount}
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Switch account
                    </Button>
                  </div>
                </div>

                {/* Pending */}
                {isPending && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">Application received</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          You’re pending approval. Keep your code safe. We’ll activate you after
                          review — then you can share your link and earn.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 rounded-xl bg-background/80 border border-border px-3 py-2.5 font-mono font-black text-lg text-center sm:text-left">
                        {dash.data.affiliate.code}
                      </div>
                      <Button
                        className="h-11 font-bold shrink-0"
                        variant="outline"
                        onClick={() => copy(dash.data!.affiliate.code, 'Code')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy code
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Commission only starts after your status is <strong>active</strong>.
                    </p>
                  </div>
                )}

                {/* Blocked */}
                {isBlocked && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 space-y-3">
                    <p className="font-bold text-foreground">
                      This partner account is {status}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You can’t request payouts or earn new commissions. Message support if you
                      think this is a mistake.
                    </p>
                    <Button variant="whatsapp" className="w-full min-h-11 h-11 font-bold" asChild>
                      <a
                        href={`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(
                          `Hi, my affiliate code ${dash.data.affiliate.code} is ${status}. Please help.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact support
                      </a>
                    </Button>
                  </div>
                )}

                {/* Active: share kit */}
                {isActive && link && (
                  <div className="surface-card p-4 sm:p-5 border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-foreground">Share & earn</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You’re live. Share this link — when someone buys and the order completes, you
                      earn ~{dash.data.affiliate.commission_percent}%.
                    </p>
                    <div className="flex flex-col gap-2 min-w-0">
                      <Input
                        readOnly
                        value={link}
                        className="font-mono text-[11px] xs:text-xs h-11 min-w-0 w-full"
                      />
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                        <Button
                          className="h-11 font-bold touch-manipulation"
                          onClick={() => copy(link, 'Affiliate link')}
                        >
                          <Copy className="w-4 h-4 mr-2 shrink-0" />
                          Copy link
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 font-bold touch-manipulation"
                          onClick={() =>
                            copy(
                              shareMessage(dash.data!.affiliate.code, link),
                              'WhatsApp pitch',
                            )
                          }
                        >
                          <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                          WA pitch
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed break-words">
                      Tip: product links work too — add{' '}
                      <span className="font-mono text-foreground">
                        ?ref={dash.data.affiliate.code}
                      </span>{' '}
                      after any product URL.
                    </p>
                  </div>
                )}

                {/* Stats — active or pending with zeros ok */}
                {(isActive || isPending) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      {
                        l: 'On hold',
                        v: (dash.data.totals as any).held ?? dash.data.totals.pending,
                        icon: Wallet,
                      },
                      { l: 'Available', v: dash.data.totals.available, icon: CheckCircle2 },
                      { l: 'Paid', v: dash.data.totals.paid, icon: Sparkles },
                      {
                        l: 'Rate',
                        v: `${dash.data.affiliate.commission_percent}%`,
                        icon: Link2,
                        raw: true,
                      },
                    ].map((s) => (
                      <div key={s.l} className="surface-card p-2.5 xs:p-3 border border-border min-w-0 overflow-hidden">
                        <s.icon className="w-4 h-4 text-primary mb-1.5" />
                        <p className="text-sm xs:text-lg font-black tabular-nums break-all leading-tight">
                          {s.raw ? s.v : `Rs. ${Number(s.v).toLocaleString()}`}
                        </p>
                        <p className="text-[9px] xs:text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                          {s.l}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payout — active only */}
                {isActive && (
                  <div className="surface-card p-3.5 sm:p-5 border border-border space-y-4 overflow-hidden">
                    <div className="flex flex-col xs:flex-row xs:flex-wrap items-stretch xs:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground">Request payout</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          Available:{' '}
                          <strong className="text-foreground tabular-nums">
                            Rs. {Number(dash.data.totals.available).toLocaleString()}
                          </strong>
                          <span className="hidden xs:inline"> · </span>
                          <span className="block xs:inline mt-0.5 xs:mt-0">
                            Min Rs.{' '}
                            {(dash.data as any)?.rules?.min_payout?.toLocaleString?.() || '2,000'}
                          </span>
                        </p>
                      </div>
                      {Number(dash.data.totals.available) >=
                        (Number((dash.data as any)?.rules?.min_payout) || 2000) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-full xs:w-auto text-xs font-bold shrink-0 touch-manipulation"
                          onClick={() =>
                            setPayoutAmount(
                              String(Math.floor(Number(dash.data!.totals.available))),
                            )
                          }
                        >
                          Use full balance
                        </Button>
                      )}
                    </div>

                    <form onSubmit={onPayout} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="payout-amount">
                          Amount (LKR) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="payout-amount"
                          type="number"
                          min={(dash.data as any)?.rules?.min_payout || 2000}
                          step={100}
                          required
                          placeholder="e.g. 2000"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="h-12 text-base"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          How should we pay you? <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                          {PAYOUT_METHODS.map((m) => {
                            const Icon = m.icon;
                            const active = payoutMethodKey === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => setPayoutMethodKey(m.key)}
                                className={cn(
                                  'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all touch-manipulation min-h-[3.25rem]',
                                  active
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-primary/40 bg-card',
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                    active
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-muted-foreground',
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                  <p className="text-sm font-bold text-foreground leading-tight">
                                    {m.label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                    {m.hint}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/30 p-3.5 sm:p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Payout details
                        </p>

                        {payoutMethodKey === 'bank' && (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label>Bank name *</Label>
                              <Input
                                required
                                value={payoutDetails.bankName}
                                onChange={(e) =>
                                  setPayoutDetails((d) => ({ ...d, bankName: e.target.value }))
                                }
                                placeholder="e.g. Sampath Bank"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Account name *</Label>
                              <Input
                                required
                                value={payoutDetails.accountName}
                                onChange={(e) =>
                                  setPayoutDetails((d) => ({ ...d, accountName: e.target.value }))
                                }
                                placeholder="Name on bank account"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Account number *</Label>
                              <Input
                                required
                                value={payoutDetails.accountNumber}
                                onChange={(e) =>
                                  setPayoutDetails((d) => ({
                                    ...d,
                                    accountNumber: e.target.value.replace(/[^\d]/g, ''),
                                  }))
                                }
                                placeholder="Account number"
                                className="h-11 font-mono"
                                inputMode="numeric"
                              />
                            </div>
                          </div>
                        )}

                        {payoutMethodKey === 'upi' && (
                          <div className="space-y-1.5">
                            <Label>UPI ID (VPA) *</Label>
                            <Input
                              required
                              value={payoutDetails.upiId}
                              onChange={(e) =>
                                setPayoutDetails((d) => ({ ...d, upiId: e.target.value.trim() }))
                              }
                              placeholder="name@ybl or number@oksbi"
                              className="h-11 font-mono"
                              autoCapitalize="off"
                              autoCorrect="off"
                            />
                          </div>
                        )}

                        {payoutMethodKey === 'binance' && (
                          <div className="space-y-1.5">
                            <Label>Binance ID or USDT details *</Label>
                            <Input
                              required
                              value={payoutDetails.binanceId}
                              onChange={(e) =>
                                setPayoutDetails((d) => ({ ...d, binanceId: e.target.value }))
                              }
                              placeholder="Binance ID / network + address"
                              className="h-11 font-mono"
                            />
                          </div>
                        )}

                        {payoutMethodKey === 'other' && (
                          <div className="space-y-1.5">
                            <Label>How to pay you *</Label>
                            <Textarea
                              required
                              value={payoutDetails.other}
                              onChange={(e) =>
                                setPayoutDetails((d) => ({ ...d, other: e.target.value }))
                              }
                              placeholder="Describe method + account details clearly…"
                              className="min-h-[88px] text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full min-h-12 h-12 font-bold touch-manipulation"
                        disabled={
                          requestPayout.isPending ||
                          Number(dash.data.totals.available) <
                            (Number((dash.data as any)?.rules?.min_payout) || 2000)
                        }
                      >
                        {requestPayout.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Wallet className="w-4 h-4 mr-2" />
                        )}
                        Request payout
                      </Button>
                    </form>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Only from <strong className="text-foreground">Available</strong> (not On
                      hold). First payout is checked manually.
                    </p>
                  </div>
                )}

                {/* Payout history */}
                {(dash.data.payouts || []).length > 0 && (
                  <div className="surface-card p-4 sm:p-5 border border-border">
                    <h3 className="font-bold mb-3">Payout history</h3>
                    <div className="space-y-2">
                      {(dash.data.payouts as any[]).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-start justify-between gap-2 text-sm border-b border-border/50 pb-2.5 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">
                              Rs. {Number(p.amount).toLocaleString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                              {p.method || '—'}
                              {p.note
                                ? `\n${String(p.note).slice(0, 120)}${String(p.note).length > 120 ? '…' : ''}`
                                : ''}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                              {p.status}
                              {p.paid_at
                                ? ` · paid ${new Date(p.paid_at).toLocaleDateString()}`
                                : p.created_at
                                  ? ` · ${new Date(p.created_at).toLocaleDateString()}`
                                  : ''}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 border',
                              p.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25'
                                : p.status === 'requested'
                                  ? 'bg-amber-500/15 text-amber-700 border-amber-500/25'
                                  : 'bg-muted text-muted-foreground border-border',
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commissions */}
                {(isActive || isPending) && (
                  <div className="surface-card p-4 sm:p-5 border border-border">
                    <h3 className="font-bold mb-3">Recent commissions</h3>
                    {(dash.data.commissions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {isPending
                          ? 'No commissions yet — share after you’re approved.'
                          : 'No commissions yet. Share your link!'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(dash.data.commissions as any[]).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="font-mono font-bold truncate">{c.order_number}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">
                                {c.status}
                                {c.hold_until && c.status === 'pending'
                                  ? ` · hold until ${new Date(c.hold_until).toLocaleDateString()}`
                                  : ''}{' '}
                                · {c.commission_percent}%
                              </p>
                            </div>
                            <p className="font-black tabular-nums shrink-0">
                              Rs. {Number(c.commission_amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Questions?{' '}
          <a
            href={`https://wa.me/${SUPPORT_WA}`}
            className="text-primary font-semibold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp support
          </a>
          {' · '}
          <Link to="/contact" className="text-primary font-semibold hover:underline">
            Contact
          </Link>
          {' · '}
          <Link to="/refund-policy" className="text-primary font-semibold hover:underline">
            Refund policy
          </Link>
        </p>
      </section>
    </div>
  );
};

export default AffiliatePage;

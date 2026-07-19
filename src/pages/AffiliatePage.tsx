import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  CheckCircle2,
  Loader2,
  Users,
  Wallet,
  Link2,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/seo/SEO';
import PageHero from '@/components/layout/PageHero';
import { useToast } from '@/hooks/use-toast';
import {
  useApplyAffiliate,
  useAffiliateDashboard,
  useRequestAffiliatePayout,
} from '@/hooks/useAffiliate';
import { buildAffiliateLink } from '@/lib/affiliate';
import { cn } from '@/lib/utils';

const AffiliatePage = () => {
  const { toast } = useToast();
  const apply = useApplyAffiliate();
  const requestPayout = useRequestAffiliatePayout();

  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    notes: '',
    code: '',
  });
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const [login, setLogin] = useState({ code: '', whatsapp: '' });
  const [session, setSession] = useState<{ code: string; whatsapp: string } | null>(() => {
    try {
      const raw = localStorage.getItem('snippy_aff_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const dash = useAffiliateDashboard(
    session?.code || '',
    session?.whatsapp || '',
    !!session,
  );

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');

  const link = useMemo(() => {
    if (dash.data?.link) return dash.data.link;
    if (session?.code) return buildAffiliateLink(session.code);
    if (appliedCode) return buildAffiliateLink(appliedCode);
    return '';
  }, [dash.data?.link, session?.code, appliedCode]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied` });
  };

  const onApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apply.mutateAsync({
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        notes: form.notes || undefined,
        code: form.code || undefined,
      });
      setAppliedCode(res.code);
      toast({
        title: 'Application sent',
        description: res.message || `Your code: ${res.code}. We will activate after review.`,
      });
      setSession({ code: res.code, whatsapp: form.whatsapp });
      localStorage.setItem(
        'snippy_aff_session',
        JSON.stringify({ code: res.code, whatsapp: form.whatsapp }),
      );
    } catch (err: any) {
      toast({
        title: 'Could not apply',
        description: err.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { code: login.code.trim().toUpperCase(), whatsapp: login.whatsapp.trim() };
    setSession(next);
    localStorage.setItem('snippy_aff_session', JSON.stringify(next));
    toast({ title: 'Loading dashboard…' });
  };

  const onPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      await requestPayout.mutateAsync({
        code: session.code,
        whatsapp: session.whatsapp,
        amount: Number(payoutAmount),
        method: payoutMethod || undefined,
      });
      toast({ title: 'Payout requested', description: 'We will process soon.' });
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

  return (
    <div className="min-h-dvh page-mesh pb-safe pb-16 sm:pb-20">
      <SEO
        title="Affiliate Program"
        description="Earn commission promoting Snippy Mart digital subscriptions. Get your link, share, and get paid."
      />
      <PageHero
        eyebrow="Partners"
        title={
          <>
            Affiliate <span className="gradient-text">program</span>
          </>
        }
        description="Share Snippy Mart. Earn ~7% when referred customers complete an order. Simple links. Fair payouts."
      />

      <section className="container mx-auto px-3 sm:px-4 max-w-4xl space-y-8">
        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { t: '1. Apply', d: 'Get a unique code after we approve you' },
            { t: '2. Share', d: 'Send your link — snippymart.com/?ref=YOURCODE' },
            { t: '3. Earn', d: 'Commission after order completes (short hold for refunds)' },
          ].map((s) => (
            <div key={s.t} className="surface-card p-4 border border-border">
              <p className="font-bold text-foreground text-sm">{s.t}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p className="font-bold text-foreground mb-1">Fair-use rules</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>No self-purchases with your own link / same WhatsApp</li>
            <li>Commission can stay <strong className="text-foreground">on hold ~5 days</strong> after order complete</li>
            <li>Daily limits apply to stop abuse · first payout is reviewed manually</li>
            <li>One application per WhatsApp · min payout Rs. 2,000</li>
          </ul>
        </div>

        <Tabs defaultValue={session ? 'dashboard' : 'apply'} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-auto p-1 mb-6">
            <TabsTrigger value="apply" className="py-2.5 gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              Apply
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="py-2.5 gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apply" className="mt-0">
            <div className="surface-card p-5 sm:p-8 border border-border">
              <h2 className="text-lg font-display font-bold mb-1">Join as an affiliate</h2>
              <p className="text-xs text-muted-foreground mb-6">
                <strong className="text-foreground">No account signup</strong> — just apply. We
                approve you, then you open the Dashboard with your <strong>code + WhatsApp</strong>.
                Default commission <strong className="text-foreground">7%</strong>. Min payout{' '}
                <strong className="text-foreground">Rs. 2,000</strong>.
              </p>
              {appliedCode ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    Application received
                  </div>
                  <p className="text-sm">
                    Your code: <span className="font-mono font-black text-lg">{appliedCode}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: pending approval. Open the Dashboard tab anytime with this code + your
                    WhatsApp.
                  </p>
                  {link && (
                    <Button
                      variant="outline"
                      className="w-full h-11 font-bold"
                      onClick={() => copy(link, 'Affiliate link')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy link
                    </Button>
                  )}
                </div>
              ) : (
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
                        className="h-11"
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
                        className="h-11"
                        placeholder="+94 7X XXX XXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="h-11"
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
                      className="h-11 font-mono"
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
                    className="w-full h-12 font-bold"
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0 space-y-4">
            {!session ? (
              <div className="surface-card p-5 sm:p-8 border border-border">
                <h2 className="text-lg font-display font-bold mb-1">Open your dashboard</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Enter the code and WhatsApp you used when applying.
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
                      className="h-11 font-mono"
                      placeholder="YOURCODE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input
                      required
                      value={login.whatsapp}
                      onChange={(e) => setLogin((l) => ({ ...l, whatsapp: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold">
                    Open dashboard
                  </Button>
                </form>
              </div>
            ) : dash.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : dash.isError ? (
              <div className="surface-card p-6 border border-destructive/30 text-center space-y-3">
                <p className="text-sm text-destructive font-semibold">
                  {(dash.error as Error)?.message || 'Could not load'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSession(null);
                    localStorage.removeItem('snippy_aff_session');
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <div className="surface-card p-4 sm:p-5 border border-border">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {dash.data!.affiliate.name}
                      </p>
                      <p className="font-mono text-2xl font-black text-foreground">
                        {dash.data!.affiliate.code}
                      </p>
                      <p
                        className={cn(
                          'text-xs font-bold mt-1 uppercase',
                          dash.data!.affiliate.status === 'active'
                            ? 'text-emerald-600'
                            : dash.data!.affiliate.status === 'pending'
                              ? 'text-amber-600'
                              : 'text-muted-foreground',
                        )}
                      >
                        {dash.data!.affiliate.status} · {dash.data!.affiliate.commission_percent}%
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSession(null);
                        localStorage.removeItem('snippy_aff_session');
                      }}
                    >
                      Switch account
                    </Button>
                  </div>
                  {link && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Input readOnly value={link} className="font-mono text-xs h-11" />
                      <Button
                        className="h-11 shrink-0 font-bold"
                        onClick={() => copy(link, 'Link')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy link
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    {
                      l: 'On hold',
                      v: (dash.data!.totals as any).held ?? dash.data!.totals.pending,
                      icon: Wallet,
                    },
                    { l: 'Available', v: dash.data!.totals.available, icon: CheckCircle2 },
                    { l: 'Paid', v: dash.data!.totals.paid, icon: Sparkles },
                    {
                      l: 'Rate',
                      v: `${dash.data!.affiliate.commission_percent}%`,
                      icon: Link2,
                      raw: true,
                    },
                  ].map((s) => (
                    <div key={s.l} className="surface-card p-3 border border-border">
                      <s.icon className="w-4 h-4 text-primary mb-2" />
                      <p className="text-lg font-black tabular-nums">
                        {s.raw ? s.v : `Rs. ${Number(s.v).toLocaleString()}`}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        {s.l}
                      </p>
                    </div>
                  ))}
                </div>

                {dash.data!.affiliate.status === 'active' && (
                  <div className="surface-card p-4 sm:p-5 border border-border">
                    <h3 className="font-bold mb-3">Request payout</h3>
                    <form onSubmit={onPayout} className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="number"
                        min={2000}
                        step={100}
                        required
                        placeholder="Amount (min 2000)"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="h-11"
                      />
                      <Input
                        placeholder="Bank / Binance note"
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="h-11"
                      />
                      <Button
                        type="submit"
                        className="h-11 font-bold shrink-0"
                        disabled={requestPayout.isPending}
                      >
                        Request
                      </Button>
                    </form>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Only from <strong>Available</strong> (not On hold). First payout is checked
                      manually. Min Rs.{' '}
                      {(dash.data as any)?.rules?.min_payout?.toLocaleString?.() || '2,000'}.
                    </p>
                  </div>
                )}

                <div className="surface-card p-4 sm:p-5 border border-border">
                  <h3 className="font-bold mb-3">Recent commissions</h3>
                  {(dash.data!.commissions || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No commissions yet. Share your link!</p>
                  ) : (
                    <div className="space-y-2">
                      {dash.data!.commissions.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 text-sm border-b border-border/50 pb-2"
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
              </>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Questions?{' '}
          <Link to="/contact" className="text-primary font-semibold hover:underline">
            Contact us
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

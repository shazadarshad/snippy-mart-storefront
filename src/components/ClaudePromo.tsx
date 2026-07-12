import { Link } from 'react-router-dom';
import { ArrowRight, Check, Crown, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClaudePromoProps {
  variant?: 'banner' | 'section' | 'compact';
  className?: string;
}

const ClaudePromo = ({ variant = 'section', className }: ClaudePromoProps) => {
  if (variant === 'compact') {
    return (
      <Link
        to="/claude"
        className={cn(
          'group flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent hover:border-orange-500/50 transition-all',
          className
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground">Claude Team · 1 Month</p>
          <p className="text-xs text-muted-foreground truncate">Private workspace · Pro / Max from LKR 2,599</p>
        </div>
        <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-600/90 via-amber-600/85 to-orange-500/90 text-white p-4 sm:p-5',
          className
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Featured</p>
              <p className="font-black text-base sm:text-lg truncate">Get Claude Team — Pro or Max 5X</p>
              <p className="text-xs text-white/80 truncate">Private workspace invite on your account</p>
            </div>
          </div>
          <Button
            asChild
            className="h-11 rounded-xl font-bold bg-white text-orange-700 hover:bg-white/90 shrink-0 shadow-lg"
          >
            <Link to="/claude">
              Purchase Claude
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Full section card
  return (
    <section className={cn('relative py-16 sm:py-24 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-orange-500/[0.04] to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto rounded-[2rem] border border-orange-500/25 bg-gradient-to-br from-card via-card to-orange-500/5 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[10px] font-black uppercase tracking-widest w-fit mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                Hot · Limited slots
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight mb-3 leading-tight">
                Claude Team Plan{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">
                  – 1 Month
                </span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                Get invited to a <strong className="text-foreground">private workspace</strong> with{' '}
                <strong className="text-foreground">Pro or Max 5X</strong> access on your own Claude
                account. Pay in full (recommended) or reserve with 50%.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Private Team workspace invite',
                  'Pro Seat from LKR 2,599 · Max 5X LKR 4,599',
                  '20 day warranty · your email only',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="h-12 rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25"
                  asChild
                >
                  <Link to="/claude">
                    Purchase Claude
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-2xl font-bold border-2" asChild>
                  <Link to="/claude#plans">Compare Pro & Max</Link>
                </Button>
              </div>
            </div>

            <div className="relative p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-t lg:border-t-0 lg:border-l border-orange-500/15 flex flex-col justify-center gap-3">
              {[
                { icon: Users, t: 'Private workspace', d: 'Invite lands on your Claude email' },
                { icon: Crown, t: 'Pro or Max 5X', d: 'Pick the seat that fits your usage' },
                { icon: Zap, t: 'Fast pre-order', d: 'Bank transfer · track order online' },
              ].map(({ icon: Icon, t, d }) => (
                <div
                  key={t}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-background/70 border border-border backdrop-blur-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClaudePromo;

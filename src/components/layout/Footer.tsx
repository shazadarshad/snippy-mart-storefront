import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url;
  const storeName = settings?.store_name || 'Snippy Mart';
  const year = new Date().getFullYear();

  const shop = [
    { n: 'Products', p: '/products' },
    { n: 'Track order', p: '/track-order' },
    { n: 'Affiliate', p: '/affiliate' },
    { n: 'About', p: '/about' },
    { n: 'Contact', p: '/contact' },
  ];
  const legal = [
    { n: 'Terms', p: '/terms-of-service' },
    { n: 'Privacy', p: '/privacy-policy' },
    { n: 'Refunds', p: '/refund-policy' },
  ];

  return (
    <footer className="relative border-t border-border/50 overflow-hidden">
      <div className="absolute inset-0 page-mesh opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-card/40 backdrop-blur-sm pointer-events-none" />
      <div className="container mx-auto px-4 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-9 w-auto" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-accent flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/15">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="font-display font-bold text-lg tracking-tight">{storeName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Premium digital subscriptions — clean bank checkout, live tracking, real WhatsApp
              support.
            </p>
            <a
              href="https://wa.me/94787767869"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-[#25D366] text-white text-sm font-semibold shadow-md shadow-[#25D366]/25 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp support
            </a>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-4">
              Shop
            </p>
            <ul className="space-y-2.5">
              {shop.map((i) => (
                <li key={i.p}>
                  <Link to={i.p} className="text-sm text-muted-foreground hover:text-foreground transition">
                    {i.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-4">
              Legal
            </p>
            <ul className="space-y-2.5">
              {legal.map((i) => (
                <li key={i.p}>
                  <Link to={i.p} className="text-sm text-muted-foreground hover:text-foreground transition">
                    {i.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© {year} {storeName}</p>
          <p className="opacity-70">Secure checkout · Live tracking · Real support</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

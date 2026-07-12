import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, ArrowUpRight } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url;
  const storeName = settings?.store_name || 'Snippy Mart';
  const currentYear = new Date().getFullYear();

  const shop = [
    { name: 'All products', path: '/products' },
    { name: 'Track order', path: '/track-order' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const legal = [
    { name: 'Terms of Service', path: '/terms-of-service' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Refund Policy', path: '/refund-policy' },
  ];

  return (
    <footer className="relative border-t border-border bg-card/40">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-lg font-display font-black text-foreground">
                {storeName.includes(' ') ? (
                  <>
                    {storeName.split(' ')[0]}{' '}
                    <span className="gradient-text">{storeName.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : (
                  storeName
                )}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Premium digital subscriptions with secure bank checkout, live tracking, and WhatsApp
              support.
            </p>
            <a
              href="https://wa.me/94787767869"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#22c55e] transition-colors shadow-md shadow-[#25d366]/20"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp support
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Shop
            </p>
            <ul className="space-y-2.5">
              {shop.map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Legal
            </p>
            <ul className="space-y-2.5">
              {legal.map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {currentYear} {storeName}. All rights reserved.
          </p>
          <p className="opacity-70">Secure checkout · Live tracking · WhatsApp help</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url;
  const storeName = settings?.store_name || 'Snippy Mart';
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const supportLinks = [
    { name: 'FAQ', path: '/contact#faq' },
    { name: 'Terms of Service', path: '/about' },
    { name: 'Privacy Policy', path: '/about' },
  ];

  return (
    <footer className="relative border-t border-border bg-card/30 backdrop-blur-lg overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <span className="text-2xl font-display font-black text-foreground tracking-tight">
                {storeName.includes(' ') ? (
                  <>
                    {storeName.split(' ')[0]}<span className="gradient-text">{storeName.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : (
                  storeName
                )}
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm text-lg leading-relaxed">
              Your trusted destination for premium digital subscriptions at unbeatable prices.
              Instant delivery, reliable service.
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/94787767869"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-bold hover:bg-[#22c55e] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#25d366]/20"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="font-bold text-foreground mb-6 text-lg">Quick Access</h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-foreground mb-6 text-lg">Support</h4>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground font-medium">
            © {currentYear} {storeName}. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Made with <span className="text-red-500 animate-pulse">❤️</span> for digital enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

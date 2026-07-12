import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface NavbarProps {
  onCartOpen: () => void;
}

const Navbar = ({ onCartOpen }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logoUrl = settings?.logo_url;
  const storeName = settings?.store_name || 'Snippy Mart';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Track', path: '/track-order' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/85 backdrop-blur-2xl border-b border-border/60 shadow-sm'
          : 'bg-background/50 backdrop-blur-xl border-b border-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-sm sm:text-base font-display font-black text-foreground tracking-tight truncate">
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

          <div className="hidden md:flex items-center p-1 rounded-full bg-secondary/50 border border-border/60">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all',
                  isActive(link.path)
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <CurrencySelector className="mr-0.5 hidden sm:flex" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-xl" onClick={onCartOpen}>
              <ShoppingCart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'block px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                      isActive(link.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="px-4 py-3 flex items-center justify-between border-t border-border/50 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Currency
                  </span>
                  <CurrencySelector />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;

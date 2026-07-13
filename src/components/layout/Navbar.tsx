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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const logoUrl = settings?.logo_url;
  const storeName = settings?.store_name || 'Snippy Mart';
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Track', path: '/track-order' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-4 pt-3">
      <div
        className={cn(
          'mx-auto max-w-6xl rounded-2xl border transition-all duration-300',
          scrolled
            ? 'border-border/60 bg-background/85 backdrop-blur-2xl shadow-[var(--shadow-md)] shadow-primary/5'
            : 'border-border/35 bg-background/45 backdrop-blur-xl'
        )}
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-5">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-accent flex items-center justify-center shadow-md shadow-primary/35 shrink-0 ring-1 ring-white/20">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-display font-bold text-sm sm:text-base tracking-tight truncate">
              {storeName.split(' ')[0]}
              {storeName.includes(' ') && (
                <span className="gradient-text"> {storeName.split(' ').slice(1).join(' ')}</span>
              )}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl bg-secondary/40 border border-border/40">
            {links.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200',
                  location.pathname === l.path
                    ? 'nav-pill-active'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                )}
              >
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <CurrencySelector className="hidden sm:flex" />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl w-10 h-10"
              onClick={onCartOpen}
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl w-10 h-10"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="p-3 space-y-1">
                {links.map((l) => (
                  <Link
                    key={l.path}
                    to={l.path}
                    className={cn(
                      'block px-4 py-3 rounded-xl text-sm font-semibold',
                      location.pathname === l.path
                        ? 'bg-primary/12 text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {l.name}
                  </Link>
                ))}
                <div className="flex items-center justify-between px-4 py-3 mt-1 border-t border-border/50">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Currency
                  </span>
                  <CurrencySelector />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;

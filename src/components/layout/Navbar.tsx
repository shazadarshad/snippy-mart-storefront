import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Sparkles, Zap } from 'lucide-react';
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
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { data: settings } = useSiteSettings();

  // Handle body scroll locking for mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
  const isClaude = location.pathname.startsWith('/claude');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/20 shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-sm sm:text-lg font-display font-black text-foreground uppercase tracking-tight truncate">
              {storeName.includes(' ') ? (
                <>
                  {storeName.split(' ')[0]}
                  <span className="gradient-text">{storeName.split(' ').slice(1).join(' ')}</span>
                </>
              ) : (
                storeName
              )}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200',
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button
              size="sm"
              className={cn(
                'hidden sm:inline-flex h-9 px-3 rounded-xl text-[11px] font-black uppercase tracking-wide',
                isClaude
                  ? 'bg-orange-500 text-white hover:bg-orange-400'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 shadow-md shadow-orange-500/20'
              )}
              asChild
            >
              <Link to="/claude">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Claude
              </Link>
            </Button>
            <CurrencySelector className="mr-0.5 hidden md:flex" />
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="relative w-9 h-9"
              onClick={onCartOpen}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center animate-scale-in">
                  {itemCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-9 h-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden overflow-hidden glass-premium mt-2 mb-4 rounded-2xl"
            >
              <div className="p-3 space-y-1">
                <Link
                  to="/claude"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-2"
                >
                  <Zap className="w-4 h-4" />
                  Purchase Claude
                </Link>
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-200',
                        isActive(link.path)
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="px-4 py-4 pt-5 mt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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

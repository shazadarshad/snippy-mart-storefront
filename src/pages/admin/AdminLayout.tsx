import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Loader2,
  MessageSquare,
  BarChart3,
  Mail,
  FileText,
  ShieldCheck,
  Tag,
  Users,
  Brain,
  Upload,
  Zap,
  Link2,
  Wallet,
  MoreHorizontal,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { AdminPwaBanner } from '@/components/admin/AdminPwaBanner';
import { useAdminOrderAlerts } from '@/hooks/useAdminOrderAlerts';

type MenuItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  indent?: boolean;
  group?: string;
};

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, group: 'Main' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, group: 'Main' },
  { name: 'Products', path: '/admin/products', icon: Package, group: 'Main' },
  { name: 'Reseller API', path: '/admin/reseller-api', icon: Wallet, badge: 'AUTO', group: 'Main' },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, group: 'Main' },
  { name: 'Fulfillment', path: '/admin/fulfillment', icon: ShieldCheck, group: 'Ops' },
  { name: 'Inventory', path: '/admin/inventory', icon: Package, group: 'Ops' },
  { name: 'Claude', path: '/admin/claude', icon: Zap, badge: 'NEW', group: 'Ops' },
  { name: 'Coupons', path: '/admin/coupons', icon: Tag, group: 'Ops' },
  { name: 'WhatsApp Bot', path: '/admin/whatsapp/products', icon: MessageSquare, badge: 'NEW', group: 'WhatsApp' },
  { name: 'WA Settings', path: '/admin/whatsapp/settings', icon: Settings, indent: true, group: 'WhatsApp' },
  { name: 'WA Analytics', path: '/admin/whatsapp/analytics', icon: BarChart3, indent: true, group: 'WhatsApp' },
  { name: 'AI Knowledge', path: '/admin/ai-knowledge', icon: Brain, badge: 'AI', group: 'Tools' },
  { name: 'Cursor System', path: '/admin/cursor-system', icon: Users, group: 'Tools' },
  { name: 'Extension Upload', path: '/admin/extension-upload', icon: Upload, group: 'Tools' },
  { name: 'Link Shortener', path: '/admin/link-shortener', icon: Link2, group: 'Tools' },
  { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare, group: 'Content' },
  { name: 'Email Settings', path: '/admin/email-settings', icon: Mail, group: 'Content' },
  { name: 'Email Templates', path: '/admin/email-templates', icon: FileText, group: 'Content' },
  { name: 'Policies', path: '/admin/policies', icon: FileText, group: 'Content' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, group: 'System' },
];

/** Bottom bar — daily ops only */
const bottomNav: { name: string; path: string; icon: React.ComponentType<{ className?: string }>; match?: string }[] = [
  { name: 'Home', path: '/admin/dashboard', icon: LayoutDashboard, match: '/admin/dashboard' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, match: '/admin/orders' },
  { name: 'Products', path: '/admin/products', icon: Package, match: '/admin/products' },
  { name: 'Auto', path: '/admin/reseller-api', icon: Wallet, match: '/admin/reseller-api' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading, signOut } = useAuth();

  useAdminOrderAlerts(!!user && !!isAdmin && !loading);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const pageTitle = useMemo(() => {
    const hit = menuItems.find(
      (i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'),
    );
    return hit?.name || 'Admin';
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const isBottomActive = (item: (typeof bottomNav)[0]) => {
    const m = item.match || item.path;
    if (m === '/admin/dashboard') {
      return (
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        location.pathname.startsWith('/admin/dashboard')
      );
    }
    return location.pathname.startsWith(m);
  };

  const moreActive = !bottomNav.some((i) => isBottomActive(i)) && location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const g = item.group || 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return map;
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Loading admin…
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const navLink = (item: MenuItem) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => setSidebarOpen(false)}
      className={cn(
        'flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group min-h-[48px] touch-manipulation',
        item.indent && 'ml-4',
        isActive(item.path)
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary',
      )}
    >
      <item.icon
        className={cn(
          'w-5 h-5 shrink-0',
          isActive(item.path) ? 'opacity-100' : 'opacity-70',
        )}
      />
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && !isActive(item.path) && (
        <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded-full">
          {item.badge}
        </span>
      )}
      {isActive(item.path) && <ChevronRight className="w-4 h-4 opacity-70 shrink-0" />}
    </Link>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Mobile top bar */}
      <header
        className={cn(
          'lg:hidden fixed top-0 left-0 right-0 z-[60]',
          'bg-background/95 backdrop-blur-lg border-b border-border',
          'flex items-center justify-between gap-2 px-3',
          'h-14 pt-[env(safe-area-inset-top)]',
          'min-h-[calc(3.5rem+env(safe-area-inset-top))]',
        )}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-secondary active:scale-95 transition-transform touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">
            Snippy Admin
          </p>
          <p className="text-sm font-bold text-foreground truncate mt-0.5">{pageTitle}</p>
        </div>

        <Link
          to="/admin/orders"
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center touch-manipulation',
            isActive('/admin/orders')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary text-foreground',
          )}
          aria-label="Orders"
        >
          <ShoppingCart className="w-5 h-5" />
        </Link>
      </header>

      {/* Drawer backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/55 backdrop-blur-sm z-[70] transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Side drawer / desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-[min(100vw-3rem,20rem)] sm:w-72 bg-card border-r border-border z-[80]',
          'transition-transform duration-300 ease-out shadow-2xl lg:shadow-none lg:w-64 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full pt-[env(safe-area-inset-top)]">
          <div className="h-14 lg:h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={() => setSidebarOpen(false)}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <span className="font-display font-black text-foreground text-base tracking-tight block truncate">
                  Snippy<span className="text-primary">Admin</span>
                </span>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wide -mt-0.5">
                  Control center
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary touch-manipulation"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-border/60 bg-secondary/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-primary-foreground font-black text-sm ring-2 ring-background shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Signed in
                </p>
                <p className="text-xs font-semibold text-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-4 overflow-y-auto overscroll-contain pb-6">
            {Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                <p className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                  {group}
                </p>
                <div className="space-y-0.5">{items.map(navLink)}</div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-border shrink-0 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              variant="outline"
              className="w-full justify-start h-12 rounded-xl font-semibold touch-manipulation"
              asChild
            >
              <Link to="/" onClick={() => setSidebarOpen(false)}>
                <Store className="w-4 h-4 mr-3" />
                View storefront
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 font-semibold touch-manipulation"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main
        className={cn(
          'lg:pl-64 min-h-dvh',
          // top header + bottom nav on mobile
          'pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0',
          'pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0',
        )}
      >
        <AdminPwaBanner />
        <div className="p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full">{/* content */ <Outlet />}</div>
      </main>

      {/* Mobile bottom nav — PWA thumb zone */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-[65]',
          'bg-background/95 backdrop-blur-lg border-t border-border',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {bottomNav.map((item) => {
            const active = isBottomActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 touch-manipulation select-none',
                  'transition-colors active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-8 rounded-xl flex items-center justify-center transition-colors',
                    active && 'bg-primary/12',
                  )}
                >
                  <item.icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                </div>
                <span className={cn('text-[10px] font-bold leading-none', active && 'text-primary')}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 touch-manipulation select-none',
              'transition-colors active:scale-95',
              moreActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div
              className={cn(
                'w-10 h-8 rounded-xl flex items-center justify-center',
                moreActive && 'bg-primary/12',
              )}
            >
              <MoreHorizontal className={cn('w-5 h-5', moreActive && 'stroke-[2.5]')} />
            </div>
            <span className={cn('text-[10px] font-bold leading-none', moreActive && 'text-primary')}>
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;

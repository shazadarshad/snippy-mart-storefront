import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading, signOut } = useAuth();

  // Redirect to auth page if not logged in or not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Fulfillment', path: '/admin/fulfillment', icon: ShieldCheck },
    { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Inventory', path: '/admin/inventory', icon: Package },
    { name: 'Cursor Users', path: '/admin/cursor-customers', icon: Users },
    { name: 'Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Email Settings', path: '/admin/email-settings', icon: Mail },
    { name: 'Email Templates', path: '/admin/email-templates', icon: FileText },
    { name: 'Policies', path: '/admin/policies', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authorized
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-[60] flex items-center justify-between px-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-black text-foreground text-sm uppercase tracking-wider block leading-none">Snippy Admin</span>
            <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">Mobile Panel</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 rounded-xl hover:bg-secondary"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Sidebar Backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border z-[80] transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl lg:shadow-none lg:z-0",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 lg:h-20 flex items-center px-6 border-b border-border shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-black text-foreground text-lg tracking-tight">
                  Snippy<span className="gradient-text">Mart</span>
                </span>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70 -mt-1">Control Center</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-xs ring-2 ring-background">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Operator</p>
                <p className="text-xs font-bold text-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar pb- safe-area-bottom">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wide group",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive(item.path) ? "opacity-100" : "opacity-70")} />
                {item.name}
                {isActive(item.path) && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-70" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0 bg-card">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout Session
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

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
    { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare },
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 lg:h-20 flex items-center px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-foreground">
                  Snippy<span className="gradient-text">Mart</span>
                </span>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {isActive(item.path) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
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

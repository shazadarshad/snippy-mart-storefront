import {
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';
import { useOrderStats, useRecentOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { formatPrice } = useCurrency();
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useRecentOrders(5);
  const { data: products = [] } = useProducts(true);

  const activeProducts = products.filter(p => p.is_active).length;

  const stats = [
    {
      title: 'Total Revenue',
      value: statsLoading ? '...' : formatPrice(orderStats?.totalRevenue || 0),
      subtitle: 'From completed orders',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Orders',
      value: statsLoading ? '...' : (orderStats?.totalOrders || 0).toString(),
      subtitle: 'All time',
      icon: ShoppingCart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Products',
      value: activeProducts.toString(),
      subtitle: `${products.length} total`,
      icon: Package,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pending Orders',
      value: statsLoading ? '...' : (orderStats?.pendingOrders || 0).toString(),
      subtitle: 'Needs attention',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'processing':
        return 'bg-primary/10 text-primary';
      case 'shipping':
        return 'bg-blue-500/10 text-blue-500';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'on_hold':
        return 'bg-orange-500/10 text-orange-500';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-display font-black text-foreground">Dashboard</h1>
        <p className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-70">Commerce Intelligence Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border shadow-sm overflow-hidden group hover:border-primary/50 transition-colors">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${stat.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg md:text-2xl font-black text-foreground truncate">{stat.value}</p>
                  <p className="text-[9px] md:text-xs text-muted-foreground font-black uppercase tracking-tighter truncate">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Summary - Scrollable on mobile for better fit or Grid 2x2 */}
      {!statsLoading && orderStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-warning/10 border border-warning/20 flex flex-col items-center justify-center text-center">
            <p className="text-xl md:text-2xl font-black text-warning leading-none">{orderStats.pendingOrders}</p>
            <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase mt-1 tracking-wider">Pending</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-success/10 border border-success/20 flex flex-col items-center justify-center text-center">
            <p className="text-xl md:text-2xl font-black text-success leading-none">{orderStats.completedOrders}</p>
            <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase mt-1 tracking-wider">Completed</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center text-center">
            <p className="text-xl md:text-2xl font-black text-destructive leading-none">{orderStats.cancelledOrders}</p>
            <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase mt-1 tracking-wider">Cancelled</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center text-center">
            <p className="text-xl md:text-2xl font-black text-muted-foreground leading-none">{orderStats.refundedOrders}</p>
            <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase mt-1 tracking-wider">Refunded</p>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Orders</CardTitle>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
              <p className="text-sm">Orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Order ID</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Customer</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Products</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Status</th>
                    <th className="text-right text-sm font-medium text-muted-foreground py-3 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2">
                        <span className="font-mono text-sm text-foreground">{order.order_number}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="text-sm text-foreground">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_whatsapp}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-foreground">
                        {order.order_items?.map(item => item.product_name).join(', ') || '-'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-sm font-medium text-foreground">
                        {formatPrice(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

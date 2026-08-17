import {
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';
import { useOrderStats, useRecentOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { adminStatusLabel } from '@/lib/orderStatus';
import { paymentMethodShort } from '@/lib/paymentMethod';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const { formatPrice } = useCurrency();
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useRecentOrders(5);
  const { data: products = [] } = useProducts(true);

  const activeProducts = products.filter((p) => p.is_active).length;

  const stats = [
    {
      title: 'Total Revenue',
      value: statsLoading ? '…' : formatPrice(orderStats?.totalRevenue || 0),
      subtitle: 'From completed orders',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Orders',
      value: statsLoading ? '…' : (orderStats?.totalOrders || 0).toString(),
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
      value: statsLoading ? '…' : (orderStats?.pendingOrders || 0).toString(),
      subtitle: 'Needs attention',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'shipping':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'on_hold':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8 min-w-0">
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Commerce overview · live snapshot</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-5 admin-stagger">
        {stats.map((stat) => (
          <div key={stat.title} className="admin-stat group">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div
                className={cn(
                  'w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                  stat.bgColor,
                )}
              >
                <stat.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-xl md:text-2xl font-black text-foreground tabular-nums break-all leading-tight">
                  {stat.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-wide mt-0.5 truncate">
                  {stat.title}
                </p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 hidden sm:block truncate">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!statsLoading && orderStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              n: orderStats.pendingOrders,
              l: 'Pending',
              c: 'bg-warning/10 border-warning/20 text-warning',
            },
            {
              n: orderStats.completedOrders,
              l: 'Completed',
              c: 'bg-success/10 border-success/20 text-success',
            },
            {
              n: orderStats.cancelledOrders,
              l: 'Cancelled',
              c: 'bg-destructive/10 border-destructive/20 text-destructive',
            },
            {
              n: orderStats.refundedOrders,
              l: 'Refunded',
              c: 'bg-secondary/80 border-border text-muted-foreground',
            },
          ].map((s) => (
            <div
              key={s.l}
              className={cn(
                'p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center text-center min-w-0',
                s.c,
              )}
            >
              <p className="text-xl sm:text-2xl font-black leading-none tabular-nums">{s.n}</p>
              <p className="text-[9px] sm:text-[10px] font-black uppercase mt-1.5 tracking-wider opacity-80">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      )}

      <Card className="admin-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-3.5 sm:px-6 py-3.5 sm:py-4">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
            Recent orders
          </CardTitle>
          <Link
            to="/admin/orders"
            className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 font-bold shrink-0 touch-manipulation"
          >
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="px-3.5 sm:px-6 pb-4 sm:pb-6 pt-0">
          {ordersLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs mt-1">They’ll show up here when customers buy.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2.5">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="block rounded-xl border border-border bg-secondary/20 p-3 active:scale-[0.99] transition-transform touch-manipulation"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-foreground break-all">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-foreground font-medium mt-0.5 truncate">
                          {order.customer_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {order.order_items?.map((i) => i.product_name).join(', ') || '—'}
                          {order.payment_method
                            ? ` · ${paymentMethodShort(order.payment_method)}`
                            : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black tabular-nums">
                          {formatPrice(order.total_amount)}
                        </p>
                        <span
                          className={cn(
                            'inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
                            getStatusColor(order.status),
                          )}
                        >
                          {adminStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-1">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-bold text-muted-foreground py-3 px-2">
                        Order
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground py-3 px-2">
                        Customer
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground py-3 px-2">
                        Products
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground py-3 px-2">
                        Pay
                      </th>
                      <th className="text-left text-xs font-bold text-muted-foreground py-3 px-2">
                        Status
                      </th>
                      <th className="text-right text-xs font-bold text-muted-foreground py-3 px-2">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-sm text-foreground font-medium">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_whatsapp}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground max-w-[180px] truncate">
                          {order.order_items?.map((item) => item.product_name).join(', ') ||
                            '—'}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">
                            {paymentMethodShort(order.payment_method)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={cn(
                              'inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase border',
                              getStatusColor(order.status),
                            )}
                          >
                            {adminStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-bold text-foreground tabular-nums">
                          {formatPrice(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

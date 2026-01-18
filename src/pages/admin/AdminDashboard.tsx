import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,459',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Products',
      value: '48',
      change: '+3',
      trend: 'up',
      icon: Package,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pending Orders',
      value: '23',
      change: '-5',
      trend: 'down',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const recentOrders = [
    { id: 'SNIP-2026-000123', customer: '+1 234 567 8900', product: 'Netflix Premium', status: 'completed', amount: '$9.99' },
    { id: 'SNIP-2026-000122', customer: '+1 234 567 8901', product: 'Spotify Premium', status: 'pending', amount: '$4.99' },
    { id: 'SNIP-2026-000121', customer: '+1 234 567 8902', product: 'ChatGPT Plus', status: 'completed', amount: '$12.99' },
    { id: 'SNIP-2026-000120', customer: '+1 234 567 8903', product: 'Canva Pro', status: 'cancelled', amount: '$6.99' },
    { id: 'SNIP-2026-000119', customer: '+1 234 567 8904', product: 'YouTube Premium', status: 'completed', amount: '$5.99' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Orders</CardTitle>
          <a href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Order ID</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Customer</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Product</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-2">Status</th>
                  <th className="text-right text-sm font-medium text-muted-foreground py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2">
                      <span className="font-mono text-sm text-foreground">{order.id}</span>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{order.customer}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{order.product}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-medium text-foreground">{order.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

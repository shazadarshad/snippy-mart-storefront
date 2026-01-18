import { useState } from 'react';
import { Search, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/store';

interface Order {
  id: string;
  customer: string;
  whatsapp: string;
  products: string[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [orders] = useState<Order[]>([
    {
      id: 'SNIP-2026-000123',
      customer: 'Kasun Perera',
      whatsapp: '+94 77 123 4567',
      products: ['Netflix Premium', 'Spotify Premium'],
      total: 4498,
      status: 'completed',
      date: '2026-01-18',
    },
    {
      id: 'SNIP-2026-000122',
      customer: 'Nimali Silva',
      whatsapp: '+94 77 234 5678',
      products: ['ChatGPT Plus'],
      total: 3899,
      status: 'pending',
      date: '2026-01-18',
    },
    {
      id: 'SNIP-2026-000121',
      customer: 'Ruwan Fernando',
      whatsapp: '+94 77 345 6789',
      products: ['Canva Pro', 'YouTube Premium'],
      total: 3898,
      status: 'completed',
      date: '2026-01-17',
    },
    {
      id: 'SNIP-2026-000120',
      customer: 'Dilini Jayasinghe',
      whatsapp: '+94 77 456 7890',
      products: ['Adobe Creative Cloud'],
      total: 7499,
      status: 'cancelled',
      date: '2026-01-17',
    },
    {
      id: 'SNIP-2026-000119',
      customer: 'Tharindu Bandara',
      whatsapp: '+94 77 567 8901',
      products: ['Disney+ Premium'],
      total: 2099,
      status: 'pending',
      date: '2026-01-16',
    },
  ]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.whatsapp.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <p className="text-2xl font-bold text-success">{completedCount}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-2xl font-bold text-destructive">{cancelledCount}</p>
          <p className="text-sm text-muted-foreground">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-12 bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Order ID</th>
                <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Customer</th>
                <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Products</th>
                <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Status</th>
                <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Date</th>
                <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Total</th>
                <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm text-foreground">{order.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-foreground">{order.customer}</p>
                      <p className="text-sm text-muted-foreground">{order.whatsapp}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-foreground">
                      {order.products.join(', ')}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{order.date}</td>
                  <td className="py-4 px-4 text-right font-medium text-foreground">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>
    </div>
  );
};

export default AdminOrders;

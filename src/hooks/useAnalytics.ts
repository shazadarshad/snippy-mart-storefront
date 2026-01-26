import { useMemo } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

interface DailyRevenue {
    date: string;
    revenue: number;
    orders: number;
}

interface CategoryRevenue {
    category: string;
    revenue: number;
    percentage: number;
}

interface TopProduct {
    id: string;
    name: string;
    image_url: string;
    totalSold: number;
    revenue: number;
}

interface AnalyticsData {
    dailyRevenue: DailyRevenue[];
    categoryRevenue: CategoryRevenue[];
    topProducts: TopProduct[];
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    completionRate: number;
    isLoading: boolean;
}

export const useAnalytics = (days: number = 30): AnalyticsData => {
    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const { data: products = [], isLoading: productsLoading } = useProducts(true);

    const analytics = useMemo(() => {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Filter completed orders within date range
        const completedOrders = orders.filter(
            (order) => order.status === 'completed' && new Date(order.created_at) >= startDate
        );

        // Daily revenue
        const dailyMap = new Map<string, { revenue: number; orders: number }>();

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dailyMap.set(dateStr, { revenue: 0, orders: 0 });
        }

        completedOrders.forEach((order) => {
            const dateStr = new Date(order.created_at).toISOString().split('T')[0];
            if (dailyMap.has(dateStr)) {
                const current = dailyMap.get(dateStr)!;
                dailyMap.set(dateStr, {
                    revenue: current.revenue + order.total_amount,
                    orders: current.orders + 1,
                });
            }
        });

        const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders,
        }));

        // Category revenue
        const categoryMap = new Map<string, number>();
        completedOrders.forEach((order) => {
            order.order_items?.forEach((item) => {
                const product = products.find((p) => p.id === item.product_id);
                if (product) {
                    const current = categoryMap.get(product.category) || 0;
                    categoryMap.set(product.category, current + item.total_price);
                }
            });
        });

        const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
        const categoryRevenue: CategoryRevenue[] = Array.from(categoryMap.entries())
            .map(([category, revenue]) => ({
                category,
                revenue,
                percentage: totalCategoryRevenue > 0 ? (revenue / totalCategoryRevenue) * 100 : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // Top products
        const productSalesMap = new Map<string, { sold: number; revenue: number }>();
        completedOrders.forEach((order) => {
            order.order_items?.forEach((item) => {
                if (!item.product_id) return;
                const current = productSalesMap.get(item.product_id) || { sold: 0, revenue: 0 };
                productSalesMap.set(item.product_id, {
                    sold: current.sold + item.quantity,
                    revenue: current.revenue + item.total_price,
                });
            });
        });

        const topProducts: TopProduct[] = Array.from(productSalesMap.entries())
            .map(([productId, data]) => {
                const product = products.find((p) => p.id === productId);
                return {
                    id: productId,
                    name: product?.name || 'Unknown',
                    image_url: product?.image_url || '',
                    totalSold: data.sold,
                    revenue: data.revenue,
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Summary stats
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

        return {
            dailyRevenue,
            categoryRevenue,
            topProducts,
            totalRevenue,
            totalOrders,
            averageOrderValue,
            completionRate,
        };
    }, [orders, products, days]);

    return {
        ...analytics,
        isLoading: ordersLoading || productsLoading,
    };
};

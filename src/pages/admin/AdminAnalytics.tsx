import { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Percent, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatPrice } from '@/lib/store';

const COLORS = ['#00b8d4', '#a855f7', '#f97316', '#22c55e', '#ef4444', '#3b82f6'];

const AdminAnalytics = () => {
    const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);
    const {
        dailyRevenue,
        categoryRevenue,
        topProducts,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        completionRate,
        isLoading,
    } = useAnalytics(timeRange);

    const chartConfig = {
        revenue: { label: 'Revenue', color: '#00b8d4' },
        orders: { label: 'Orders', color: '#a855f7' },
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Revenue',
            value: formatPrice(totalRevenue),
            subtitle: `Last ${timeRange} days`,
            icon: DollarSign,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Total Orders',
            value: totalOrders.toString(),
            subtitle: 'All statuses',
            icon: ShoppingCart,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Avg Order Value',
            value: formatPrice(averageOrderValue),
            subtitle: 'Per completed order',
            icon: TrendingUp,
            color: 'text-accent',
            bgColor: 'bg-accent/10',
        },
        {
            title: 'Completion Rate',
            value: `${completionRate.toFixed(1)}%`,
            subtitle: 'Orders completed',
            icon: Percent,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground">Track your store performance</p>
                </div>
                <div className="flex gap-2">
                    {[7, 14, 30].map((days) => (
                        <Button
                            key={days}
                            variant={timeRange === days ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTimeRange(days as 7 | 14 | 30)}
                        >
                            {days}D
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <Card key={index} className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        className="text-xs"
                                    />
                                    <YAxis tickFormatter={(value) => `$${value}`} className="text-xs" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#00b8d4"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-8">
                            <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryRevenue}
                                            dataKey="revenue"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                        >
                                            {categoryRevenue.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="flex-1 space-y-2">
                                {categoryRevenue.slice(0, 5).map((cat, index) => (
                                    <div key={cat.category} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm text-muted-foreground flex-1">{cat.category}</span>
                                        <span className="text-sm font-medium">{cat.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="revenue" fill="#00b8d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAnalytics;

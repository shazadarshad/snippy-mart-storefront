import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Loader2,
  Users,
  Eye,
  Radio,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ExternalLink,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useCurrency } from '@/hooks/useCurrency';
import {
  useLiveSessions,
  useRecentSessions,
  useRecentPageViews,
  useVisitorStats,
  formatRelativeTime,
  shortSessionId,
  referrerHost,
  type SiteSession,
} from '@/hooks/useSiteVisitors';
import { cn } from '@/lib/utils';

const COLORS = ['#00b8d4', '#a855f7', '#f97316', '#22c55e', '#ef4444', '#3b82f6'];

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device || '').toLowerCase();
  if (d === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (d === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function SessionRow({ s, live }: { s: SiteSession; live?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl border text-sm',
        live ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card',
      )}
    >
      <div className="flex items-center gap-2 min-w-[7rem] shrink-0">
        {live && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
        <span className="font-mono text-[11px] font-bold text-muted-foreground">
          {shortSessionId(s.session_key)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate" title={s.page_path || '/'}>
          {s.page_path || '/'}
        </p>
        {s.page_title && (
          <p className="text-[11px] text-muted-foreground truncate">{s.page_title}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <DeviceIcon device={s.device_type} />
          {s.device_type || '—'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" />
          {referrerHost(s.referrer)}
        </span>
        <span className="tabular-nums">{s.page_views} views</span>
        <span className="tabular-nums font-medium text-foreground">
          {formatRelativeTime(s.last_seen_at)}
        </span>
      </div>
    </div>
  );
}

const SalesTab = () => {
  const { formatPrice, currencyInfo } = useCurrency();
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
      <div className="flex items-center justify-center h-64">
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
      <div className="flex justify-end gap-2 mb-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `${currencyInfo.symbol}${value}`}
                    className="text-xs"
                  />
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-8">
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
              <div className="flex-1 space-y-2 w-full">
                {categoryRevenue.slice(0, 5).map((cat, index) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {cat.category}
                    </span>
                    <span className="text-sm font-medium">{cat.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `${currencyInfo.symbol}${value}`}
                />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
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

const LiveVisitorsTab = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useVisitorStats();
  const {
    data: live = [],
    isLoading: liveLoading,
    refetch: refetchLive,
  } = useLiveSessions();
  const { data: recent = [], isLoading: recentLoading, refetch: refetchRecent } =
    useRecentSessions(40);
  const { data: pageViews = [], isLoading: viewsLoading, refetch: refetchViews } =
    useRecentPageViews(60);

  const refreshAll = () => {
    void refetchStats();
    void refetchLive();
    void refetchRecent();
    void refetchViews();
  };

  const missingTables =
    statsError ||
    (stats as any)?.error ||
    String((statsError as any)?.message || '').includes('site_sessions');

  if (missingTables && !statsLoading) {
    const msg =
      (statsError as Error)?.message ||
      (stats as any)?.error?.message ||
      'Tables not found';
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-6 space-y-3">
          <p className="font-bold text-foreground">Visitor tracking not set up in the database yet</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Run the migration <code className="text-xs font-mono">20260719_site_visitor_analytics.sql</code>{' '}
            in Supabase (SQL Editor or <code className="text-xs font-mono">supabase db push</code>), then
            refresh this page. After that, open the storefront in another tab — live visitors will appear
            here.
          </p>
          <p className="text-xs text-muted-foreground font-mono break-all">{msg}</p>
          <Button size="sm" variant="outline" onClick={refreshAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      title: 'Live now',
      value: stats?.live ?? live.length,
      subtitle: 'Active in last 2 min',
      icon: Radio,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Visitors today',
      value: stats?.visitorsToday ?? 0,
      subtitle: 'Unique sessions',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Page views today',
      value: stats?.viewsToday ?? 0,
      subtitle: 'All pages',
      icon: Eye,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'This week',
      value: stats?.visitorsWeek ?? 0,
      subtitle: `${stats?.viewsWeek ?? 0} page views`,
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Live presence updates every ~10s. Anyone browsing snippymart.com (not admin) is counted.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={refreshAll}
          disabled={statsFetching}
          className="shrink-0"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', statsFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="bg-card border-border">
            <CardContent className="p-4 sm:p-5">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', c.bg)}>
                <c.icon className={cn('w-5 h-5', c.color)} />
              </div>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {statsLoading ? '…' : c.value}
              </p>
              <p className="text-sm font-semibold text-foreground">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Live on site</CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold"
              >
                {live.length} online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
            {liveLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : live.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No one live right now. Open the store in another browser/tab to test.
              </div>
            ) : (
              live.map((s) => <SessionRow key={s.id} s={s} live />)
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Top pages (7d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.topPages || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>
            ) : (
              (stats?.topPages || []).map((p, i) => (
                <div
                  key={p.path}
                  className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-[10px] font-black text-muted-foreground w-5">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-mono text-xs truncate" title={p.path}>
                    {p.path}
                  </span>
                  <span className="font-bold tabular-nums text-xs">{p.views}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent visitors</CardTitle>
            <p className="text-xs text-muted-foreground">Last active sessions</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {recentLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No visitors yet</p>
            ) : (
              recent.map((s) => <SessionRow key={s.id} s={s} />)
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Live activity feed</CardTitle>
            <p className="text-xs text-muted-foreground">Latest page views</p>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {viewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pageViews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No page views yet</p>
            ) : (
              pageViews.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-semibold truncate">{v.path}</p>
                    <p className="text-muted-foreground">
                      {shortSessionId(v.session_key)} · {referrerHost(v.referrer)} ·{' '}
                      {formatRelativeTime(v.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-subtitle">Sales performance and live website visitors</p>
        </div>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto p-1 rounded-xl">
          <TabsTrigger value="live" className="gap-2 py-2.5 rounded-lg touch-manipulation">
            <Radio className="w-4 h-4" />
            Live visitors
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2 py-2.5 rounded-lg touch-manipulation">
            <TrendingUp className="w-4 h-4" />
            Sales
          </TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-0">
          <LiveVisitorsTab />
        </TabsContent>
        <TabsContent value="sales" className="mt-0">
          <SalesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;

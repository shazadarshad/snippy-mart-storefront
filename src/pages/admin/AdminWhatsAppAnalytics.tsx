// WhatsApp Analytics Dashboard - Admin Panel
// /admin/whatsapp/analytics

import { useState } from 'react';
import { Calendar, Download, Filter, TrendingUp, Users, Eye, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppLogs, useWhatsAppStats, useWhatsAppTopProducts } from '@/hooks/useWhatsAppLogs';
import { useProducts } from '@/hooks/useProducts';
import { maskPhoneNumber } from '@/utils/whatsapp';
import { formatDistanceToNow } from 'date-fns';
import type { WhatsAppEventType } from '@/types/whatsapp';

const EVENT_COLORS: Record<WhatsAppEventType, string> = {
    PRODUCT_VIEW: 'bg-blue-500',
    ORDER_CLICK: 'bg-green-500',
    ESCALATION: 'bg-orange-500',
    FALLBACK: 'bg-gray-500',
    MENU_REQUEST: 'bg-purple-500',
};

const AdminWhatsAppAnalytics = () => {
    const [phoneFilter, setPhoneFilter] = useState('');
    const [productFilter, setProductFilter] = useState<string>('');
    const [eventFilter, setEventFilter] = useState<WhatsAppEventType | ''>('');
    const [page, setPage] = useState(1);

    const { data: products = [] } = useProducts(true);
    const { data: logsData } = useWhatsAppLogs({
        phone: phoneFilter,
        productId: productFilter,
        event: eventFilter || undefined,
        page,
        limit: 20,
    });
    const { data: stats } = useWhatsAppStats();
    const { data: topProducts = [] } = useWhatsAppTopProducts(5);

    const logs = logsData?.logs || [];
    const total = logsData?.total || 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="min-w-0 space-y-4 sm:space-y-6">
            <div className="admin-page-header mb-0">
                <div className="min-w-0">
                    <h1 className="admin-page-title">WhatsApp Analytics</h1>
                    <p className="admin-page-subtitle">
                        Bot interactions, engagement, and product performance
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 admin-stagger">
                <Card className="admin-stat border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
                        <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black tabular-nums">{stats?.totalMessages || 0}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card className="admin-stat border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium">Views</CardTitle>
                        <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black tabular-nums">{stats?.productViews || 0}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Product views</p>
                    </CardContent>
                </Card>

                <Card className="admin-stat border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium">Orders</CardTitle>
                        <MousePointer className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black tabular-nums">{stats?.orderClicks || 0}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Clicks to site</p>
                    </CardContent>
                </Card>

                <Card className="admin-stat border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium">Users</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black tabular-nums">{stats?.uniqueUsers || 0}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Unique phones</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <Card className="admin-card">
                <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Most viewed products via WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                    {topProducts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="w-8 justify-center">
                                            {idx + 1}
                                        </Badge>
                                        <span>{product.name}</span>
                                    </div>
                                    <Badge>{product.count} views</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs">Phone Number</Label>
                            <Input
                                placeholder="Search by phone..."
                                value={phoneFilter}
                                onChange={(e) => setPhoneFilter(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs">Product</Label>
                            <Select value={productFilter} onValueChange={setProductFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="All products" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All products</SelectItem>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Event Type</Label>
                            <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as WhatsAppEventType | '')}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="All events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All events</SelectItem>
                                    <SelectItem value="PRODUCT_VIEW">Product View</SelectItem>
                                    <SelectItem value="ORDER_CLICK">Order Click</SelectItem>
                                    <SelectItem value="MENU_REQUEST">Menu Request</SelectItem>
                                    <SelectItem value="ESCALATION">Escalation</SelectItem>
                                    <SelectItem value="FALLBACK">Fallback</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPhoneFilter('');
                                    setProductFilter('');
                                    setEventFilter('');
                                }}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity Logs</CardTitle>
                            <CardDescription>Recent WhatsApp bot interactions</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-sm">
                                                {maskPhoneNumber(log.phone)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {log.message || <span className="text-muted-foreground italic">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                {log.product?.name || (
                                                    <span className="text-muted-foreground italic">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`${EVENT_COLORS[log.event as WhatsAppEventType]} text-white border-none`}
                                                >
                                                    {log.event}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing page {page} of {totalPages} ({total} total)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminWhatsAppAnalytics;

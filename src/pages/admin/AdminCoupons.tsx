import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Tag, Plus, Edit, Trash2, Search, Filter,
    Calendar, CheckCircle2, XCircle, AlertCircle,
    Hash, Percent, DollarSign, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Coupon = {
    id: string;
    code: string;
    description: string | null;
    type: 'fixed' | 'percentage';
    value: number;
    min_order_amount: number;
    max_discount: number | null;
    starts_at: string;
    expires_at: string | null;
    usage_limit: number | null;
    used_count: number;
    is_active: boolean;
    created_at: string;
};

const AdminCoupons = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'percentage' as 'fixed' | 'percentage',
        value: '',
        min_order_amount: '0',
        max_discount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true,
    });

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Coupon[];
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async (vars: any) => {
            const payload = {
                code: vars.code.toUpperCase().trim(),
                description: vars.description || null,
                type: vars.type,
                value: parseFloat(vars.value),
                min_order_amount: parseFloat(vars.min_order_amount || '0'),
                max_discount: vars.max_discount ? parseFloat(vars.max_discount) : null,
                usage_limit: vars.usage_limit ? parseInt(vars.usage_limit) : null,
                expires_at: vars.expires_at || null,
                is_active: vars.is_active,
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert([payload]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast({ title: editingCoupon ? "Coupon updated" : "Coupon created" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Error saving coupon",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast({ title: "Coupon deleted" });
        },
    });

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: 'percentage',
            value: '',
            min_order_amount: '0',
            max_discount: '',
            usage_limit: '',
            expires_at: '',
            is_active: true,
        });
        setEditingCoupon(null);
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            type: coupon.type,
            value: coupon.value.toString(),
            min_order_amount: coupon.min_order_amount.toString(),
            max_discount: coupon.max_discount?.toString() || '',
            usage_limit: coupon.usage_limit?.toString() || '',
            expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
            is_active: coupon.is_active,
        });
        setIsDialogOpen(true);
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-1">Coupon Manager</h1>
                    <p className="text-muted-foreground">Create and manage discount codes for your customers.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] glass-premium border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Coupon Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="WELCOME20"
                                        className="font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Discount Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="value">Discount Value</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {formData.type === 'fixed' ? <DollarSign className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
                                        </span>
                                        <Input
                                            id="value"
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="usage_limit"
                                            type="number"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min_order">Min Order Amount</Label>
                                    <Input
                                        id="min_order"
                                        type="number"
                                        value={formData.min_order_amount}
                                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expires">Expiry Date (Optional)</Label>
                                    <Input
                                        id="expires"
                                        type="datetime-local"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                </div>
                            </div>

                            {formData.type === 'percentage' && (
                                <div className="space-y-2">
                                    <Label htmlFor="max_discount">Max Discount Amount (Optional)</Label>
                                    <Input
                                        id="max_discount"
                                        type="number"
                                        value={formData.max_discount}
                                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                        placeholder="Cap the discount amount"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Internal Notes)</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. For new year campaign"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Active Status</Label>
                                    <p className="text-xs text-muted-foreground">Enable or disable this coupon instantly.</p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                                />
                            </div>

                            <Button
                                onClick={() => upsertMutation.mutate(formData)}
                                disabled={upsertMutation.isPending || !formData.code || !formData.value}
                                className="w-full h-12 text-lg font-bold"
                            >
                                {upsertMutation.isPending ? "Saving..." : (editingCoupon ? "Update Coupon" : "Create Coupon")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search coupons..."
                        className="pl-9 h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{coupons.filter(c => c.is_active).length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Active Codes</p>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Uses</p>
                    </div>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-bold">Coupon Code</TableHead>
                            <TableHead className="font-bold">Discount</TableHead>
                            <TableHead className="font-bold">Requirement</TableHead>
                            <TableHead className="font-bold">Usage</TableHead>
                            <TableHead className="font-bold">Expiry</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading coupons...</p>
                                </TableCell>
                            </TableRow>
                        ) : filteredCoupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-lg font-bold text-foreground">No coupons found</p>
                                    <p className="text-sm text-muted-foreground">Start by creating your first discount code.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCoupons.map((coupon) => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                const isLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

                                return (
                                    <TableRow key={coupon.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono font-bold text-primary">
                                            {coupon.code}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                {coupon.type === 'percentage' ? (
                                                    <>
                                                        <Percent className="w-3.5 h-3.5" />
                                                        <span>{coupon.value}% OFF</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        <span>{coupon.value} OFF</span>
                                                    </>
                                                )}
                                            </div>
                                            {coupon.max_discount && (
                                                <p className="text-[10px] text-muted-foreground">Up to {coupon.max_discount}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                {coupon.min_order_amount > 0 ? `Min: ${coupon.min_order_amount}` : 'No Min'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[11px] font-black uppercase text-foreground">
                                                    {coupon.used_count} / {coupon.usage_limit || '∞'}
                                                </div>
                                                {isLimitReached && <XCircle className="w-3 h-3 text-destructive" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    {coupon.expires_at ? format(new Date(coupon.expires_at), 'MMM dd, yyyy') : 'No Expiry'}
                                                </span>
                                                {coupon.expires_at && (
                                                    <span className="text-[9px] text-muted-foreground opacity-60">
                                                        {format(new Date(coupon.expires_at), 'HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {coupon.is_active && !isExpired && !isLimitReached ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Inactive
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(coupon)}
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure? This action cannot be undone.")) {
                                                            deleteMutation.mutate(coupon.id);
                                                        }
                                                    }}
                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

// Simple loader helper
const Loader2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default AdminCoupons;

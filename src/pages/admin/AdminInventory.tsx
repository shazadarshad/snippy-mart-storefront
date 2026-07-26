import { useState } from 'react';
import {
    Package,
    Plus,
    Search,
    Trash2,
    Edit,
    Users,
    Calendar,
    ShieldCheck,
    AlertCircle,
    Copy,
    ExternalLink,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useInventory, useAddInventoryAccount, useUpdateInventoryAccount, useDeleteInventoryAccount, type InventoryAccount } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';

const AdminInventory = () => {
    const { data: accounts, isLoading } = useInventory();
    const addAccount = useAddInventoryAccount();
    const updateAccount = useUpdateInventoryAccount();
    const deleteAccount = useDeleteInventoryAccount();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<InventoryAccount | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<InventoryAccount | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<InventoryAccount>>({
        email: '',
        password: '',
        service_type: 'netflix',
        region: 'Global',
        max_users: 5,
        duration_months: 1,
        rules_template: `✅ Prime 6 Months ✅\n\nRegion - Sri Lanka\n❌ Don't change your mail id\n❌ Don't add personal information or phone number\n❌ Don't use for shopping\nUse prime video only ✅`,
        status: 'active'
    });

    const filteredAccounts = accounts?.filter(acc =>
        acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.service_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        if (editingAccount) {
            // Send only the fields this form owns. Writing the whole row back would
            // also rewrite current_users, undoing any assignment made while the
            // dialog was open and silently overselling the account.
            const updates: Partial<InventoryAccount> = {
                email: formData.email,
                password: formData.password,
                service_type: formData.service_type,
                region: formData.region,
                max_users: formData.max_users,
                duration_months: formData.duration_months,
                rules_template: formData.rules_template,
                status: formData.status,
            };
            updateAccount.mutate({ id: editingAccount.id, updates }, {
                onSuccess: () => {
                    setIsAddDialogOpen(false);
                    setEditingAccount(null);
                }
            });
        } else {
            addAccount.mutate(formData, {
                onSuccess: () => {
                    setIsAddDialogOpen(false);
                }
            });
        }
    };

    const openEdit = (acc: InventoryAccount) => {
        setEditingAccount(acc);
        setFormData(acc);
        setIsAddDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
            case 'full': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Full</Badge>;
            case 'expired': return <Badge variant="destructive">Expired</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getServiceIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('netflix')) return '🍿';
        if (t.includes('prime')) return '📦';
        if (t.includes('spotify')) return '🎵';
        if (t.includes('youtube')) return '📺';
        if (t.includes('adobe')) return '🎨';
        if (t.includes('canva')) return '🎨';
        if (t.includes('cursor')) return '🖱️';
        return '🔑';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: 'Account detail copied to clipboard' });
    };

    return (
        <div className="min-w-0 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="admin-page-header mb-0">
                <div className="min-w-0">
                    <h1 className="admin-page-title flex items-center gap-2.5">
                        <Package className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
                        Inventory
                    </h1>
                    <p className="admin-page-subtitle">Manage and track digital account stock</p>
                </div>
                <Button onClick={() => {
                    setEditingAccount(null);
                    setFormData({
                        email: '',
                        password: '',
                        service_type: 'netflix',
                        region: 'Global',
                        max_users: 5,
                        duration_months: 1,
                        rules_template: '',
                        status: 'active'
                    });
                    setIsAddDialogOpen(true);
                }} className="gap-2 h-11 rounded-xl touch-manipulation shrink-0">
                    <Plus className="w-4 h-4" />
                    Add Account
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 admin-stagger">
                <div className="admin-stat">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">Total</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">{accounts?.length || 0}</p>
                </div>
                <div className="admin-stat">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">Users</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                        {accounts?.reduce((acc, curr) => acc + curr.current_users, 0) || 0}
                    </p>
                </div>
                <div className="admin-stat">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">Capacity</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                        {Math.round((accounts?.reduce((acc, curr) => acc + curr.current_users, 0) || 0) /
                            (accounts?.reduce((acc, curr) => acc + curr.max_users, 0) || 1) * 100)}%
                    </p>
                </div>
                <div className="admin-stat">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">Expiring</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">0</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search accounts by email or service…"
                    className="pl-10 h-11 sm:h-12 bg-card border-border rounded-xl text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Account List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading…</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 admin-stagger">
                    {filteredAccounts?.map((account) => (
                        <div key={account.id} className="group relative admin-card-interactive p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-2xl">
                                        {getServiceIcon(account.service_type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            {account.email}
                                            <button onClick={() => copyToClipboard(account.email)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                            </button>
                                        </h3>
                                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                                            {account.service_type} • <Globe className="w-3 h-3" /> {account.region}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(account.status)}
                                    <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(account)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(account)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity Bar */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Capacity: {account.current_users}/{account.max_users} users</span>
                                    <span className="font-medium">{Math.round((account.current_users / account.max_users) * 100)}%</span>
                                </div>
                                <Progress value={(account.current_users / account.max_users) * 100} className="h-1.5" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-xl border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Password
                                    </p>
                                    <p className="font-mono font-medium flex items-center gap-2">
                                        ••••••••
                                        <button onClick={() => copyToClipboard(account.password)}>
                                            <Copy className="w-3 h-3 hover:text-primary" />
                                        </button>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" /> Expiry
                                    </p>
                                    <p className="font-medium">
                                        {account.expiry_date ? new Date(account.expiry_date).toLocaleDateString() : 'No Limit'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl sm:max-h-[90vh] overflow-y-auto custom-scrollbar bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                        <DialogDescription>
                            Configure account credentials and delivery rules.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Account Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="e.g. netflix@snippymart.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter account password"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Service Type</Label>
                                    <Select
                                        value={formData.service_type}
                                        onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="netflix">Netflix</SelectItem>
                                            <SelectItem value="prime">Amazon Prime</SelectItem>
                                            <SelectItem value="spotify">Spotify</SelectItem>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="adobe">Adobe CC</SelectItem>
                                            <SelectItem value="canva">Canva Pro</SelectItem>
                                            <SelectItem value="cursor">Cursor AI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Region</Label>
                                    <Input
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        placeholder="Sri Lanka"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max Users</Label>
                                    <Input
                                        type="number"
                                        value={formData.max_users}
                                        onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Months)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration_months}
                                        onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Usage Rules & Instructions</Label>
                                    <Badge variant="secondary" className="text-[10px]">Markdown Supported</Badge>
                                </div>
                                <Textarea
                                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                                    value={formData.rules_template || ''}
                                    onChange={(e) => setFormData({ ...formData, rules_template: e.target.value })}
                                    placeholder="✅ High Standard ✅&#10;❌ No sharing login details&#10;⚠️ Prime only"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active (Available for sales)</SelectItem>
                                        <SelectItem value="full">Full (No more sales)</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={addAccount.isPending || updateAccount.isPending}>
                            {(addAccount.isPending || updateAccount.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingAccount ? 'Update Account' : 'Add to Inventory'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteTarget?.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget && deleteTarget.current_users > 0 ? (
                                <>
                                    <strong>{deleteTarget.current_users} customer
                                    {deleteTarget.current_users === 1 ? ' is' : 's are'} currently assigned
                                    to this account.</strong>{' '}
                                    Deleting it removes the login details permanently, so you will not be
                                    able to support them. Set the status to Expired instead if you just
                                    want to stop new sales.
                                </>
                            ) : (
                                <>
                                    This permanently removes the account and its login details. Set the
                                    status to Expired instead if you just want to stop new sales.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep account</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget) deleteAccount.mutate(deleteTarget.id);
                                setDeleteTarget(null);
                            }}
                            disabled={deleteAccount.isPending}
                        >
                            {deleteAccount.isPending ? 'Deleting…' : 'Delete permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminInventory;

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
            updateAccount.mutate({ id: editingAccount.id, updates: formData }, {
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
        return '🔑';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: 'Account detail copied to clipboard' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        Subscription Inventory
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage and track your digital account stock</p>
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
                }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Account
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Accounts</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{accounts?.length || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Active Users</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {accounts?.reduce((acc, curr) => acc + curr.current_users, 0) || 0}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Capacity Used</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {Math.round((accounts?.reduce((acc, curr) => acc + curr.current_users, 0) || 0) /
                            (accounts?.reduce((acc, curr) => acc + curr.max_users, 0) || 1) * 100)}%
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Expiring Soon</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search accounts by email or service..."
                    className="pl-10 h-11 bg-card border-border/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Account List */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredAccounts?.map((account) => (
                        <div key={account.id} className="group relative rounded-2xl bg-card border border-border hover:border-primary/30 transition-all p-5 shadow-sm hover:shadow-md">
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
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteAccount.mutate(account.id)}>
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
                <DialogContent className="max-w-2xl sm:max-h-[90vh] overflow-y-auto">
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
        </div>
    );
};

export default AdminInventory;

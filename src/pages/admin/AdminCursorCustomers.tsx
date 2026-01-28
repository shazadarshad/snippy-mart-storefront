import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Users, Plus, Search, Filter, Calendar,
    Copy, Download, Trash2, Edit, CheckCircle2,
    Shield, Briefcase, ChevronDown, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
type CursorTeam = {
    id: string;
    name: string;
    color: string;
    created_at: string;
};

type CursorCustomer = {
    id: string;
    email: string;
    team_id: string | null;
    purchase_date: string;
    duration_days: number;
    end_date: string | null;
    notes: string | null;
    created_at: string;
    cursor_teams?: CursorTeam | null; // Join
};

const AdminCursorCustomers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

    // Dialog States
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isTeamParamsOpen, setIsTeamParamsOpen] = useState(false);

    // Edit States
    const [editingTeam, setEditingTeam] = useState<CursorTeam | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<CursorCustomer | null>(null);

    // Filtered Copy State
    const [isCopied, setIsCopied] = useState(false);

    // FETCH DATA
    const { data: teams = [] } = useQuery({
        queryKey: ['cursor-teams'],
        queryFn: async () => {
            const { data, error } = await supabase.from('cursor_teams').select('*').order('name');
            if (error) throw error;
            return data as CursorTeam[];
        }
    });

    const { data: customers = [], isLoading: isCustomersLoading } = useQuery({
        queryKey: ['cursor-customers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_customers')
                .select('*, cursor_teams(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as CursorCustomer[];
        }
    });

    // MUTATIONS
    const addCustomerMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('cursor_customers').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers'] });
            toast({ title: "Customer added successfully" });
            setIsAddUserOpen(false);
        }
    });

    const updateCustomerMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { id, ...updates } = payload;
            const { error } = await supabase
                .from('cursor_customers')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers'] });
            toast({ title: "Customer updated successfully" });
            setEditingCustomer(null);
        }
    });

    const addTeamMutation = useMutation({
        mutationFn: async (payload: { name: string; color: string }) => {
            const { error } = await supabase.from('cursor_teams').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams'] });
            toast({ title: "Team created successfully" });
            setEditingTeam(null);
            setIsTeamParamsOpen(false);
        }
    });

    const bulkImportMutation = useMutation({
        mutationFn: async (payload: { emails: string[]; team_id: string; duration: number; notes?: string }) => {
            const customers = payload.emails.map(email => ({
                email: email.trim(),
                team_id: payload.team_id,
                duration_days: payload.duration,
                notes: payload.notes,
                purchase_date: new Date().toISOString(), // Default to now for bulk
            }));

            const { error } = await supabase.from('cursor_customers').insert(customers);
            if (error) throw error;
            setIsBulkImportOpen(false);
        }
    });

    const deleteCustomerMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_customers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers'] });
            toast({ title: "Customer removed successfully" });
        }
    });

    const deleteTeamMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_teams').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams'] });
            toast({ title: "Team removed successfully" });
        }
    });

    // COMPUTES
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.cursor_teams?.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTeam = selectedTeamFilter === 'all' || c.team_id === selectedTeamFilter;
            return matchesSearch && matchesTeam;
        });
    }, [customers, searchQuery, selectedTeamFilter]);

    const activeSubscriptions = customers.filter(c => {
        if (!c.end_date) return false;
        return new Date(c.end_date) > new Date();
    }).length;

    // HANDLERS
    const handleCopyEmails = () => {
        const emails = filteredCustomers.map(c => c.email).join(', ');
        navigator.clipboard.writeText(emails);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast({ title: "Emails copied to clipboard", description: `${filteredCustomers.length} emails copied.` });
    };

    const handleExportCSV = () => {
        const headers = ['Email', 'Team', 'Purchase Date', 'Duration', 'End Date', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...filteredCustomers.map(c => [
                c.email,
                c.cursor_teams?.name || 'No Team',
                format(parseISO(c.purchase_date), 'yyyy-MM-dd'),
                c.duration_days,
                c.end_date ? format(parseISO(c.end_date), 'yyyy-MM-dd') : '',
                `"${(c.notes || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `cursor_customers_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShareLink = () => {
        // Generate a simple link (In real app, we might want a token, but here strict security isn't requested, just a link)
        const url = `${window.location.origin}/shared/cursor-view/supplier-access`;
        navigator.clipboard.writeText(url);
        toast({ title: "Supplier link copied!", description: "Share this link with your supplier." });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-foreground mb-1">Cursor Management</h1>
                    <p className="text-muted-foreground">Manage subscriptions, teams, and bulk access.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isTeamParamsOpen} onOpenChange={setIsTeamParamsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="font-bold">
                                <Briefcase className="w-4 h-4 mr-2" /> Manage Teams
                            </Button>
                        </DialogTrigger>
                        <TeamManagerDialog
                            teams={teams}
                            onSave={(team) => addTeamMutation.mutate(team)}
                            onDelete={(id) => deleteTeamMutation.mutate(id)}
                        />
                    </Dialog>

                    <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="font-bold">
                                <Upload className="w-4 h-4 mr-2" /> Bulk Import
                            </Button>
                        </DialogTrigger>
                        <BulkImportDialog
                            teams={teams}
                            onImport={(data) => bulkImportMutation.mutate(data)}
                        />
                    </Dialog>

                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold">
                                <Plus className="w-4 h-4 mr-2" /> Add Customer
                            </Button>
                        </DialogTrigger>
                        <CustomerFormDialog
                            teams={teams}
                            mode="create"
                            onSave={(data) => addCustomerMutation.mutate(data)}
                        />
                    </Dialog>

                    <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                        <CustomerFormDialog
                            teams={teams}
                            mode="edit"
                            initialData={editingCustomer}
                            onSave={(data) => updateCustomerMutation.mutate({ id: editingCustomer?.id, ...data })}
                        />
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Total Customers" value={customers.length} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
                <StatsCard title="Active Subscriptions" value={activeSubscriptions} icon={CheckCircle2} color="text-green-500" bg="bg-green-500/10" />
                <StatsCard title="Active Teams" value={teams.length} icon={Briefcase} color="text-purple-500" bg="bg-purple-500/10" />
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-card border border-border">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search emails, teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Filter by Team" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {teams.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                        {t.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {(selectedTeamFilter !== 'all' || searchQuery) && (
                    <Button variant="outline" onClick={handleCopyEmails} className="gap-2">
                        {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        Copy Emails
                    </Button>
                )}

                <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
                <Button variant="default" onClick={handleShareLink} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                    <Briefcase className="w-4 h-4" />
                    Share with Supplier
                </Button>
            </div>

            {/* Filtered Data Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Email</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Purchase Date</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    No customers found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map(customer => {
                                const isValid = customer.end_date && new Date(customer.end_date) > new Date();
                                return (
                                    <TableRow key={customer.id} className="group hover:bg-muted/50">
                                        <TableCell className="font-medium">{customer.email}</TableCell>
                                        <TableCell>
                                            {customer.cursor_teams ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary" style={{ color: customer.cursor_teams.color }}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: customer.cursor_teams.color }} />
                                                    {customer.cursor_teams.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">No Team</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(parseISO(customer.purchase_date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {customer.end_date ? format(parseISO(customer.end_date), 'MMM dd, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {isValid ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                                                    Expired
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingCustomer(customer)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this customer?')) {
                                                        deleteCustomerMutation.mutate(customer.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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

// --- Sub-Components ---

const StatsCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <Card className="border-border">
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <div className="text-2xl font-bold">{value}</div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </CardContent>
    </Card>
);

const TeamManagerDialog = ({ teams, onSave, onDelete }: { teams: CursorTeam[], onSave: (t: any) => void, onDelete: (id: string) => void }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Manage Teams</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-4 max-h-[200px] overflow-y-auto mb-4 custom-scrollbar">
                    {teams.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 group">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                <span className="font-semibold">{t.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Delete this team? All assigned customers will be unassigned.')) {
                                        onDelete(t.id);
                                    }
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4">
                    <Label className="mb-2 block">Create New Team</Label>
                    <div className="flex gap-2">
                        <Input placeholder="Team Name" value={name} onChange={e => setName(e.target.value)} />
                        <Input type="color" className="w-12 p-1" value={color} onChange={e => setColor(e.target.value)} />
                        <Button onClick={() => { onSave({ name, color }); setName(''); }}>Add</Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};

const CustomerFormDialog = ({ teams, mode, initialData, onSave }: {
    teams: CursorTeam[],
    mode: 'create' | 'edit',
    initialData?: CursorCustomer | null,
    onSave: (data: any) => void
}) => {
    // Initialize state
    const [data, setData] = useState({
        email: initialData?.email || '',
        team_id: initialData?.team_id || '',
        purchase_date: initialData?.purchase_date ? format(parseISO(initialData.purchase_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        duration_days: initialData?.duration_days || 30,
        notes: initialData?.notes || ''
    });

    // Update state when initialData changes (Fix for form not populating)
    useEffect(() => {
        if (initialData) {
            setData({
                email: initialData.email,
                team_id: initialData.team_id || '',
                purchase_date: format(parseISO(initialData.purchase_date), 'yyyy-MM-dd'),
                duration_days: initialData.duration_days,
                notes: initialData.notes || ''
            });
        } else {
            // Reset if switching to create mode
            setData({
                email: '',
                team_id: '',
                purchase_date: format(new Date(), 'yyyy-MM-dd'),
                duration_days: 30,
                notes: ''
            });
        }
    }, [initialData, mode]);

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{mode === 'create' ? 'Add New Customer' : 'Edit Customer'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                        value={data.email}
                        onChange={e => setData({ ...data, email: e.target.value })}
                        placeholder="customer@example.com"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Team</Label>
                        <Select onValueChange={v => setData({ ...data, team_id: v })} value={data.team_id || ''}>
                            <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                            <SelectContent>
                                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Duration (Days)</Label>
                        <Input
                            type="number"
                            value={data.duration_days}
                            onChange={e => setData({ ...data, duration_days: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Input
                        type="date"
                        value={data.purchase_date}
                        onChange={e => setData({ ...data, purchase_date: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                        value={data.notes}
                        onChange={e => setData({ ...data, notes: e.target.value })}
                    />
                </div>

                {/* Expiry Preview */}
                <div className="p-3 bg-secondary/50 rounded-lg text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">Calculated Expiry:</span>
                    <span className="font-bold font-mono">
                        {data.purchase_date && format(addDays(new Date(data.purchase_date), data.duration_days), 'MMM dd, yyyy')}
                    </span>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => onSave({ ...data, purchase_date: new Date(data.purchase_date).toISOString() })}>
                    {mode === 'create' ? 'Create Customer' : 'Update Customer'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const BulkImportDialog = ({ teams, onImport }: { teams: CursorTeam[], onImport: (data: any) => void }) => {
    const [text, setText] = useState('');
    const [teamId, setTeamId] = useState('');
    const [duration, setDuration] = useState(30);

    const parseEmails = () => {
        // Simple regex to extract emails from messy text
        return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
    };

    const handleImport = () => {
        const emails = parseEmails();
        if (emails.length === 0 || !teamId) return;
        onImport({ emails, team_id: teamId, duration });
    };

    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Bulk Import Customers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Assign to Team</Label>
                        <Select onValueChange={setTeamId} value={teamId}>
                            <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                            <SelectContent>
                                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Duration (Days)</Label>
                        <Input
                            type="number"
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Paste Emails</Label>
                    <p className="text-xs text-muted-foreground">Paste a list of emails. We'll automatically extract valid email addresses.</p>
                    <Textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={"user1@gmail.com\nuser2@gmail.com\nRandom text with user3@gmail.com inside"}
                        className="h-40 font-mono text-sm"
                    />
                </div>

                {text && (
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                        <span className="font-bold text-primary">{parseEmails().length}</span> valid emails found.
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleImport} disabled={!teamId || parseEmails().length === 0}>
                    Import {parseEmails().length > 0 && `(${parseEmails().length})`} Users
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default AdminCursorCustomers;

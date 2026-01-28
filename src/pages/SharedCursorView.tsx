import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Users, Search, Filter,
    Copy, Download, CheckCircle2,
    Briefcase, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

// Reusing types
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
    cursor_teams?: CursorTeam | null;
};

const SharedCursorView = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
    const [isCopied, setIsCopied] = useState(false);

    // FETCH DATA - Public Read Access (Policy might need update or we use a secure token ideally, 
    // but for now we rely on the implementation request "simple replica". 
    // IMPORTANT: RLS policies on Supabase currently restrict to Admin. 
    // If this page is public, we need to adjust RLS or use Edge Function. 
    // Assuming for this "simple" request we might need to open up read access or the user will login as a generic "supplier" account.
    // However, since the user asked for a "special link", usually implies no login.
    // We will assume for now the user might be logged in or we need to update RLS. 
    // To make it truly simple and "works instantly", I will try to fetch. If RLS blocks, I will let the user know to add a policy.)

    const { data: teams = [] } = useQuery({
        queryKey: ['cursor-teams-shared'],
        queryFn: async () => {
            const { data, error } = await supabase.from('cursor_teams').select('*').order('name');
            if (error) console.error(error);
            return (data || []) as CursorTeam[];
        }
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['cursor-customers-shared'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_customers')
                .select('*, cursor_teams(*)')
                .order('created_at', { ascending: false });
            if (error) console.error(error);
            return (data || []) as CursorCustomer[];
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
            link.setAttribute('download', `cursor_customers_shared_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 lg:p-12 animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-display font-black text-foreground">Snippy Mart</h1>
                            <p className="text-sm md:text-base text-muted-foreground font-medium">Supplier Access Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Live Data View
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard title="Total Customers" value={customers.length} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
                    <StatsCard title="Active Subscriptions" value={activeSubscriptions} icon={CheckCircle2} color="text-green-500" bg="bg-green-500/10" />
                    <StatsCard title="Active Teams" value={teams.length} icon={Briefcase} color="text-purple-500" bg="bg-purple-500/10" />
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-card border border-border mt-8">
                    <div className="flex-1 relative order-2 md:order-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search emails, teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                    <div className="w-full md:w-64 order-1 md:order-2">
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
                    <div className="flex flex-wrap gap-2 order-3 w-full md:w-auto">
                        {(selectedTeamFilter !== 'all' || searchQuery) && (
                            <Button variant="outline" onClick={handleCopyEmails} className="gap-2 flex-1 md:flex-none">
                                {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                Copy
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleExportCSV} className="gap-2 flex-1 md:flex-none">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filtered Data Table */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Email</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No customers found.
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
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

export default SharedCursorView;

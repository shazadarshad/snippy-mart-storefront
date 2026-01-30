import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Users,
    ShieldAlert,
    Settings,
    Activity,
    UserX,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Lock,
    History,
    Mail,
    MoreVertical,
    Link as LinkIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { format } from 'date-fns';

const CursorSystem = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'teams' | 'customers' | 'invites'>('teams');

    // --- QUERIES ---

    // 1. Teams
    const { data: teams = [], isLoading: loadingTeams } = useQuery({
        queryKey: ['cursor_teams'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_teams')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    // 2. Customers
    const { data: customers = [], isLoading: loadingCustomers } = useQuery({
        queryKey: ['cursor_customers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_customers')
                .select('*, cursor_teams(team_name)')
                .order('last_restore_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    // 3. Invites
    const { data: invites = [], isLoading: loadingInvites } = useQuery({
        queryKey: ['cursor_invites'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_invites')
                .select('*, cursor_teams(team_name), cursor_customers(email)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    // 4. Events (Recent Activity)
    const { data: events = [] } = useQuery({
        queryKey: ['cursor_events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_events')
                .select('*, cursor_customers(email), cursor_teams(team_name)')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data;
        }
    });


    // --- MUTATIONS ---

    const createTeamMutation = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await supabase.from('cursor_teams').insert({ team_name: name, max_users: 2, status: 'active' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_teams'] });
            toast.success('Team created');
        }
    });

    const addInviteMutation = useMutation({
        mutationFn: async ({ teamId, link }: { teamId: string, link: string }) => {
            const { error } = await supabase.from('cursor_invites').insert({ team_id: teamId, invite_link: link, status: 'active' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_invites'] });
            toast.success('Invite added');
        }
    });

    const deleteTeamMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_teams').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_teams'] });
            toast.success('Team deleted');
        }
    });


    // --- UI HELPERS ---

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
            case 'risky': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Risky</Badge>;
            case 'disabled': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Disabled</Badge>;
            case 'removed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Removed</Badge>;
            case 'joined': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Joined</Badge>;
            case 'assigned': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Assigned</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    // --- RENDER ---

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-foreground">Cursor System</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Manage Teams, Access Recovery, and Security Monitoring.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cursor.com', '_blank')}>
                        <LinkIcon className="w-4 h-4 mr-2" /> Cursor Dashboard
                    </Button>
                    <Button onClick={() => {
                        const name = prompt("Enter Team Name:");
                        if (name) createTeamMutation.mutate(name);
                    }}>
                        <Plus className="w-4 h-4 mr-2" /> New Team
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{customers.length}</p>
                                <p className="text-xs uppercase font-bold text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{teams.filter(t => t.status === 'active').length}</p>
                                <p className="text-xs uppercase font-bold text-muted-foreground">Healthy Teams</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{invites.filter(i => i.status === 'active').length}</p>
                                <p className="text-xs uppercase font-bold text-muted-foreground">Active Invites</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{customers.filter(c => c.status === 'removed').length}</p>
                                <p className="text-xs uppercase font-bold text-muted-foreground">Removed Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <div className="flex items-center gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Teams & Slots
                </button>
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'customers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Users & Security
                </button>
                <button
                    onClick={() => setActiveTab('invites')}
                    className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'invites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Invite Repository
                </button>
            </div>

            {/* TAB: TEAMS */}
            {activeTab === 'teams' && (
                <div className="grid grid-cols-1 gap-6">
                    {teams.map(team => (
                        <Card key={team.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: team.status === 'active' ? '#4ade80' : '#ef4444' }}>
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{team.team_name}</h3>
                                        {getStatusBadge(team.status)}
                                        <span className="text-xs font-mono text-muted-foreground px-2 py-1 bg-secondary rounded">
                                            Score: {team.stability_score.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>Capacity: <strong className="text-foreground">{team.current_users} / {team.max_users}</strong></span>
                                        <span>Last assigned: {team.last_assigned_at ? format(new Date(team.last_assigned_at), 'PPP p') : 'Never'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const link = prompt("Add Invite Link for " + team.team_name);
                                        if (link) addInviteMutation.mutate({ teamId: team.id, link });
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Invite
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                        if (confirm('Delete Team?')) deleteTeamMutation.mutate(team.id);
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            {/* Nested Invites Preview */}
                            <div className="bg-secondary/20 px-6 py-3 border-t border-border/50 text-xs flex flex-wrap gap-2">
                                <span className="font-bold text-muted-foreground uppercase mr-2 mt-1">Available Invites:</span>
                                {invites.filter(i => i.team_id === team.id && i.status === 'active').map(i => (
                                    <div key={i.id} className="px-2 py-1 bg-background border border-border rounded flex items-center gap-2">
                                        <span className="truncate max-w-[150px] font-mono">{i.invite_link}</span>
                                    </div>
                                ))}
                                {invites.filter(i => i.team_id === team.id && i.status === 'active').length === 0 && (
                                    <span className="text-destructive font-bold italic mt-1">No active invites!</span>
                                )}
                            </div>
                        </Card>
                    ))}
                    {teams.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No teams found. create one above.</div>
                    )}
                </div>
            )}

            {/* TAB: CUSTOMERS */}
            {activeTab === 'customers' && (
                <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/50 text-muted-foreground uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">User Email</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Current Team</th>
                                    <th className="p-4">Removals</th>
                                    <th className="p-4">Last Restore</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customers.map(c => (
                                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-4 font-medium">{c.email}</td>
                                        <td className="p-4">{getStatusBadge(c.status)}</td>
                                        <td className="p-4 font-mono text-muted-foreground">{c.cursor_teams?.team_name || '-'}</td>
                                        <td className="p-4">
                                            {c.removal_count > 0 ? (
                                                <Badge variant="destructive">{c.removal_count}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {c.last_restore_at ? format(new Date(c.last_restore_at), 'MMM d, HH:mm') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: EVENTS LOG */}
            <div className="mt-12">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Security Logs
                </h3>
                <div className="bg-black/20 rounded-xl border border-border p-4 h-[300px] overflow-y-auto font-mono text-xs space-y-2">
                    {events.map(e => (
                        <div key={e.id} className="flex items-center gap-3 text-muted-foreground border-b border-border/50 last:border-0 pb-2">
                            <span className="opacity-50">{format(new Date(e.created_at), 'HH:mm:ss')}</span>
                            <span className={`font-bold ${e.event_type === 'removed' ? 'text-red-500' : 'text-green-500'}`}>
                                {e.event_type.toUpperCase()}
                            </span>
                            <span className="text-foreground">{e.cursor_customers?.email || 'Unknown User'}</span>
                            {e.cursor_teams?.team_name && (
                                <span className="opacity-70">via {e.cursor_teams.team_name}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default CursorSystem;

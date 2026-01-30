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


    // 5. System Settings
    const { data: systemSettings = [], isLoading: loadingSettings } = useQuery({
        queryKey: ['cursor_system_settings'],
        queryFn: async () => {
            const { data, error } = await supabase.from('cursor_system_settings').select('*').order('key');
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

    const updateTeamMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
            const { error } = await supabase.from('cursor_teams').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_teams'] });
            toast.success('Team updated');
        }
    });

    const resetTeamMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_teams').update({
                stability_score: 100,
                status: 'active',
                last_assigned_at: null // Optional: clear cooldown
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_teams'] });
            toast.success('Team status reset');
        }
    });

    const updateSystemSettingMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string }) => {
            const { error } = await supabase.from('cursor_system_settings').update({ value }).eq('key', key);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor_system_settings'] });
            toast.success('Setting saved');
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


    const uploadExtensionMutation = useMutation({
        mutationFn: async (file: File) => {
            const { error: uploadError } = await supabase.storage
                .from('extension-artifacts')
                .upload('latest.zip', file, { upsert: true });

            if (uploadError) throw uploadError;

            // Also upload updates.xml if present (optional, but good for completeness)
            // For now just zip is enough for manual download.
        },
        onSuccess: () => {
            toast.success('Extension Release Updated!');
        },
        onError: (error) => {
            toast.error('Upload failed: ' + error.message);
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
            <div className="flex items-center gap-4 border-b border-border mb-6 overflow-x-auto">
                {['teams', 'customers', 'invites', 'settings', 'release'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {tab === 'release' ? 'Release Manager' : (tab === 'settings' ? 'System Settings' : tab.charAt(0).toUpperCase() + tab.slice(1))}
                    </button>
                ))}
            </div>

            {/* TAB: TEAMS */}
            {activeTab === 'teams' && (
                <div className="grid grid-cols-1 gap-6">
                    {teams.map(team => (
                        <Card key={team.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: team.status === 'active' ? '#4ade80' : '#ef4444' }}>
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{team.team_name}</h3>
                                        {getStatusBadge(team.status)}
                                        <span className={`text-xs font-mono px-2 py-1 rounded ${team.stability_score < 50 ? 'bg-red-500/20 text-red-500' : 'bg-secondary text-muted-foreground'}`}>
                                            Stability: {team.stability_score.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span>Capacity: <strong className="text-foreground">{team.current_users} / {team.max_users}</strong></span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                const newLimit = prompt("New Max Users for " + team.team_name, team.max_users.toString());
                                                if (newLimit && !isNaN(parseInt(newLimit))) {
                                                    updateTeamMutation.mutate({ id: team.id, updates: { max_users: parseInt(newLimit) } });
                                                }
                                            }}>
                                                <Settings className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <span>Last assigned: {team.last_assigned_at ? format(new Date(team.last_assigned_at), 'PPP p') : 'Never'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {team.status !== 'active' && (
                                        <Button variant="outline" size="sm" className="border-green-500/50 hover:bg-green-500/10 text-green-500" onClick={() => {
                                            if (confirm(`Reset ${team.team_name} to 100% Stability & Active?`)) resetTeamMutation.mutate(team.id);
                                        }}>
                                            <RefreshCw className="w-4 h-4 mr-2" /> Reset & Heal
                                        </Button>
                                    )}
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

            {/* TAB: INVITES (Repo) */}
            {activeTab === 'invites' && (
                <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border overflow-hidden p-6">
                        <h3 className="text-lg font-bold mb-4">All Invites</h3>
                        <div className="grid gap-2">
                            {invites.map(i => (
                                <div key={i.id} className="flex items-center justify-between p-3 border rounded bg-background/50">
                                    <div className="flex items-center gap-3">
                                        <code className="bg-secondary px-2 py-1 rounded">{i.invite_link}</code>
                                        <span className="text-xs text-muted-foreground">for {i.cursor_teams?.team_name}</span>
                                    </div>
                                    <Badge variant="outline">{i.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Velocity Control
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Limit how many users can join a single team within 24 hours. Prevents spam detection.
                            </p>
                            {systemSettings.filter(s => s.key === 'team_max_velocity_24h').map(setting => (
                                <div key={setting.key} className="flex items-center gap-4">
                                    <Input
                                        defaultValue={setting.value}
                                        className="font-mono text-lg"
                                        id="velocity-input"
                                    />
                                    <Button onClick={() => {
                                        const val = (document.getElementById('velocity-input') as HTMLInputElement).value;
                                        updateSystemSettingMutation.mutate({ key: setting.key, value: val });
                                    }}>Save</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-500" />
                                Cooldown Period
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Seconds to wait before assigning another user to the SAME team.
                            </p>
                            {systemSettings.filter(s => s.key === 'team_cooldown_seconds').map(setting => (
                                <div key={setting.key} className="flex items-center gap-4">
                                    <Input
                                        defaultValue={setting.value}
                                        className="font-mono text-lg"
                                        id="cooldown-input"
                                    />
                                    <Button onClick={() => {
                                        const val = (document.getElementById('cooldown-input') as HTMLInputElement).value;
                                        updateSystemSettingMutation.mutate({ key: setting.key, value: val });
                                    }}>Save</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <Lock className="w-5 h-5" />
                                Emergency Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {systemSettings.filter(s => s.key === 'system_enabled').map(setting => (
                                <div key={setting.key} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-bold">System Master Switch</p>
                                        <p className="text-sm text-muted-foreground">Enable or Disable ALL automated invites.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black uppercase ${setting.value === 'true' ? 'text-green-500' : 'text-red-500'}`}>
                                            {setting.value === 'true' ? 'ENABLED' : 'DISABLED'}
                                        </span>
                                        <Button variant={setting.value === 'true' ? "destructive" : "default"} onClick={() => {
                                            const newVal = setting.value === 'true' ? 'false' : 'true';
                                            updateSystemSettingMutation.mutate({ key: setting.key, value: newVal });
                                        }}>
                                            {setting.value === 'true' ? 'DISABLE SYSTEM' : 'ENABLE SYSTEM'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB: RELEASE */}
            {activeTab === 'release' && (
                <div className="space-y-6">
                    <Card className="border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Release Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-primary/20 rounded-xl p-12 text-center hover:bg-primary/10 transition-colors">
                                <h3 className="text-lg font-bold mb-2">Upload Obfuscated Extension</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Drag and drop your <code>dist/cursor-smart-recovery-secure.zip</code> here to publish.
                                    <br />
                                    This will instantly update the public download link.
                                </p>
                                <Input
                                    type="file"
                                    accept=".zip"
                                    className="max-w-sm mx-auto file:text-primary file:font-bold"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            uploadExtensionMutation.mutate(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
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

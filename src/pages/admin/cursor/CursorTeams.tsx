import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Shield, RefreshCw, Trash2, PowerOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CursorTeam {
    id: string;
    team_name: string;
    max_users: number;
    current_users: number;
    stability_score: number;
    status: 'active' | 'risky' | 'disabled' | 'draining';
}

const CursorTeams = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTeam, setNewTeam] = useState({ team_name: '', max_users: 2 });

    const { data: teams = [], isLoading } = useQuery({
        queryKey: ['cursor-teams-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_teams')
                .select('*')
                .order('stability_score', { ascending: false });
            if (error) throw error;
            return data as unknown as CursorTeam[];
        }
    });

    // Mutations
    const createTeamMutation = useMutation({
        mutationFn: async (data: typeof newTeam) => {
            const { error } = await supabase.from('cursor_teams').insert(data as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams-list'] });
            setIsCreateOpen(false);
            setNewTeam({ team_name: '', max_users: 2 });
            toast({ title: "Team created" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('cursor_teams').update({ status } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams-list'] });
            toast({ title: "Team status updated" });
        }
    });

    const resetStabilityMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_teams').update({ stability_score: 100.0, status: 'active' } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams-list'] });
            toast({ title: "Stability score reset" });
        }
    });

    // Explicit Recalculate Trigger (Admin Override)
    const recalculateMutation = useMutation({
        mutationFn: async (id: string) => {
            // Cast to any because the generic type doesn't know about this custom RPC
            const { error } = await (supabase.rpc as any)('recalculate_team_users', { target_team_id: id });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-teams-list'] });
            toast({ title: "User count recalculated" });
        }
    });

    if (isLoading) return <div>Loading teams...</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'risky': return 'destructive'; // orange usually, but we use destructive for risky/disabled
            case 'disabled': return 'secondary';
            case 'draining': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New Team</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Team Name</Label>
                                <Input value={newTeam.team_name} onChange={e => setNewTeam({ ...newTeam, team_name: e.target.value })} placeholder="Shared Team 01" />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Users</Label>
                                <Input type="number" value={newTeam.max_users} onChange={e => setNewTeam({ ...newTeam, max_users: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => createTeamMutation.mutate(newTeam)}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Stability</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teams.map(team => (
                            <TableRow key={team.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                    {team.team_name}
                                </TableCell>
                                <TableCell>
                                    {team.current_users} / {team.max_users}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${team.stability_score < 50 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${team.stability_score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{team.stability_score.toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(team.status) as any} className="uppercase text-[10px]">
                                        {team.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: team.id, status: team.status === 'draining' ? 'active' : 'draining' })}>
                                                <PowerOff className="mr-2 h-4 w-4" /> {team.status === 'draining' ? 'Stop Draining' : 'Drain Mode'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => resetStabilityMutation.mutate(team.id)}>
                                                <RefreshCw className="mr-2 h-4 w-4" /> Reset Stability
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => recalculateMutation.mutate(team.id)}>
                                                <RefreshCw className="mr-2 h-4 w-4" /> Recalculate Users
                                            </DropdownMenuItem>
                                            {team.status !== 'disabled' && (
                                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: team.id, status: 'disabled' })} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Disable Team
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CursorTeams;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Link as LinkIcon } from 'lucide-react';

const CursorInvites = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [importText, setImportText] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');

    // Fetch Data
    const { data: teams = [] } = useQuery({
        queryKey: ['cursor-teams-simple'],
        queryFn: async () => {
            const { data } = await supabase.from('cursor_teams').select('id, team_name');
            return (data || []) as unknown as { id: string; team_name: string }[];
        }
    });

    const { data: invites = [] } = useQuery({
        queryKey: ['cursor-invites-list'],
        queryFn: async () => {
            const { data } = await supabase
                .from('cursor_invites')
                .select('*, cursor_teams(team_name)')
                .order('created_at', { ascending: false })
                .limit(50);
            return (data || []) as unknown as {
                id: string;
                invite_link: string;
                status: string;
                created_at: string;
                cursor_teams: { team_name: string }
            }[];
        }
    });

    // Bulk Import Logic
    const importMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTeam) throw new Error("Select a team");

            // Extract links (naive regex or just line split)
            const links = importText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
            if (links.length === 0) throw new Error("No links found");

            const rows = links.map(link => ({
                team_id: selectedTeam,
                invite_link: link,
                status: 'active'
            }));

            const { error } = await supabase.from('cursor_invites').insert(rows as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-invites-list'] });
            setImportText('');
            setSelectedTeam('');
            toast({ title: "Invites Imported Successfully" });
        },
        onError: (err) => {
            toast({ title: "Import Failed", description: err.message, variant: "destructive" });
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Import Panel */}
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Bulk Import
                        </h3>
                        <Select onValueChange={setSelectedTeam} value={selectedTeam}>
                            <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Paste invite links (one per line)..."
                            className="h-40 font-mono text-xs"
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                        />
                        <Button
                            className="w-full"
                            disabled={!selectedTeam || !importText}
                            onClick={() => importMutation.mutate()}
                        >
                            Import Invites
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* List Panel */}
            <div className="lg:col-span-2 rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Link</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.map(inv => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-mono text-xs truncate max-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="w-3 h-3 text-muted-foreground" />
                                        {inv.invite_link}
                                    </div>
                                </TableCell>
                                <TableCell>{inv.cursor_teams?.team_name}</TableCell>
                                <TableCell>
                                    <Badge variant={inv.status === 'active' ? 'outline' : 'secondary'}>
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                    {new Date(inv.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CursorInvites;

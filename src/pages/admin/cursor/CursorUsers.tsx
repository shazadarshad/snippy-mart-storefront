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
import { MoreHorizontal, Search, RotateCcw, Ban, UserX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

// Define Interface for type safety
interface CursorUser {
    id: string;
    email: string;
    status: 'active' | 'removed';
    removal_count: number;
    last_restore_at: string | null;
    auto_restore_enabled: boolean;
    current_team_id: string | null;
    cursor_teams?: {
        name: string;
    } | null;
}

const CursorUsers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['cursor-customers-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cursor_customers')
                .select('*, cursor_teams(name:team_name)')
                .order('last_restore_at', { ascending: false });

            if (error) throw error;
            return data as unknown as CursorUser[]; // Force cast to avoid type inference issues
        }
    });

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('cursor_customers').update({ status } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers-list'] });
            toast({ title: "User status updated" });
        }
    });

    const resetRemovalCountMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cursor_customers').update({ removal_count: 0 } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers-list'] });
            toast({ title: "Removal count reset" });
        }
    });

    const toggleAutoRestoreMutation = useMutation({
        mutationFn: async ({ id, enabled }: { id: string, enabled: boolean }) => {
            const { error } = await supabase.from('cursor_customers').update({ auto_restore_enabled: enabled } as any).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-customers-list'] });
            toast({ title: "Auto-restore updated" });
        }
    });

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div>Loading users...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search emails..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Team</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Removals</TableHead>
                            <TableHead>Last Restore</TableHead>
                            <TableHead>Auto-Restore</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    {user.cursor_teams?.name ? (
                                        <Badge variant="outline">{user.cursor_teams.name}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.removal_count}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {user.last_restore_at ? format(new Date(user.last_restore_at), 'MMM dd HH:mm') : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.auto_restore_enabled ? 'secondary' : 'outline'} className={user.auto_restore_enabled ? 'text-green-600' : 'text-gray-400'}>
                                        {user.auto_restore_enabled ? 'On' : 'Off'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: user.id, status: user.status === 'active' ? 'removed' : 'active' })}>
                                                <UserX className="mr-2 h-4 w-4" /> Toggle Status
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleAutoRestoreMutation.mutate({ id: user.id, enabled: !user.auto_restore_enabled })}>
                                                <Ban className="mr-2 h-4 w-4" /> Toggle Auto-Restore
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => resetRemovalCountMutation.mutate(user.id)}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Reset Count
                                            </DropdownMenuItem>
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

export default CursorUsers;

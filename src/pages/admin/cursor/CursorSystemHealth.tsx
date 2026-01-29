import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, HeartPulse, Power, Zap, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CursorSystemHealth = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch System Settings (Kill Switch)
    const { data: systemSettings } = useQuery({
        queryKey: ['cursor-system-settings'],
        queryFn: async () => {
            const { data } = await supabase.from('cursor_system_settings').select('*').eq('key', 'cursor_system_enabled').single();
            return data;
        }
    });

    const isSystemEnabled = systemSettings?.value === 'true';

    // Toggle Kill Switch
    const toggleSystemMutation = useMutation({
        mutationFn: async (enabled: boolean) => {
            const { error } = await supabase
                .from('cursor_system_settings')
                .update({ value: enabled ? 'true' : 'false' } as any)
                .eq('key', 'cursor_system_enabled');
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cursor-system-settings'] });
            toast({
                title: isSystemEnabled ? "System Safeguard Activated" : "System Resumed",
                description: isSystemEnabled ? "Maintenance mode enabled. APIs disabled." : "System is now fully operational.",
                variant: isSystemEnabled ? "destructive" : "default"
            });
        }
    });

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['cursor-health-stats'],
        queryFn: async () => {
            const [teams, customers, invites] = await Promise.all([
                supabase.from('cursor_teams').select('status, current_users, max_users, stability_score'),
                supabase.from('cursor_customers').select('status, removal_count'),
                supabase.from('cursor_invites').select('status')
            ]);

            const activeTeams = teams.data?.filter(t => t.status === 'active').length || 0;
            const riskyTeams = teams.data?.filter(t => t.status === 'risky').length || 0;
            const disabledTeams = teams.data?.filter(t => t.status === 'disabled').length || 0;

            const totalSlots = teams.data?.reduce((acc, t) => acc + t.max_users, 0) || 0;
            const usedSlots = teams.data?.reduce((acc, t) => acc + t.current_users, 0) || 0;

            const activeInvites = invites.data?.filter(i => i.status === 'active').length || 0;
            const totalRemovals = customers.data?.reduce((acc, c) => acc + c.removal_count, 0) || 0;

            const avgHealth = teams.data?.length
                ? (teams.data.reduce((acc, t) => acc + t.stability_score, 0) / teams.data.length).toFixed(1)
                : '100.0';

            return {
                activeTeams, riskyTeams, disabledTeams,
                openSlots: Math.max(0, totalSlots - usedSlots),
                totalSlots, activeInvites, totalRemovals, avgHealth
            };
        }
    });

    return (
        <div className="space-y-6">
            {/* Kill Switch Banner */}
            {!isSystemEnabled && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>System Maintenance Mode Active</AlertTitle>
                    <AlertDescription>
                        All API endpoints are currently disabled. Extensions will show "Maintenance" state.
                    </AlertDescription>
                </Alert>
            )}

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Activity className={`h-4 w-4 ${isSystemEnabled ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isSystemEnabled ? 'Operational' : 'Maintenance'}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isSystemEnabled ? 'APIs Accepting Requests' : 'APIs Blocked'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.openSlots || 0} <span className="text-sm text-muted-foreground font-normal">/ {stats?.totalSlots || 0}</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.activeInvites || 0} Invites Ready
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Health</CardTitle>
                        <HeartPulse className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avgHealth}%</div>
                        <p className="text-xs text-muted-foreground mt-1 flex gap-2">
                            <span className="text-red-500">{stats?.riskyTeams} Risky</span>
                            <span className="text-zinc-500">{stats?.disabledTeams} Disabled</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Removals</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalRemovals || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Lifetime detected events
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <Power className="w-5 h-5" /> Emergency Controls
                    </CardTitle>
                    <CardDescription>
                        Dangerous actions. Use with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div>
                            <h4 className="font-bold">Global System Kill Switch</h4>
                            <p className="text-sm text-muted-foreground">Instantly reject all restore requests and disable extension automations.</p>
                        </div>
                        <Button
                            variant={isSystemEnabled ? "destructive" : "default"}
                            onClick={() => toggleSystemMutation.mutate(isSystemEnabled)}
                        >
                            {isSystemEnabled ? "DISABLE SYSTEM" : "ENABLE SYSTEM"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CursorSystemHealth;

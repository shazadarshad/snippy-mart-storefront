import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Users, Shield, Link as LinkIcon, Activity } from 'lucide-react';
import CursorSystemHealth from './CursorSystemHealth';
import CursorUsers from './CursorUsers';
import CursorTeams from './CursorTeams';
import CursorInvites from './CursorInvites';

const AdminCursorSystem = () => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-foreground flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Cursor System
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Unified Smart Recovery & Team Management Control Center.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card border border-border p-1 h-auto flex-wrap justify-start gap-2 w-full md:w-auto">
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Activity className="w-4 h-4" /> System Health
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Users className="w-4 h-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Shield className="w-4 h-4" /> Teams
                    </TabsTrigger>
                    <TabsTrigger value="invites" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <LinkIcon className="w-4 h-4" /> Invites
                    </TabsTrigger>
                </TabsList>

                {/* Content Areas */}
                <TabsContent value="overview" className="space-y-6 focus-visible:ring-0">
                    <CursorSystemHealth />
                </TabsContent>

                <TabsContent value="users" className="space-y-6 focus-visible:ring-0">
                    <CursorUsers />
                </TabsContent>

                <TabsContent value="teams" className="space-y-6 focus-visible:ring-0">
                    <CursorTeams />
                </TabsContent>

                <TabsContent value="invites" className="space-y-6 focus-visible:ring-0">
                    <CursorInvites />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminCursorSystem;

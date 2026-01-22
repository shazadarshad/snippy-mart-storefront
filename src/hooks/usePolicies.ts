import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Policy {
    id: string;
    policy_key: string;
    title: string;
    highlighted_word: string;
    description: string;
    content: string;
    last_updated: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Note: The 'policies' table needs to be created in Supabase first
// Run the migration: supabase/migrations/20260122_policies.sql

export const usePolicies = () => {
    return useQuery({
        queryKey: ['policies'],
        queryFn: async () => {
            // Using any to bypass type checking since table may not exist yet
            const { data, error } = await (supabase as any)
                .from('policies')
                .select('*')
                .order('policy_key');

            if (error) throw error;
            return data as Policy[];
        },
    });
};

export const usePolicy = (policyKey: string) => {
    return useQuery({
        queryKey: ['policy', policyKey],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('policies')
                .select('*')
                .eq('policy_key', policyKey)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data as Policy;
        },
        enabled: !!policyKey,
    });
};

export const useUpdatePolicy = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Policy> }) => {
            const { data, error } = await (supabase as any)
                .from('policies')
                .update({
                    ...updates,
                    last_updated: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            queryClient.invalidateQueries({ queryKey: ['policy'] });
            toast({
                title: 'Policy Updated',
                description: 'The policy has been saved successfully.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

export const useCreatePolicy = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (policy: Omit<Policy, 'id' | 'created_at' | 'updated_at' | 'last_updated'>) => {
            const { data, error } = await (supabase as any)
                .from('policies')
                .insert(policy)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            toast({
                title: 'Policy Created',
                description: 'New policy has been created successfully.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

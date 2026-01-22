import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventoryAccount {
    id: string;
    email: string;
    password: string;
    service_type: string;
    rules_template: string | null;
    region: string;
    duration_months: number;
    max_users: number;
    current_users: number;
    expiry_date: string | null;
    status: 'active' | 'full' | 'expired' | 'maintenance';
    created_at: string;
    updated_at: string;
}

export const useInventory = () => {
    return useQuery({
        queryKey: ['inventory_accounts'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('inventory_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as InventoryAccount[];
        },
    });
};

export const useAddInventoryAccount = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (account: Partial<InventoryAccount>) => {
            const { data, error } = await (supabase as any)
                .from('inventory_accounts')
                .insert([account])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_accounts'] });
            toast({
                title: 'Account Added',
                description: 'The subscription account has been added to inventory.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

export const useUpdateInventoryAccount = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryAccount> }) => {
            const { data, error } = await (supabase as any)
                .from('inventory_accounts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_accounts'] });
            toast({
                title: 'Account Updated',
                description: 'The account details have been updated.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

export const useDeleteInventoryAccount = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('inventory_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_accounts'] });
            toast({
                title: 'Account Deleted',
                description: 'The account has been removed from inventory.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

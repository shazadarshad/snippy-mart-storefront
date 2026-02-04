// Custom hooks for WhatsApp bot settings

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { WhatsAppSettings, WhatsAppSettingsFormData } from '@/types/whatsapp';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

// Fetch WhatsApp settings
export const useWhatsAppSettings = () => {
    return useQuery({
        queryKey: ['whatsapp-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('whatsapp_settings')
                .select('*')
                .eq('id', SETTINGS_ID)
                .single();

            if (error) throw error;
            return data as WhatsAppSettings;
        },
    });
};

// Update WhatsApp settings
export const useUpdateWhatsAppSettings = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (settings: Partial<WhatsAppSettingsFormData>) => {
            const { data, error } = await supabase
                .from('whatsapp_settings')
                .update(settings)
                .eq('id', SETTINGS_ID)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
            toast({
                title: 'Success',
                description: 'WhatsApp settings updated successfully',
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

// Toggle bot on/off
export const useToggleWhatsAppBot = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (enabled: boolean) => {
            const { data, error } = await supabase
                .from('whatsapp_settings')
                .update({ bot_enabled: enabled })
                .eq('id', SETTINGS_ID)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
            toast({
                title: data.bot_enabled ? 'Bot Enabled' : 'Bot Disabled',
                description: `WhatsApp bot is now ${data.bot_enabled ? 'active' : 'inactive'}`,
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

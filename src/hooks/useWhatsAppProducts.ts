// Custom hooks for WhatsApp automation admin features

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
    WhatsAppProductConfig,
    WhatsAppProductConfigFormData,
    WhatsAppProductWithConfig,
} from '@/types/whatsapp';

// Fetch all products with their WhatsApp configuration
export const useWhatsAppProducts = () => {
    return useQuery({
        queryKey: ['whatsapp-products'],
        queryFn: async () => {
            const { data: products, error } = await supabase
                .from('products')
                .select(`
          *,
          whatsapp_config:whatsapp_product_config(*)
        `)
                .order('name');

            if (error) throw error;
            return products as WhatsAppProductWithConfig[];
        },
    });
};

// Fetch single WhatsApp product configuration
export const useWhatsAppProductConfig = (productId: string) => {
    return useQuery({
        queryKey: ['whatsapp-config', productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('whatsapp_product_config')
                .select('*')
                .eq('product_id', productId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
            return data as WhatsAppProductConfig | null;
        },
        enabled: !!productId,
    });
};

// Upsert WhatsApp product configuration
export const useUpsertWhatsAppConfig = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (config: WhatsAppProductConfigFormData) => {
            const { data, error } = await supabase
                .from('whatsapp_product_config')
                .upsert({
                    product_id: config.product_id,
                    enabled: config.enabled,
                    priority: config.priority,
                    menu_title: config.menu_title,
                    triggers: config.triggers,
                    flow_steps: config.flow_steps,
                    show_order_link: config.show_order_link,
                    escalation_keywords: config.escalation_keywords,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-products'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
            toast({
                title: 'Success',
                description: 'WhatsApp configuration updated successfully',
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

// Toggle WhatsApp enabled status for a product
export const useToggleWhatsAppProduct = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ productId, enabled }: { productId: string; enabled: boolean }) => {
            // Check if config exists
            const { data: existing } = await supabase
                .from('whatsapp_product_config')
                .select('*')
                .eq('product_id', productId)
                .single();

            if (existing) {
                // Update existing
                const { data, error } = await supabase
                    .from('whatsapp_product_config')
                    .update({ enabled })
                    .eq('product_id', productId)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Get product name for menu_title
                const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', productId)
                    .single();

                // Create new config
                const { data, error } = await supabase
                    .from('whatsapp_product_config')
                    .insert({
                        product_id: productId,
                        enabled,
                        menu_title: product?.name || 'Unnamed Product',
                        priority: 99,
                        triggers: [],
                        flow_steps: [],
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-products'] });
            toast({
                title: variables.enabled ? 'Enabled for WhatsApp' : 'Disabled for WhatsApp',
                description: 'Product WhatsApp status updated',
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

// Delete WhatsApp configuration
export const useDeleteWhatsAppConfig = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (productId: string) => {
            const { error } = await supabase
                .from('whatsapp_product_config')
                .delete()
                .eq('product_id', productId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-products'] });
            toast({
                title: 'Deleted',
                description: 'WhatsApp configuration removed',
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

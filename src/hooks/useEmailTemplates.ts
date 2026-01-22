import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
    id: string;
    template_key: string;
    name: string;
    subject: string;
    html_content: string;
    text_content: string | null;
    description: string | null;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailTemplateInput {
    template_key: string;
    name: string;
    subject: string;
    html_content: string;
    text_content?: string;
    description?: string;
    variables?: string[];
    is_active?: boolean;
}

export const useEmailTemplates = () => {
    return useQuery({
        queryKey: ['email-templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as EmailTemplate[];
        },
    });
};

export const useEmailTemplate = (id: string) => {
    return useQuery({
        queryKey: ['email-template', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as EmailTemplate;
        },
        enabled: !!id,
    });
};

export const useUpdateEmailTemplate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...template }: Partial<EmailTemplateInput> & { id: string }) => {
            const { data, error } = await supabase
                .from('email_templates')
                .update({
                    ...template,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast({
                title: 'Template saved',
                description: 'Email template has been updated.',
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

export const useCreateEmailTemplate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (template: EmailTemplateInput) => {
            const { data, error } = await supabase
                .from('email_templates')
                .insert(template)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast({
                title: 'Template created',
                description: 'New email template has been added.',
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

export const useDeleteEmailTemplate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('email_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast({
                title: 'Template deleted',
                description: 'Email template has been removed.',
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

export const useSendPreviewEmail = () => {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ templateId, toEmail }: { templateId: string; toEmail: string }) => {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    templateId,
                    to: toEmail,
                    isPreview: true,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: 'Preview sent!',
                description: 'Check your inbox for the preview email.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to send',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

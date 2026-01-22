import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailSettings {
    id: string;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_secure: boolean;
    from_email: string;
    from_name: string;
    reply_to_email: string | null;
    is_configured: boolean;
    last_test_at: string | null;
    last_test_success: boolean | null;
    created_at: string;
    updated_at: string;
}

export interface EmailSettingsInput {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_secure: boolean;
    from_email: string;
    from_name: string;
    reply_to_email?: string;
}

export const useEmailSettings = () => {
    return useQuery({
        queryKey: ['email-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as EmailSettings | null;
        },
    });
};

export const useUpdateEmailSettings = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (settings: EmailSettingsInput) => {
            // Check if settings exist
            const { data: existing } = await supabase
                .from('email_settings')
                .select('id')
                .single();

            if (existing) {
                // Update existing
                const { data, error } = await supabase
                    .from('email_settings')
                    .update({
                        ...settings,
                        is_configured: true,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('email_settings')
                    .insert({
                        ...settings,
                        is_configured: true,
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-settings'] });
            toast({
                title: 'Settings saved',
                description: 'Email configuration has been updated.',
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

export const useTestEmailConnection = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (settings: EmailSettingsInput) => {
            const { data, error } = await supabase.functions.invoke('test-email', {
                body: settings,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['email-settings'] });
            toast({
                title: data.success ? 'Connection successful!' : 'Connection failed',
                description: data.message,
                variant: data.success ? 'default' : 'destructive',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Test failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};

export const useSendTestEmail = () => {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (toEmail: string) => {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: toEmail,
                    subject: 'Test Email from Snippy Mart',
                    html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h1 style="color: #00b8d4;">✅ Test Email Successful!</h1>
              <p>Your email configuration is working correctly.</p>
              <p>This email was sent from your Snippy Mart admin panel.</p>
            </div>
          `,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: 'Test email sent!',
                description: 'Check your inbox (and spam folder).',
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

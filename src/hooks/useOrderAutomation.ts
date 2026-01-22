import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface AutomatedAssignment {
    email: string;
    password: string;
    rules_template: string | null;
    region: string;
    duration_months: number;
    service_type: string;
    assigned_at: string;
}

export interface VerificationCode {
    id: string;
    code: string;
    received_at: string;
    expires_at: string;
}

export const useOrderAutomation = (orderId: string | undefined) => {
    const [liveCodes, setLiveCodes] = useState<VerificationCode[]>([]);

    // 1. Fetch Assigned Account Details
    const { data: assignment, isLoading: isAssignmentLoading } = useQuery({
        queryKey: ['order_assignment', orderId],
        queryFn: async () => {
            if (!orderId) return null;

            const { data, error } = await (supabase as any)
                .from('account_assignments')
                .select(`
                    assigned_at,
                    inventory_accounts (
                        email,
                        password,
                        rules_template,
                        region,
                        duration_months,
                        service_type
                    )
                `)
                .eq('order_id', orderId)
                .single();

            if (error) return null;

            return {
                ...data.inventory_accounts,
                assigned_at: data.assigned_at
            } as AutomatedAssignment;
        },
        enabled: !!orderId,
    });

    // 2. Fetch Existing Codes
    const { data: initialCodes } = useQuery({
        queryKey: ['verification_codes', assignment?.email],
        queryFn: async () => {
            if (!orderId) return [];

            // Get account_id first (already have assignment)
            const { data: assignmentData } = await (supabase as any)
                .from('account_assignments')
                .select('account_id')
                .eq('order_id', orderId)
                .single();

            if (!assignmentData) return [];

            const { data, error } = await (supabase as any)
                .from('account_verification_codes')
                .select('*')
                .eq('account_id', assignmentData.account_id)
                .order('received_at', { ascending: false })
                .limit(5);

            if (error) return [];
            return data as VerificationCode[];
        },
        enabled: !!assignment,
    });

    // 3. Realtime Subscription for new codes
    useEffect(() => {
        if (!orderId) return;

        const setupRealtime = async () => {
            const { data: assignmentData } = await (supabase as any)
                .from('account_assignments')
                .select('account_id')
                .eq('order_id', orderId)
                .single();

            if (!assignmentData) return;

            const channel = supabase
                .channel(`codes-${orderId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'account_verification_codes',
                        filter: `account_id=eq.${assignmentData.account_id}`
                    },
                    (payload) => {
                        setLiveCodes(prev => [payload.new as VerificationCode, ...prev]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtime();
    }, [orderId]);

    // Merge initial and live codes
    const codes = [...liveCodes, ...(initialCodes || [])].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    return {
        assignment,
        codes,
        isLoading: isAssignmentLoading
    };
};

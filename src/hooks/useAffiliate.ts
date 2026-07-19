import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AffiliateRow = {
  id: string;
  code: string;
  name: string;
  whatsapp: string;
  email: string | null;
  status: 'pending' | 'active' | 'rejected' | 'disabled';
  commission_percent: number;
  notes: string | null;
  payout_details: string | null;
  created_at: string;
  approved_at: string | null;
};

export type AffiliateCommission = {
  id: string;
  affiliate_id: string;
  order_id: string;
  order_number: string | null;
  order_total: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

export type AffiliatePayout = {
  id: string;
  affiliate_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export function useApplyAffiliate() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      whatsapp: string;
      email?: string;
      notes?: string;
      code?: string;
    }) => {
      const { data, error } = await (supabase as any).rpc('apply_affiliate', {
        p_name: payload.name,
        p_whatsapp: payload.whatsapp,
        p_email: payload.email || null,
        p_notes: payload.notes || null,
        p_code: payload.code || null,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Application failed');
      return data as { ok: boolean; code: string; status: string; message: string };
    },
  });
}

export function useAffiliateDashboard(code: string, whatsapp: string, enabled: boolean) {
  return useQuery({
    queryKey: ['affiliate-dashboard', code, whatsapp],
    enabled: enabled && !!code && !!whatsapp,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_affiliate_dashboard', {
        p_code: code,
        p_whatsapp: whatsapp,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Could not load dashboard');
      return data as {
        ok: boolean;
        affiliate: AffiliateRow;
        totals: { pending: number; approved: number; paid: number; available: number };
        commissions: AffiliateCommission[];
        payouts: AffiliatePayout[];
        link: string;
      };
    },
  });
}

export function useRequestAffiliatePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      whatsapp: string;
      amount: number;
      method?: string;
      note?: string;
    }) => {
      const { data, error } = await (supabase as any).rpc('request_affiliate_payout', {
        p_code: payload.code,
        p_whatsapp: payload.whatsapp,
        p_amount: payload.amount,
        p_method: payload.method || null,
        p_note: payload.note || null,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Payout request failed');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
    },
  });
}

/** Admin list */
export function useAdminAffiliates() {
  return useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateRow[];
    },
  });
}

export function useAdminAffiliateCommissions() {
  return useQuery({
    queryKey: ['admin-affiliate-commissions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('affiliate_commissions')
        .select('*, affiliates(code, name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminAffiliatePayouts() {
  return useQuery({
    queryKey: ['admin-affiliate-payouts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('affiliate_payouts')
        .select('*, affiliates(code, name, whatsapp)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

/** Full admin detail for one affiliate: orders + items + commissions + payouts */
export function useAdminAffiliateDetail(
  affiliate: { id: string; code: string } | null,
) {
  return useQuery({
    queryKey: ['admin-affiliate-detail', affiliate?.id],
    enabled: !!affiliate?.id,
    queryFn: async () => {
      if (!affiliate) return null;
      const id = affiliate.id;
      const code = affiliate.code;

      const [commsRes, payoutsRes, ordersRes] = await Promise.all([
        (supabase as any)
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', id)
          .order('created_at', { ascending: false })
          .limit(100),
        (supabase as any)
          .from('affiliate_payouts')
          .select('*')
          .eq('affiliate_id', id)
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('orders')
          .select(
            'id, order_number, customer_name, customer_whatsapp, customer_email, total_amount, discount_amount, status, payment_method, affiliate_code, affiliate_id, created_at, updated_at, order_items(id, product_name, plan_name, quantity, unit_price, total_price)',
          )
          .or(`affiliate_id.eq.${id},affiliate_code.ilike.${code}`)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (commsRes.error) throw commsRes.error;
      if (payoutsRes.error) throw payoutsRes.error;
      // Orders query may fail if affiliate columns missing on old DB — soft-fail
      const orders = ordersRes.error ? [] : ordersRes.data || [];
      const commissions = (commsRes.data || []) as AffiliateCommission[];
      const payouts = (payoutsRes.data || []) as AffiliatePayout[];

      const sumBy = (status: string) =>
        commissions
          .filter((c) => c.status === status)
          .reduce((s, c) => s + Number(c.commission_amount || 0), 0);

      const held = commissions
        .filter(
          (c) =>
            c.status === 'pending' &&
            (c as any).hold_until &&
            new Date((c as any).hold_until) > new Date(),
        )
        .reduce((s, c) => s + Number(c.commission_amount || 0), 0);

      const completedOrders = orders.filter(
        (o: any) => o.status === 'completed' || o.status === 'delivered',
      );

      return {
        commissions,
        payouts,
        orders: orders as any[],
        stats: {
          ordersTotal: orders.length,
          ordersCompleted: completedOrders.length,
          salesVolume: completedOrders.reduce(
            (s: number, o: any) => s + Number(o.total_amount || 0),
            0,
          ),
          commissionPending: sumBy('pending'),
          commissionHeld: held,
          commissionApproved: sumBy('approved'),
          commissionPaid: sumBy('paid'),
          payoutsRequested: payouts
            .filter((p) => p.status === 'requested')
            .reduce((s, p) => s + Number(p.amount || 0), 0),
          payoutsPaid: payouts
            .filter((p) => p.status === 'paid')
            .reduce((s, p) => s + Number(p.amount || 0), 0),
        },
      };
    },
  });
}

export function useUpdateAffiliate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: string;
      commission_percent?: number;
      notes?: string;
      payout_details?: string;
    }) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.status != null) {
        updates.status = payload.status;
        if (payload.status === 'active') updates.approved_at = new Date().toISOString();
      }
      if (payload.commission_percent != null) updates.commission_percent = payload.commission_percent;
      if (payload.notes != null) updates.notes = payload.notes;
      if (payload.payout_details != null) updates.payout_details = payload.payout_details;

      const { error } = await (supabase as any)
        .from('affiliates')
        .update(updates)
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
  });
}

/** Admin creates partner directly (no public apply / no user signup) */
export function useAdminCreateAffiliate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      whatsapp: string;
      email?: string;
      code?: string;
      commission_percent?: number;
      activate?: boolean;
    }) => {
      // Reuse public apply for unique code generation
      const { data, error } = await (supabase as any).rpc('apply_affiliate', {
        p_name: payload.name,
        p_whatsapp: payload.whatsapp,
        p_email: payload.email || null,
        p_notes: 'Created by admin',
        p_code: payload.code || null,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Create failed');

      const id = data.id as string;
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.activate !== false) {
        updates.status = 'active';
        updates.approved_at = new Date().toISOString();
      }
      if (payload.commission_percent != null) {
        updates.commission_percent = payload.commission_percent;
      }
      const { error: uErr } = await (supabase as any)
        .from('affiliates')
        .update(updates)
        .eq('id', id);
      if (uErr) throw uErr;
      return { ...data, status: payload.activate === false ? 'pending' : 'active' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
  });
}

export function useMarkPayoutPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payoutId: string) => {
      const { data, error } = await (supabase as any).rpc('admin_mark_affiliate_payout_paid', {
        p_payout_id: payoutId,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
      qc.invalidateQueries({ queryKey: ['admin-affiliate-commissions'] });
    },
  });
}

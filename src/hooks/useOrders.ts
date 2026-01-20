import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'completed' | 'on_hold' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  plan_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  payment_method: 'bank_transfer' | 'binance_usdt' | null;
  payment_proof_url: string | null;
  binance_id: string | null;
  customer_country: string | null;
  security_metadata: any | null;
  user_agent: string | null;
  client_ip: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
};

export const useRecentOrders = (limit: number = 5) => {
  return useQuery({
    queryKey: ['orders', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Order[];
    },
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount');

      if (error) throw error;

      const orders = data || [];

      const stats: OrderStats = {
        totalOrders: orders.length,
        totalRevenue: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + Number(o.total_amount), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        refundedOrders: orders.filter(o => o.status === 'refunded').length,
      };

      return stats;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      order_number: string;
      customer_name: string;
      customer_whatsapp: string;
      total_amount: number;
      status?: OrderStatus;
      notes?: string;
      payment_method?: 'bank_transfer' | 'binance_usdt';
      payment_proof_url?: string;
      binance_id?: string;
      customer_country?: string;
      items: {
        product_id?: string;
        product_name: string;
        plan_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          order_number: orderData.order_number,
          customer_name: orderData.customer_name,
          customer_whatsapp: orderData.customer_whatsapp,
          total_amount: orderData.total_amount,
          notes: orderData.notes,
          payment_method: orderData.payment_method,
          payment_proof_url: orderData.payment_proof_url,
          binance_id: orderData.binance_id,
          customer_country: orderData.customer_country,
          security_metadata: (orderData as any).security_metadata,
          user_agent: (orderData as any).user_agent,
          items: orderData.items,
        },
      });

      if (error) {
        const anyErr = error as any;

        // Supabase Functions errors often hide the real JSON body; extract it when possible.
        if (anyErr?.context) {
          try {
            const body = await anyErr.context.json();
            const msg = body?.error || body?.message;
            if (msg) throw new Error(String(msg));
          } catch {
            // ignore JSON parse errors and fall back to the generic message
          }
        }

        throw new Error(error.message || 'Edge function failed');
      }
      if (!data?.order) throw new Error('Failed to create order');

      return data.order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useDeleteOrderProof = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, filePath }: { orderId: string; filePath: string }) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('payment-proofs')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion failed:', storageError);
        // We continue anyway to nullify the DB record if it's already missing from storage
      }

      // 2. Update DB
      const { error: dbError } = await supabase
        .from('orders')
        .update({ payment_proof_url: null })
        .eq('id', orderId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useTrackOrder = (orderNumber: string) => {
  return useQuery({
    queryKey: ['orders', 'track', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          customer_name,
          total_amount,
          status,
          created_at,
          payment_method,
          order_items (*)
        `)
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'completed' | 'on_hold' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  plan_name: string | null;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  customer_credentials?: any | null;
  products?: { manual_fulfillment: boolean } | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  total_amount: number;
  discount_amount?: number;
  status: OrderStatus;
  notes: string | null;
  payment_method: 'bank_transfer' | 'upi' | 'binance_usdt' | 'crypto_onchain' | 'card' | null;
  payment_proof_url: string | null;
  binance_id: string | null;
  customer_country: string | null;
  currency_code?: string;
  currency_symbol?: string;
  currency_rate?: number;
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
          order_items (
            *,
            products (
              manual_fulfillment
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown) as Order[];
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
          order_items (
            *,
            products (
              manual_fulfillment
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as unknown) as Order[];
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
      discount_amount?: number;
      applied_coupon_id?: string;
      status?: OrderStatus;
      notes?: string;
      payment_method?: 'bank_transfer' | 'upi' | 'binance_usdt' | 'crypto_onchain' | 'card';
      payment_proof_url?: string;
      binance_id?: string;
      customer_country?: string;
      customer_email?: string;
      security_metadata?: any;
      user_agent?: string;
      currency_code?: string;
      currency_symbol?: string;
      currency_rate?: number;
      affiliate_code?: string | null;
      items: {
        product_id?: string;
        product_name: string;
        plan_name?: string;
        variant_id?: string;
        variant_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        customer_credentials?: any;
      }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          order_number: orderData.order_number,
          customer_name: orderData.customer_name,
          customer_whatsapp: orderData.customer_whatsapp,
          total_amount: orderData.total_amount,
          discount_amount: orderData.discount_amount ?? 0,
          applied_coupon_id: orderData.applied_coupon_id || null,
          notes: orderData.notes,
          payment_method: orderData.payment_method,
          payment_proof_url: orderData.payment_proof_url,
          binance_id: orderData.binance_id,
          customer_country: orderData.customer_country,
          customer_email: orderData.customer_email,
          security_metadata: orderData.security_metadata,
          user_agent: orderData.user_agent,
          currency_code: orderData.currency_code,
          currency_symbol: orderData.currency_symbol,
          currency_rate: orderData.currency_rate,
          affiliate_code: orderData.affiliate_code || null,
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

export const useUpdateExistingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('order_number', orderId) // Assuming we use order_number for tracking
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

export type OrderStatusUpdateResult = {
  order: Order;
  /** Present when status → processing triggered reseller auto-deliver */
  delivery?: {
    success?: boolean;
    error?: string;
    delivered?: number;
    failed?: number;
    skipped?: number;
    order_status?: string;
    results?: Array<{
      product_name?: string;
      status?: string;
      error?: string;
      delivered_data?: string;
    }>;
  } | null;
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

      let delivery: OrderStatusUpdateResult['delivery'] = null;

      // Auto-deliver mapped reseller products when payment is confirmed (processing)
      if (status === 'processing' && data?.id) {
        try {
          const { data: settings } = await supabase.functions.invoke('reseller-fulfill', {
            body: { action: 'get_settings' },
          });

          if (!settings?.has_api_key) {
            delivery = {
              success: false,
              error:
                'Reseller API key not configured. Save your key under Admin → Reseller API, then use “Deliver via Reseller API”.',
              failed: 0,
              delivered: 0,
              skipped: 0,
            };
          } else if (!settings?.is_enabled) {
            delivery = {
              success: false,
              error:
                'Auto-delivery is OFF. Turn ON “Enable auto-delivery” in Reseller API settings and Save — or click “Deliver via Reseller API” on this order (manual override).',
              failed: 0,
              delivered: 0,
              skipped: 0,
            };
          } else if (settings?.auto_deliver_on_processing === false) {
            delivery = {
              success: false,
              error:
                'Auto-deliver when status → processing is OFF. Enable it in Reseller API settings, or click “Deliver via Reseller API” on this order.',
              failed: 0,
              delivered: 0,
              skipped: 0,
            };
          } else {
            // Automation path: respects is_enabled (no bypass). Admin Deliver button uses bypass.
            const { data: deliverResult, error: deliverError } = await supabase.functions.invoke(
              'reseller-fulfill',
              {
                body: {
                  action: 'deliver_order',
                  order_id: data.id,
                },
              },
            );

            if (deliverError) {
              let msg = deliverError.message || 'Auto-delivery request failed';
              const anyErr = deliverError as any;
              if (anyErr?.context) {
                try {
                  const body = await anyErr.context.json();
                  msg =
                    body?.error ||
                    body?.results?.find((r: any) => r.status === 'failed')?.error ||
                    msg;
                  delivery = {
                    success: false,
                    error: msg,
                    failed: body?.failed ?? 1,
                    delivered: body?.delivered ?? 0,
                    skipped: body?.skipped ?? 0,
                    results: body?.results,
                  };
                } catch {
                  delivery = { success: false, error: msg, failed: 1, delivered: 0 };
                }
              } else {
                delivery = { success: false, error: msg, failed: 1, delivered: 0 };
              }
            } else if (deliverResult) {
              delivery = {
                success: !!deliverResult.success || (deliverResult.delivered ?? 0) > 0,
                error: deliverResult.error,
                delivered: deliverResult.delivered ?? 0,
                failed: deliverResult.failed ?? 0,
                skipped: deliverResult.skipped ?? 0,
                order_status: deliverResult.order_status,
                results: deliverResult.results,
              };
            }
          }
        } catch (e: any) {
          delivery = {
            success: false,
            error: e?.message || 'Auto-delivery failed',
            failed: 1,
            delivered: 0,
          };
        }
      }

      // Re-fetch order in case status flipped to completed
      const { data: refreshed } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      return {
        order: (refreshed || data) as Order,
        delivery,
      } satisfies OrderStatusUpdateResult;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'track'] });
      queryClient.invalidateQueries({ queryKey: ['reseller'] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'order-log', vars.orderId] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'order-deliveries', vars.orderId] });
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

export const useTrackOrder = (query: string) => {
  return useQuery({
    queryKey: ['orders', 'track', query],
    queryFn: async () => {
      if (!query) return null;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

      let queryBuilder = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_whatsapp,
          total_amount,
          discount_amount,
          status,
          notes,
          created_at,
          updated_at,
          payment_method,
          payment_proof_url,
          currency_code,
          currency_symbol,
          currency_rate,
          order_items (
            *,
            products ( reseller_product_id, manual_fulfillment )
          )
        `);

      if (isUUID) {
        queryBuilder = queryBuilder.eq('id', query);
      } else {
        queryBuilder = queryBuilder.eq('order_number', query);
      }

      const { data, error } = await queryBuilder.maybeSingle();

      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!query,
    // Live status while payment/delivery in progress
    refetchInterval: (q) => {
      const st = (q.state.data as Order | null | undefined)?.status;
      if (!st) return false;
      if (st === 'pending' || st === 'processing' || st === 'shipping' || st === 'on_hold') {
        return 5000;
      }
      return false;
    },
    refetchOnWindowFocus: true,
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseEdgeFunctionError } from '@/utils/parseEdgeFunctionError';
import { UPI_CHECKOUT_ENABLED } from '@/lib/paymentMethod';

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
  card_checkout_url?: string | null;
  card_link_created_at?: string | null;
  card_marked_paid_at?: string | null;
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

export const useCardInboxStats = (enabled = true) => {
  return useQuery({
    queryKey: ['orders', 'card-inbox-stats'],
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, card_checkout_url, card_marked_paid_at, payment_proof_url')
        .eq('payment_method', 'card')
        .eq('status', 'pending');

      if (error) {
        if (String(error.message || '').includes('card_marked_paid_at')) {
          return { pending: 0, needsLink: 0, markedPaid: 0, actionCount: 0 };
        }
        throw error;
      }
      const rows = data || [];
      let needsLink = 0;
      let markedPaid = 0;
      for (const row of rows) {
        if (row.card_marked_paid_at || row.payment_proof_url) markedPaid += 1;
        else if (!String(row.card_checkout_url || '').trim()) needsLink += 1;
      }
      return {
        pending: rows.length,
        needsLink,
        markedPaid,
        actionCount: needsLink + markedPaid,
      };
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
      if (!UPI_CHECKOUT_ENABLED && orderData.payment_method === 'upi') {
        throw new Error('UPI is temporarily unavailable. Please use bank transfer, crypto, or card.');
      }

      const payload = {
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        customer_whatsapp: orderData.customer_whatsapp,
        total_amount: orderData.total_amount,
        discount_amount: orderData.discount_amount ?? 0,
        applied_coupon_id: orderData.applied_coupon_id || null,
        notes: orderData.notes,
        status: orderData.status ?? 'pending',
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
      };

      // 1. Try Edge Function with auto-retry
      let maxRetries = 2;
      let attempt = 0;
      let lastErrorMessage = '';

      while (attempt <= maxRetries) {
        try {
          const { data, error } = await supabase.functions.invoke('create-order', {
            body: payload,
          });

          if (!error && data?.order) {
            return data.order as Order;
          }

          if (error) {
            lastErrorMessage = await parseEdgeFunctionError(error);
            // If it's a validation error (like coupon invalid or price mismatch), don't retry, throw directly
            if (!lastErrorMessage.includes('Network request failed') && !lastErrorMessage.includes('Failed to send a request') && !lastErrorMessage.includes('Failed to fetch')) {
              throw new Error(lastErrorMessage);
            }
          }
        } catch (err: any) {
          lastErrorMessage = err.message || 'Network error';
          if (!lastErrorMessage.includes('Network request failed') && !lastErrorMessage.includes('Failed to send a request') && !lastErrorMessage.includes('Failed to fetch')) {
            throw err;
          }
        }

        attempt++;
        if (attempt <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        }
      }

      // 2. Direct REST DB Fallback if Edge Function URL is blocked by adblocker / network glitch
      console.warn('[useCreateOrder] Edge function failed after retries. Executing direct database fallback.');

      const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .upsert(
          {
            order_number: payload.order_number,
            customer_name: payload.customer_name,
            customer_whatsapp: payload.customer_whatsapp,
            total_amount: payload.total_amount,
            discount_amount: payload.discount_amount,
            applied_coupon_id: payload.applied_coupon_id,
            notes: payload.notes,
            status: payload.status ?? 'pending',
            payment_method: payload.payment_method,
            payment_proof_url: payload.payment_proof_url,
            binance_id: payload.binance_id,
            customer_country: payload.customer_country || 'Unknown',
            customer_email: payload.customer_email,
            security_metadata: payload.security_metadata,
            user_agent: payload.user_agent,
            currency_code: payload.currency_code || 'LKR',
            currency_symbol: payload.currency_symbol || 'Rs.',
            currency_rate: payload.currency_rate || 1,
            affiliate_code: payload.affiliate_code,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'order_number' }
        )
        .select()
        .single();

      if (dbErr || !dbOrder) {
        throw new Error(dbErr?.message || lastErrorMessage || 'Network connection issue. Please try again.');
      }

      if (payload.items && payload.items.length > 0) {
        const itemsPayload = payload.items.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          plan_name: item.plan_name || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          customer_credentials: item.customer_credentials || null,
        }));
        await supabase.from('order_items').insert(itemsPayload);
      }

      return dbOrder as unknown as Order;
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
              const msg = await parseEdgeFunctionError(deliverError);
              delivery = {
                success: false,
                error: msg,
                failed: 1,
                delivered: 0,
                skipped: 0,
              };
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
          card_checkout_url,
          card_link_created_at,
          card_marked_paid_at,
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

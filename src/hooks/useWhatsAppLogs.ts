// Custom hooks for WhatsApp logs and analytics

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppLog, WhatsAppLogsFilter, WhatsAppStats } from '@/types/whatsapp';

// Fetch WhatsApp logs with filters
export const useWhatsAppLogs = (filters: WhatsAppLogsFilter = {}) => {
    return useQuery({
        queryKey: ['whatsapp-logs', filters],
        queryFn: async () => {
            let query = supabase
                .from('whatsapp_logs')
                .select(`
          *,
          product:products(name, slug)
        `)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate);
            }
            if (filters.productId) {
                query = query.eq('product_id', filters.productId);
            }
            if (filters.event) {
                query = query.eq('event', filters.event);
            }
            if (filters.phone) {
                query = query.ilike('phone', `%${filters.phone}%`);
            }

            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 50;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                logs: data as WhatsAppLog[],
                total: count || 0,
                page,
                limit,
            };
        },
    });
};

// Fetch WhatsApp analytics stats
export const useWhatsAppStats = (dateRange?: { start: string; end: string }) => {
    return useQuery({
        queryKey: ['whatsapp-stats', dateRange],
        queryFn: async () => {
            let query = supabase
                .from('whatsapp_logs')
                .select('*');

            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start)
                    .lte('created_at', dateRange.end);
            }

            const { data, error } = await query;

            if (error) throw error;

            const logs = data || [];

            // Calculate stats
            const stats: WhatsAppStats = {
                totalMessages: logs.length,
                productViews: logs.filter(log => log.event === 'PRODUCT_VIEW').length,
                orderClicks: logs.filter(log => log.event === 'ORDER_CLICK').length,
                uniqueUsers: new Set(logs.map(log => log.phone)).size,
            };

            return stats;
        },
    });
};

// Fetch top products by views
export const useWhatsAppTopProducts = (limit: number = 5) => {
    return useQuery({
        queryKey: ['whatsapp-top-products', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('whatsapp_logs')
                .select(`
          product_id,
          product:products(name, slug)
        `)
                .eq('event', 'PRODUCT_VIEW')
                .not('product_id', 'is', null);

            if (error) throw error;

            // Count views per product
            const productCounts: Record<string, { count: number; name: string; slug: string }> = {};

            data.forEach((log: any) => {
                if (log.product_id && log.product) {
                    if (!productCounts[log.product_id]) {
                        productCounts[log.product_id] = {
                            count: 0,
                            name: log.product.name,
                            slug: log.product.slug,
                        };
                    }
                    productCounts[log.product_id].count++;
                }
            });

            // Sort and limit
            const topProducts = Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);

            return topProducts;
        },
    });
};

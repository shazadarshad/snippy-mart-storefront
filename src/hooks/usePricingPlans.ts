import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PricingPlan {
  id: string;
  product_id: string;
  name: string;
  duration: string;
  price: number;
  old_price?: number | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PricingPlanFormData {
  product_id: string;
  name: string;
  duration: string;
  price: number;
  old_price?: number | null;
  is_default?: boolean;
}

// Fetch pricing plans for a product
export const usePricingPlans = (productId?: string) => {
  return useQuery({
    queryKey: ['pricing-plans', productId],
    queryFn: async () => {
      const query = supabase
        .from('product_pricing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (productId) {
        query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PricingPlan[];
    },
    enabled: !!productId || productId === undefined,
  });
};

// Fetch all pricing plans
export const useAllPricingPlans = () => {
  return useQuery({
    queryKey: ['pricing-plans', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_pricing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data as PricingPlan[];
    },
  });
};

// Add a pricing plan
export const useAddPricingPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (plan: PricingPlanFormData) => {
      const { data, error } = await supabase
        .from('product_pricing_plans')
        .insert([plan])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({ title: 'Pricing plan added', description: `${data.name} has been added.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Update a pricing plan
export const useUpdatePricingPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...plan }: PricingPlanFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('product_pricing_plans')
        .update(plan)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({ title: 'Pricing plan updated', description: `${data.name} has been updated.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete a pricing plan
export const useDeletePricingPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast({ title: 'Pricing plan deleted', description: 'The pricing plan has been removed.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

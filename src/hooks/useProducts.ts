import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock';

export interface ProductRequirements {
  require_email?: boolean;
  require_password?: boolean;
  require_username?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug?: string; // URL-friendly identifier
  description: string;
  price: number;
  old_price?: number | null;
  category: string; // Legacy single category (kept for compatibility)
  categories?: string[]; // New: Multiple categories support
  image_url: string;
  is_active?: boolean;
  is_featured?: boolean;
  stock_status?: StockStatus;
  requirements?: ProductRequirements | null;
  manual_fulfillment?: boolean;
  use_variant_pricing?: boolean; // Toggle for showing pricing grid vs simple flow
  display_order?: number; // Manual sort order (lower = higher priority)
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  old_price?: number | null;
  category: string;
  categories?: string[];
  image_url: string;
  is_active?: boolean;
  is_featured?: boolean;
  stock_status?: StockStatus;
  requirements?: ProductRequirements | null;
  manual_fulfillment?: boolean;
  use_variant_pricing?: boolean;
  display_order?: number;
}

// Fetch all products (active only for public, all for admin)
export const useProducts = (includeInactive = false) => {
  return useQuery({
    queryKey: ['products', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
};

// Fetch featured products
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
};

// Add a product
export const useAddProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: ProductFormData) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product added', description: `${data.name} has been added.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Update a product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...product }: ProductFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated', description: `${data.name} has been updated.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete a product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', description: 'The product has been removed.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Upload product image
export const useUploadProductImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error) => {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    },
  });
};

// Move product order
export const useMoveProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId, direction }: { productId: string; direction: 'up' | 'down' }) => {
      // Get all products sorted by display_order
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, display_order')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!products) throw new Error('No products found');

      const currentIndex = products.findIndex(p => p.id === productId);
      if (currentIndex === -1) throw new Error('Product not found');

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= products.length) {
        throw new Error(`Cannot move ${direction}, already at ${direction === 'up' ? 'top' : 'bottom'}`);
      }

      const currentProduct = products[currentIndex];
      const targetProduct = products[targetIndex];

      // Swap display_order values
      const currentOrder = currentProduct.display_order ?? currentIndex;
      const targetOrder = targetProduct.display_order ?? targetIndex;

      // Update both products
      const { error: updateError1 } = await supabase
        .from('products')
        .update({ display_order: targetOrder })
        .eq('id', currentProduct.id);

      if (updateError1) throw updateError1;

      const { error: updateError2 } = await supabase
        .from('products')
        .update({ display_order: currentOrder })
        .eq('id', targetProduct.id);

      if (updateError2) throw updateError2;

      return { success: true };
    },
    // Optimistic update - instant UI feedback
    onMutate: async ({ productId, direction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products', true] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(['products', true]);

      // Optimistically update
      if (previousProducts) {
        const newProducts = [...previousProducts];
        const currentIndex = newProducts.findIndex(p => p.id === productId);

        if (currentIndex !== -1) {
          const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

          if (targetIndex >= 0 && targetIndex < newProducts.length) {
            // Swap items
            [newProducts[currentIndex], newProducts[targetIndex]] =
              [newProducts[targetIndex], newProducts[currentIndex]];

            // Update cache
            queryClient.setQueryData(['products', true], newProducts);
          }
        }
      }

      return { previousProducts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Order updated', description: 'Product order has been changed.' });
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', true], context.previousProducts);
      }
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

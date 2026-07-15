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
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Public list: skip heavy unused columns; admin still gets full row
      const select = includeInactive
        ? '*'
        : 'id,name,slug,description,price,old_price,category,categories,image_url,is_active,is_featured,stock_status,requirements,manual_fulfillment,use_variant_pricing,display_order,created_at';

      let query = supabase
        .from('products')
        .select(select)
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
      // New products go to the end of the storefront list
      let display_order = product.display_order;
      if (display_order == null) {
        const { data: maxRow } = await supabase
          .from('products')
          .select('display_order')
          .order('display_order', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
        display_order = (maxRow?.display_order ?? -1) + 1;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, display_order }])
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

/** Bulk insert products (CSV import). Chunks to avoid payload limits. */
export const useBulkAddProducts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (products: ProductFormData[]) => {
      if (!products.length) throw new Error('No products to import');

      const CHUNK = 40;
      let inserted = 0;
      for (let i = 0; i < products.length; i += CHUNK) {
        const chunk = products.slice(i, i + CHUNK);
        const { data, error } = await supabase.from('products').insert(chunk).select('id');
        if (error) throw error;
        inserted += data?.length ?? chunk.length;
      }
      return { count: inserted };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Bulk import complete',
        description: `${result.count} product${result.count === 1 ? '' : 's'} added.`,
      });
    },
    onError: (error) => {
      toast({ title: 'Bulk import failed', description: error.message, variant: 'destructive' });
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

/** Persist a full product order as sequential display_order (0, 1, 2, …). */
async function persistProductOrder(orderedIds: string[]) {
  if (!orderedIds.length) return;

  // Parallel updates are fine; each row is independent
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('products').update({ display_order: index }).eq('id', id)
    )
  );

  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

function applyOrderToCache(
  products: Product[] | undefined,
  orderedIds: string[]
): Product[] | null {
  if (!products?.length) return null;

  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered: Product[] = [];

  orderedIds.forEach((id, index) => {
    const p = byId.get(id);
    if (p) {
      ordered.push({ ...p, display_order: index });
      byId.delete(id);
    }
  });

  // Keep any products not in orderedIds at the end (shouldn't normally happen)
  byId.forEach((p) => ordered.push(p));
  return ordered;
}

/**
 * Reorder all products by full ordered id list.
 * Use for drag-and-drop and move-to-top/bottom.
 */
export const useReorderProducts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await persistProductOrder(orderedIds);
      return { success: true as const };
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousAdminProducts = queryClient.getQueryData<Product[]>(['products', true]);
      const previousFrontendProducts = queryClient.getQueryData<Product[]>(['products', false]);

      const nextAdmin = applyOrderToCache(previousAdminProducts, orderedIds);
      if (nextAdmin) queryClient.setQueryData(['products', true], nextAdmin);

      // Public cache only has active products — filter order to those ids
      if (previousFrontendProducts) {
        const activeIds = orderedIds.filter((id) =>
          previousFrontendProducts.some((p) => p.id === id)
        );
        const nextFront = applyOrderToCache(previousFrontendProducts, activeIds);
        if (nextFront) queryClient.setQueryData(['products', false], nextFront);
      }

      return { previousAdminProducts, previousFrontendProducts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousAdminProducts) {
        queryClient.setQueryData(['products', true], context.previousAdminProducts);
      }
      if (context?.previousFrontendProducts) {
        queryClient.setQueryData(['products', false], context.previousFrontendProducts);
      }
      toast({ title: 'Could not save order', description: error.message, variant: 'destructive' });
    },
  });
};

export type MoveProductDirection = 'up' | 'down' | 'top' | 'bottom';

/** Move one product relative to the full list, then reindex display_order. */
export const useMoveProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      productId,
      direction,
    }: {
      productId: string;
      direction: MoveProductDirection;
    }) => {
      const { data: allProducts, error: fetchError } = await supabase
        .from('products')
        .select('id, display_order')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!allProducts?.length) throw new Error('No products found');

      const ids = allProducts.map((p) => p.id);
      const currentIndex = ids.indexOf(productId);
      if (currentIndex === -1) throw new Error('Product not found');

      let targetIndex = currentIndex;
      if (direction === 'up') targetIndex = currentIndex - 1;
      if (direction === 'down') targetIndex = currentIndex + 1;
      if (direction === 'top') targetIndex = 0;
      if (direction === 'bottom') targetIndex = ids.length - 1;

      if (targetIndex < 0) throw new Error('Already at the top');
      if (targetIndex >= ids.length) throw new Error('Already at the bottom');
      if (targetIndex === currentIndex) return { success: true as const };

      const next = [...ids];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);

      await persistProductOrder(next);
      return { success: true as const };
    },
    onMutate: async ({ productId, direction }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousAdminProducts = queryClient.getQueryData<Product[]>(['products', true]);
      const previousFrontendProducts = queryClient.getQueryData<Product[]>(['products', false]);

      const reorderList = (products: Product[] | undefined) => {
        if (!products?.length) return null;
        const ids = products.map((p) => p.id);
        const currentIndex = ids.indexOf(productId);
        if (currentIndex === -1) return null;

        let targetIndex = currentIndex;
        if (direction === 'up') targetIndex = currentIndex - 1;
        if (direction === 'down') targetIndex = currentIndex + 1;
        if (direction === 'top') targetIndex = 0;
        if (direction === 'bottom') targetIndex = ids.length - 1;
        if (targetIndex < 0 || targetIndex >= ids.length || targetIndex === currentIndex) {
          return null;
        }

        const nextIds = [...ids];
        const [moved] = nextIds.splice(currentIndex, 1);
        nextIds.splice(targetIndex, 0, moved);
        return applyOrderToCache(products, nextIds);
      };

      const newAdmin = reorderList(previousAdminProducts);
      if (newAdmin) queryClient.setQueryData(['products', true], newAdmin);

      const newFront = reorderList(previousFrontendProducts);
      if (newFront) queryClient.setQueryData(['products', false], newFront);

      return { previousAdminProducts, previousFrontendProducts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousAdminProducts) {
        queryClient.setQueryData(['products', true], context.previousAdminProducts);
      }
      if (context?.previousFrontendProducts) {
        queryClient.setQueryData(['products', false], context.previousFrontendProducts);
      }
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

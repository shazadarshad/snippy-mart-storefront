import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    avatar_url: string;
    content: string;
    rating: number;
    is_active: boolean;
    created_at: string;
}

export interface TestimonialFormData {
    name: string;
    role: string;
    avatar_url: string;
    content: string;
    rating: number;
    is_active: boolean;
}

// Fetch testimonials (active only for public, all for admin)
export const useTestimonials = (includeInactive = false) => {
    return useQuery({
        queryKey: ['testimonials', includeInactive],
        queryFn: async () => {
            let query = supabase
                .from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Testimonial[];
        },
    });
};

// Add a testimonial
export const useAddTestimonial = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (testimonial: TestimonialFormData) => {
            const { data, error } = await supabase
                .from('testimonials')
                .insert([testimonial])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            toast({ title: 'Testimonial added', description: 'Review has been added successfully.' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
};

// Update a testimonial
export const useUpdateTestimonial = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...testimonial }: TestimonialFormData & { id: string }) => {
            const { data, error } = await supabase
                .from('testimonials')
                .update(testimonial)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            toast({ title: 'Testimonial updated', description: 'Review has been updated successfully.' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
};

// Delete a testimonial
export const useDeleteTestimonial = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('testimonials')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            toast({ title: 'Testimonial deleted', description: 'Review has been removed.' });
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });
};

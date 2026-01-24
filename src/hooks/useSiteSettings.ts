import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      // Convert to key-value object for easier access
      const settings: Record<string, string | null> = {};
      (data as SiteSetting[])?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });

      return settings;
    },
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ key, value }, { onConflict: 'key' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      // Update site settings
      const { error: updateError } = await supabase
        .from('site_settings')
        .upsert({ key: 'logo_url', value: publicUrl }, { onConflict: 'key' });

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};

export const useRemoveLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentLogoUrl: string) => {
      // Extract filename from URL
      const urlParts = currentLogoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage.from('site-assets').remove([fileName]);

      // Clear setting
      const { error } = await supabase
        .from('site_settings')
        .update({ value: null })
        .eq('key', 'logo_url');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};

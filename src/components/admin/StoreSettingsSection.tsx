import { useState, useRef, useEffect } from 'react';
import { Store, Upload, X, Image, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSetting, useUploadLogo, useRemoveLogo } from '@/hooks/useSiteSettings';

const StoreSettingsSection = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: siteSettings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();

  const [settings, setSettings] = useState({
    storeName: 'Snippy Mart',
    storeEmail: 'snippymartco@gmail.com',
  });

  useEffect(() => {
    if (siteSettings) {
      setSettings(prev => ({
        ...prev,
        storeName: siteSettings.store_name || prev.storeName,
      }));
    }
  }, [siteSettings]);

  const logoUrl = siteSettings?.logo_url;

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'store_name', value: settings.storeName });
      toast({
        title: 'Settings saved',
        description: 'Your store settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await uploadLogo.mutateAsync(file);
      toast({
        title: 'Logo uploaded',
        description: 'Your store logo has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      await removeLogo.mutateAsync(logoUrl);
      toast({
        title: 'Logo removed',
        description: 'Your store logo has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove logo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-secondary/50 rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      {/* Logo Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Store Logo</h2>
            <p className="text-sm text-muted-foreground">Upload your store logo</p>
          </div>
        </div>

        <div className="space-y-4">
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl bg-secondary/50 border border-border flex items-center justify-center overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt="Store logo" 
                  className="w-full h-full object-contain p-2"
                />
                <button
                  onClick={handleRemoveLogo}
                  disabled={removeLogo.isPending}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Current logo</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Logo
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload logo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 2MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Store Information */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Store Information</h2>
            <p className="text-sm text-muted-foreground">Basic store details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="storeName" className="text-foreground">Store Name</Label>
            <Input
              id="storeName"
              value={settings.storeName}
              onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">This name appears in the navbar and footer</p>
          </div>
          <div>
            <Label htmlFor="storeEmail" className="text-foreground">Store Email</Label>
            <Input
              id="storeEmail"
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, storeEmail: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
          </div>
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Store Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsSection;

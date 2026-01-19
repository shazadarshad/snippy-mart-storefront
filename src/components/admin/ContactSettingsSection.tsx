import { useState, useEffect } from 'react';
import { MessageCircle, FileText, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';

const ContactSettingsSection = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [formData, setFormData] = useState({
    whatsappNumber: '',
    whatsappMessageTemplate: '',
    footerText: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        whatsappNumber: settings.whatsapp_number || '',
        whatsappMessageTemplate: settings.whatsapp_message_template || '',
        footerText: settings.footer_text || '© 2026 Snippy Mart. All rights reserved.',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'whatsapp_number', value: formData.whatsappNumber }),
        updateSetting.mutateAsync({ key: 'whatsapp_message_template', value: formData.whatsappMessageTemplate }),
        updateSetting.mutateAsync({ key: 'footer_text', value: formData.footerText }),
      ]);

      toast({
        title: 'Settings saved',
        description: 'Contact & Footer settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* WhatsApp Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">WhatsApp Settings</h2>
            <p className="text-sm text-muted-foreground">Configure WhatsApp integration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsappNumber" className="text-foreground">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="e.g. 94787767869"
              className="mt-1.5 bg-secondary/50 border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Include country code without + (e.g., 94787767869)</p>
          </div>
          <div>
            <Label htmlFor="whatsappMessageTemplate" className="text-foreground">WhatsApp Message Template</Label>
            <Textarea
              id="whatsappMessageTemplate"
              value={formData.whatsappMessageTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsappMessageTemplate: e.target.value }))}
              placeholder="e.g. Hello! I just placed an order. Order ID: {order_id}"
              className="mt-1.5 bg-secondary/50 border-border min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">Use {'{order_id}'} to automatically insert the Order ID.</p>
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Footer</h2>
            <p className="text-sm text-muted-foreground">Customize footer text</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="footerText" className="text-foreground">Footer Text</Label>
            <Input
              id="footerText"
              value={formData.footerText}
              onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} variant="hero" size="lg" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Contact Settings
          </>
        )}
      </Button>
    </div>
  );
};

export default ContactSettingsSection;

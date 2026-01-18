import { useState } from 'react';
import { MessageCircle, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ContactSettingsSection = () => {
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    whatsappNumber: '+94 78 776 7869',
    welcomeMessage: 'Thank you for your order! Your subscription details will be shared shortly.',
    footerText: '© 2026 Snippy Mart. All rights reserved.',
  });

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Contact & Footer settings have been updated.',
    });
  };

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
              value={settings.whatsappNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +94 78 776 7869)</p>
          </div>
          <div>
            <Label htmlFor="welcomeMessage" className="text-foreground">Order Confirmation Message</Label>
            <Textarea
              id="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border min-h-[100px]"
            />
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
              value={settings.footerText}
              onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} variant="hero" size="lg">
        <Save className="w-4 h-4 mr-2" />
        Save Contact Settings
      </Button>
    </div>
  );
};

export default ContactSettingsSection;

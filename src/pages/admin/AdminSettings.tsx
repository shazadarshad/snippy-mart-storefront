import { useState } from 'react';
import { Save, Store, MessageCircle, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    storeName: 'Snippy Mart',
    storeEmail: 'support@snippymart.lk',
    whatsappNumber: '+94 77 123 4567',
    currency: 'LKR',
    footerText: '© 2026 Snippy Mart. All rights reserved.',
    welcomeMessage: 'Thank you for your order! Your subscription details will be shared shortly.',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your store settings have been updated successfully.',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your store preferences</p>
      </div>

      <div className="max-w-2xl space-y-8">
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
                name="storeName"
                value={settings.storeName}
                onChange={handleInputChange}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label htmlFor="storeEmail" className="text-foreground">Store Email</Label>
              <Input
                id="storeEmail"
                name="storeEmail"
                type="email"
                value={settings.storeEmail}
                onChange={handleInputChange}
                className="mt-1.5 bg-secondary/50 border-border"
              />
            </div>
          </div>
        </div>

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
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleInputChange}
                className="mt-1.5 bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +1 234 567 8900)</p>
            </div>
            <div>
              <Label htmlFor="welcomeMessage" className="text-foreground">Order Confirmation Message</Label>
              <Textarea
                id="welcomeMessage"
                name="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={handleInputChange}
                className="mt-1.5 bg-secondary/50 border-border min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Currency</h2>
              <p className="text-sm text-muted-foreground">Set your store currency</p>
            </div>
          </div>

          <div>
            <Label htmlFor="currency" className="text-foreground">Currency</Label>
            <Select value={settings.currency} onValueChange={(value) => setSettings((prev) => ({ ...prev, currency: value }))}>
              <SelectTrigger className="mt-1.5 bg-secondary/50 border-border">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label htmlFor="footerText" className="text-foreground">Footer Text</Label>
            <Input
              id="footerText"
              name="footerText"
              value={settings.footerText}
              onChange={handleInputChange}
              className="mt-1.5 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button variant="hero" size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;

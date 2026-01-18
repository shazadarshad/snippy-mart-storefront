import { useState, useEffect } from 'react';
import { Building2, Bitcoin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';

const PaymentSettingsSection = () => {
  const { toast } = useToast();
  const { data: siteSettings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [bankSettings, setBankSettings] = useState({
    bank_name: 'Sampath Bank',
    bank_branch: 'Horana',
    bank_account_name: 'M A MUSAMMIL',
    bank_account_number: '105752093919',
  });

  const [binanceSettings, setBinanceSettings] = useState({
    binance_id: '1190172947',
    binance_name: 'Snippy Mart',
    binance_coin: 'USDT',
  });

  useEffect(() => {
    if (siteSettings) {
      setBankSettings({
        bank_name: siteSettings.bank_name || 'Sampath Bank',
        bank_branch: siteSettings.bank_branch || 'Horana',
        bank_account_name: siteSettings.bank_account_name || 'M A MUSAMMIL',
        bank_account_number: siteSettings.bank_account_number || '105752093919',
      });
      setBinanceSettings({
        binance_id: siteSettings.binance_id || '1190172947',
        binance_name: siteSettings.binance_name || 'Snippy Mart',
        binance_coin: siteSettings.binance_coin || 'USDT',
      });
    }
  }, [siteSettings]);

  const handleSaveBankSettings = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'bank_name', value: bankSettings.bank_name }),
        updateSetting.mutateAsync({ key: 'bank_branch', value: bankSettings.bank_branch }),
        updateSetting.mutateAsync({ key: 'bank_account_name', value: bankSettings.bank_account_name }),
        updateSetting.mutateAsync({ key: 'bank_account_number', value: bankSettings.bank_account_number }),
      ]);
      toast({
        title: 'Bank settings saved',
        description: 'Your bank transfer details have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bank settings.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveBinanceSettings = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'binance_id', value: binanceSettings.binance_id }),
        updateSetting.mutateAsync({ key: 'binance_name', value: binanceSettings.binance_name }),
        updateSetting.mutateAsync({ key: 'binance_coin', value: binanceSettings.binance_coin }),
      ]);
      toast({
        title: 'Binance settings saved',
        description: 'Your Binance Pay details have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save Binance settings.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-secondary/50 rounded-2xl" />;
  }

  return (
    <div className="space-y-8">
      {/* Bank Transfer Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bank Transfer</h2>
            <p className="text-sm text-muted-foreground">Configure bank transfer payment details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name" className="text-foreground">Bank Name</Label>
              <Input
                id="bank_name"
                value={bankSettings.bank_name}
                onChange={(e) => setBankSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
                placeholder="e.g., Sampath Bank"
              />
            </div>
            <div>
              <Label htmlFor="bank_branch" className="text-foreground">Branch</Label>
              <Input
                id="bank_branch"
                value={bankSettings.bank_branch}
                onChange={(e) => setBankSettings(prev => ({ ...prev, bank_branch: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
                placeholder="e.g., Horana"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bank_account_name" className="text-foreground">Account Name</Label>
            <Input
              id="bank_account_name"
              value={bankSettings.bank_account_name}
              onChange={(e) => setBankSettings(prev => ({ ...prev, bank_account_name: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border"
              placeholder="e.g., M A MUSAMMIL"
            />
          </div>
          <div>
            <Label htmlFor="bank_account_number" className="text-foreground">Account Number</Label>
            <Input
              id="bank_account_number"
              value={bankSettings.bank_account_number}
              onChange={(e) => setBankSettings(prev => ({ ...prev, bank_account_number: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border font-mono"
              placeholder="e.g., 105752093919"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Customers will be instructed to enter their Order ID as beneficiary remarks
          </p>
          <Button 
            onClick={handleSaveBankSettings} 
            disabled={updateSetting.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Bank Settings
          </Button>
        </div>
      </div>

      {/* Binance Settings */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-[#F0B90B]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Binance Pay</h2>
            <p className="text-sm text-muted-foreground">Configure Binance USDT payment details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="binance_name" className="text-foreground">Account Name</Label>
              <Input
                id="binance_name"
                value={binanceSettings.binance_name}
                onChange={(e) => setBinanceSettings(prev => ({ ...prev, binance_name: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
                placeholder="e.g., Snippy Mart"
              />
            </div>
            <div>
              <Label htmlFor="binance_coin" className="text-foreground">Coin/Currency</Label>
              <Input
                id="binance_coin"
                value={binanceSettings.binance_coin}
                onChange={(e) => setBinanceSettings(prev => ({ ...prev, binance_coin: e.target.value }))}
                className="mt-1.5 bg-secondary/50 border-border"
                placeholder="e.g., USDT"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="binance_id" className="text-foreground">Binance ID</Label>
            <Input
              id="binance_id"
              value={binanceSettings.binance_id}
              onChange={(e) => setBinanceSettings(prev => ({ ...prev, binance_id: e.target.value }))}
              className="mt-1.5 bg-secondary/50 border-border font-mono"
              placeholder="e.g., 1190172947"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Customers will be instructed to enter their Order ID as a note when sending
          </p>
          <Button 
            onClick={handleSaveBinanceSettings} 
            disabled={updateSetting.isPending}
            variant="outline"
            className="w-full sm:w-auto border-[#F0B90B]/30 text-[#F0B90B] hover:bg-[#F0B90B]/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Binance Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsSection;

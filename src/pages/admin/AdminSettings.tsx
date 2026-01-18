import { useState } from 'react';
import { Store, CreditCard, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StoreSettingsSection from '@/components/admin/StoreSettingsSection';
import PaymentSettingsSection from '@/components/admin/PaymentSettingsSection';
import ContactSettingsSection from '@/components/admin/ContactSettingsSection';

const AdminSettings = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your store preferences</p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        <div className="max-w-2xl">
          <TabsContent value="store" className="mt-0">
            <StoreSettingsSection />
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <PaymentSettingsSection />
          </TabsContent>

          <TabsContent value="contact" className="mt-0">
            <ContactSettingsSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

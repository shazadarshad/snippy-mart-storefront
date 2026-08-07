import { useState } from 'react';
import { Store, CreditCard, MessageCircle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StoreSettingsSection from '@/components/admin/StoreSettingsSection';
import PaymentSettingsSection from '@/components/admin/PaymentSettingsSection';
import ContactSettingsSection from '@/components/admin/ContactSettingsSection';
import AutoApproveSettingsSection from '@/components/admin/AutoApproveSettingsSection';

const AdminSettings = () => {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">Configure your store preferences</p>
        </div>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6 sm:mb-8 h-auto p-1 rounded-xl">
          <TabsTrigger value="store" className="flex items-center gap-2 py-2.5 rounded-lg touch-manipulation">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 py-2.5 rounded-lg touch-manipulation">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>

          <TabsTrigger value="auto-approve" className="flex items-center gap-2 py-2.5 rounded-lg touch-manipulation">
            <Zap className="w-4 h-4 text-emerald-500 fill-current" />
            <span className="hidden sm:inline">Auto-Approve</span>
          </TabsTrigger>

          <TabsTrigger value="contact" className="flex items-center gap-2 py-2.5 rounded-lg touch-manipulation">
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

          <TabsContent value="auto-approve" className="mt-0">
            <AutoApproveSettingsSection />
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

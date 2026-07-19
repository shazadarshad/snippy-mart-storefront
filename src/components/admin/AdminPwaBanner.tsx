import { useState } from 'react';
import { Bell, BellOff, Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminPwa } from '@/hooks/useAdminPwa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'snippy_admin_pwa_banner_dismiss';

export function AdminPwaBanner() {
  const { toast } = useToast();
  const {
    canInstall,
    installed,
    promptInstall,
    notifyEnabled,
    enableNotifications,
    disableNotifications,
  } = useAdminPwa();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Already on home screen as PWA — no top banner (keeps admin clean)
  if (installed) return null;
  if (dismissed && !canInstall) return null;
  if (dismissed && notifyEnabled) return null;

  const onInstall = async () => {
    const res = await promptInstall();
    if (res.ok) {
      toast({ title: 'Installing…', description: 'Add Snippy Admin to your home screen.' });
      return;
    }
    if (res.reason === 'unavailable') {
      toast({
        title: 'Install from browser menu',
        description:
          'Android: ⋮ → Install app / Add to Home screen. iPhone Safari: Share → Add to Home Screen. Use https://snippymart.com/admin/orders',
      });
    }
  };

  const onNotify = async () => {
    if (notifyEnabled) {
      disableNotifications();
      toast({ title: 'Order alerts off' });
      return;
    }
    const res = await enableNotifications();
    if (res.ok) {
      toast({
        title: 'Order alerts on',
        description: 'You’ll get a notification when a new order arrives (while logged in).',
      });
      return;
    }
    if (res.reason === 'denied') {
      toast({
        title: 'Notifications blocked',
        description: 'Allow notifications for snippymart.com in phone Settings.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Not supported',
      description: 'This browser does not support notifications.',
      variant: 'destructive',
    });
  };

  const onDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (dismissed && !canInstall) return null;

  return (
    <div
      className={cn(
        'border-b border-border/80 bg-gradient-to-r from-teal-500/10 via-background to-primary/5',
        'px-3 py-2 sm:px-4',
      )}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <Smartphone className="w-4 h-4 text-teal-600 shrink-0 hidden xs:block sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight truncate">
            {installed ? 'App ready · turn on order alerts' : 'Install Admin app · order alerts'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!installed && (
            <Button
              size="sm"
              className="h-8 px-2.5 text-[11px] font-bold touch-manipulation"
              onClick={onInstall}
            >
              <Download className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">{canInstall ? 'Install' : 'How'}</span>
            </Button>
          )}
          {installed && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 px-1">
              <CheckCircle2 className="w-3 h-3" /> App
            </span>
          )}
          <Button
            size="sm"
            variant={notifyEnabled ? 'secondary' : 'outline'}
            className="h-8 px-2.5 text-[11px] font-bold touch-manipulation"
            onClick={onNotify}
          >
            {notifyEnabled ? (
              <>
                <Bell className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">On</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Alerts</span>
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 touch-manipulation"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

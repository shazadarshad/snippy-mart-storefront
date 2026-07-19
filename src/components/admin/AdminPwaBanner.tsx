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

  const hideBanner = dismissed && !canInstall && notifyEnabled;
  if (hideBanner) return null;

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
          'Android Chrome: menu (⋮) → Install app / Add to Home screen. iPhone Safari: Share → Add to Home Screen. Open this page as https://snippymart.com/admin/orders first.',
      });
      return;
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
        description: 'You’ll get a notification when a new order arrives (while logged in as admin).',
      });
      return;
    }
    if (res.reason === 'denied') {
      toast({
        title: 'Notifications blocked',
        description: 'Enable notifications for snippymart.com in phone Settings → Apps / Site settings.',
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

  if (dismissed && !canInstall) {
    // Compact controls still available via small bar? show minimal strip if notify off
    if (notifyEnabled) return null;
  }

  return (
    <div
      className={cn(
        'border-b border-border bg-gradient-to-r from-teal-500/10 via-background to-primary/10',
        'px-3 py-2.5 sm:px-4',
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-6xl mx-auto">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Smartphone className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-foreground leading-snug">
              {installed ? 'Admin app on home screen' : 'Install Admin as an app'}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {installed
                ? 'Enable order alerts so you get notified when customers place orders.'
                : 'Add to Home Screen → open like a normal app. Then turn on order notifications.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!installed && (
            <Button
              size="sm"
              className="h-9 font-bold touch-manipulation"
              onClick={onInstall}
            >
              <Download className="w-4 h-4 mr-1.5" />
              {canInstall ? 'Install app' : 'How to install'}
            </Button>
          )}
          {installed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 px-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Installed
            </span>
          )}
          <Button
            size="sm"
            variant={notifyEnabled ? 'secondary' : 'outline'}
            className="h-9 font-bold touch-manipulation"
            onClick={onNotify}
          >
            {notifyEnabled ? (
              <>
                <Bell className="w-4 h-4 mr-1.5" />
                Alerts on
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-1.5" />
                Enable alerts
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

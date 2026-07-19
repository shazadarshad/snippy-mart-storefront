import { useCallback, useEffect, useState } from 'react';

const NOTIFY_KEY = 'snippy_admin_notify_orders';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useAdminPwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    try {
      return localStorage.getItem(NOTIFY_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    setInstalled(isStandalone());
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Use admin-focused manifest while on admin
  useEffect(() => {
    const link =
      (document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null) || null;
    if (!link) return;
    const prev = link.href;
    link.href = '/admin-manifest.json';
    // iOS title
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
      document.head.appendChild(appleTitle);
    }
    appleTitle.setAttribute('content', 'Snippy Admin');
    return () => {
      link.href = prev.includes('admin-manifest') ? '/manifest.json' : prev;
      appleTitle?.setAttribute('content', 'Snippy Mart');
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { ok: false as const, reason: 'unavailable' as const };
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      return { ok: true as const };
    }
    return { ok: false as const, reason: 'dismissed' as const };
  }, [deferredPrompt]);

  const enableNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      return { ok: false as const, reason: 'unsupported' as const };
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    setPermission(perm);
    if (perm !== 'granted') {
      return { ok: false as const, reason: 'denied' as const };
    }
    try {
      localStorage.setItem(NOTIFY_KEY, '1');
    } catch {
      /* ignore */
    }
    setNotifyEnabled(true);

    // Warm SW + test notification path
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('Snippy Admin ready', {
          body: 'You will get alerts when new orders arrive (while logged in).',
          icon: '/android-chrome-192x192.png',
          tag: 'admin-notify-test',
          data: { url: '/admin/orders' },
        });
      } catch {
        /* some browsers block test if tab not focused */
      }
    }
    return { ok: true as const };
  }, []);

  const disableNotifications = useCallback(() => {
    try {
      localStorage.setItem(NOTIFY_KEY, '0');
    } catch {
      /* ignore */
    }
    setNotifyEnabled(false);
  }, []);

  return {
    canInstall: !!deferredPrompt && !installed,
    installed,
    promptInstall,
    notifyEnabled,
    permission,
    enableNotifications,
    disableNotifications,
  };
}

export async function showAdminOrderNotification(opts: {
  title: string;
  body: string;
  orderId?: string;
}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const url = opts.orderId ? `/admin/orders` : '/admin/orders';
  const payload = {
    body: opts.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: `order-${opts.orderId || Date.now()}`,
    renotify: true,
    data: { url },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      // Prefer SW so notification works better when tab is backgrounded
      const sw = navigator.serviceWorker.controller;
      if (sw) {
        sw.postMessage({ type: 'SHOW_NOTIFICATION', title: opts.title, options: payload });
        return;
      }
      await reg.showNotification(opts.title, payload);
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(opts.title, payload);
  } catch {
    /* ignore */
  }
}

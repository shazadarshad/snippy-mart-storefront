/* Snippy Mart service worker — cache + admin order notifications */
const CACHE_NAME = 'snippy-mart-v10-admin-pwa';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/admin-manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'SHOW_NOTIFICATION' && self.registration) {
    const { title, options } = data;
    event.waitUntil(
      self.registration.showNotification(title || 'Snippy Admin', {
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [140, 70, 140, 70, 200],
        ...options,
        // Always allow OS notification sound (Android shade)
        silent: false,
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/orders';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes('/admin')) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Never cache hashed build assets
  const isHashedAsset =
    url.pathname.startsWith('/assets/') ||
    /\.[a-f0-9]{6,}\.(js|css)$/i.test(url.pathname);

  if (isHashedAsset) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((c) => c || new Response('Offline', { status: 503 })),
      ),
    );
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match('/') || new Response('Offline', { status: 503 })),
        ),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || new Response('Offline', { status: 503 })),
      ),
  );
});

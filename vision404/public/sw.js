/* Vision404 Service Worker — Push Notification Handler */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received at', new Date().toLocaleTimeString());
  let data = { title: 'Vision404', body: 'Anomaly detected.', url: '/' };

  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Parsed push payload:', data);
    } catch (e) {
      data.body = event.data.text() || data.body;
      console.log('[SW] Raw text payload:', data.body);
    }
  }

  const options = {
    body: data.body || 'Check Vision404 for details.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'vision404-anomaly-' + Date.now(),
    requireInteraction: true,
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Vision404', options)
      .then(() => console.log('[SW] self.registration.showNotification succeeded!'))
      .catch(err => console.error('[SW] self.registration.showNotification failed:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (const client of windowClients) {
        if (client.url.includes('localhost:5173') && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

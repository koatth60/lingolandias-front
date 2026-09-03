// Installable-app requirement: a service worker needs to be registered and
// controlling the page for Chrome's "Install app" prompt to ever fire.
// Deliberately a pure network passthrough — no caching layer. This app is
// live chat/video, so serving anything stale (an old bundle, an old message)
// from a cache would be actively wrong here, not just a missed optimization.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Reuse an already-open tab instead of stacking a new one — same-origin
      // check is required since navigate() throws across origins.
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

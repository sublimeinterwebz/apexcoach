importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB_rQab_YoOmwccXY-uJoSbOrm1GfJm7II",
  authDomain: "apexcoach-be717.firebaseapp.com",
  projectId: "apexcoach-be717",
  storageBucket: "apexcoach-be717.firebasestorage.app",
  messagingSenderId: "225684428011",
  appId: "1:225684428011:web:664394dec6309da6ebdaae",
});

const messaging = firebase.messaging();

// Data-only messages — only our handler runs, so no double-display.
// Payload shape: { data: { title, body, link } }
messaging.onBackgroundMessage((payload) => {
  const data  = payload.data || {};
  const title = data.title || 'ApexCoach';
  const body  = data.body  || '';
  const link  = data.link  || '/dashboard';

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    data:  { link },
    // Dedup tag — if a second copy arrives, it replaces instead of stacking
    tag:   'apexcoach-notification',
    renotify: false,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.link || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

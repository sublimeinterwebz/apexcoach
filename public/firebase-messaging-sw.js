// Firebase Cloud Messaging background handler
// Must live at /firebase-messaging-sw.js (root of domain) for FCM to find it
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

// Handle background push messages (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  // Check if the app is already open and focused — if so, skip the system notification
  // because the foreground onMessage handler in useFCM.js will show the in-app toast
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const appIsOpen = clients.some(
      (c) => c.url.includes(self.location.origin) && c.visibilityState === "visible"
    );
    if (appIsOpen) return; // foreground handler takes over

    const title = payload.notification?.title || "ApexCoach";
    const body  = payload.notification?.body  || "";
    self.registration.showNotification(title, {
      body,
      icon:  "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data:  payload.data || {},
      vibrate: [200, 100, 200],
    });
  });
});

// Clicking the notification — open or focus the app
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

// Service Worker for Web Push Notifications
// This runs in the background even when the app is closed

const CACHE_NAME = 'rbx-chat-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    clients.claim() // Take control of all clients immediately
  );
});

// Push event - receives push notifications from server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'Pesan Baru',
    body: 'Anda memiliki pesan baru',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-notification',
    data: {}
  };

  // Parse push payload
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Service Worker] Push payload:', payload);
      
      notificationData = {
        title: payload.title || 'Pesan Baru',
        body: payload.body || 'Anda memiliki pesan baru',
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || 'chat-notification',
        data: payload.data || {},
        requireInteraction: false,
        silent: false,
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);
  
  event.notification.close();

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/chat';

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          
          // If already on chat page, just focus it
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no chat window open, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification);
});

// Background sync (optional - for offline message sending)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Sync pending messages when back online
      syncPendingMessages()
    );
  }
});

async function syncPendingMessages() {
  console.log('[Service Worker] Syncing pending messages...');
  // Implementation for offline message sync
  // This can be extended in the future
}

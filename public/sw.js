const CACHE_NAME = 'momentum-vita-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Setting {cache: 'reload'} in the new request will ensure that the response
      // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
      await cache.addAll(CACHE_URLS);
      // Force the waiting service worker to become the active service worker.
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );

      // Take control of all pages
      self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for same-origin
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first for navigation requests
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          console.log('Fetch failed; returning offline page instead.', error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }

  // For other requests, use cache-first strategy
  else if (event.request.destination === 'image' ||
           event.request.destination === 'script' ||
           event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Handle background sync for workout data
self.addEventListener('sync', (event) => {
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/icons/action-workout.png'
      },
      {
        action: 'view-progress',
        title: 'View Progress',
        icon: '/icons/action-progress.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Momentum Vita', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/workout')
    );
  } else if (event.action === 'view-progress') {
    event.waitUntil(
      clients.openWindow('/progress')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync workout data when online
async function syncWorkoutData() {
  try {
    // Get pending workout data from IndexedDB
    const pendingData = await getPendingWorkoutData();

    if (pendingData.length > 0) {
      // Sync each workout session
      for (const workout of pendingData) {
        await fetch('/api/sync-workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workout),
        });
      }

      // Clear synced data
      await clearPendingWorkoutData();
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingWorkoutData() {
  // Implementation would use IndexedDB to get pending data
  return [];
}

async function clearPendingWorkoutData() {
  // Implementation would clear synced data from IndexedDB
}
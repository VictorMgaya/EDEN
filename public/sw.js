// Service Worker for Eden PWA
const STATIC_CACHE = 'eden-static-v1.0.0';
const DYNAMIC_CACHE = 'eden-dynamic-v1.0.0';

// Static Assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/eden.svg',
  '/edenlogo.svg',
  '/window.svg',
  '/globe.svg',
  '/next.svg',
  '/location-icon-png-28.png',
  '/offlinestatic.html'
];

// API routes to cache (but with short expiration)
const API_CACHE_PATTERNS = [
  /rest\.isric\.org\/soilgrids/,
  /openweathermap\.org/,
  /api\.usgs\.gov/
];

// Dynamic routes to cache
const DYNAMIC_ROUTES = [
  '/analytics',
  '/Experts',
  '/about',
  '/Services'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (request.method === 'GET' &&
      API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(request).then(response => {
          // Cache successful responses
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached version if network fails
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Handle dynamic routes
  if (request.method === 'GET' &&
      DYNAMIC_ROUTES.includes(url.pathname) ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle static assets (cache-first strategy)
  if (request.method === 'GET' &&
      (STATIC_ASSETS.includes(url.pathname) ||
       url.pathname.startsWith('/_next/static/') ||
       url.pathname.endsWith('.css') ||
       url.pathname.endsWith('.js'))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          return cachedResponse || fetch(request);
        });
      })
    );
    return;
  }

  // Default network-first strategy for pages and other requests
  event.respondWith(
    fetch(request).then(response => {
      // Cache successful responses
      if (response.ok && request.method === 'GET') {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      // Return cached version if available
      if (request.method === 'GET') {
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      }
    })
  );
});

// Handle offline fallback
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic cache cleanup - clear API cache entries every 30 minutes
setInterval(() => {
  caches.open(DYNAMIC_CACHE).then(cache => {
    cache.keys().then(requests => {
      requests.forEach(request => {
        // Remove API cache entries (always refresh API data periodically)
        if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
          cache.delete(request);
        }
      });
    });
  });
}, 30 * 60 * 1000); // Run every 30 minutes

const CACHE_NAME = 'lzl-cache-v2';
const STATIC_ASSETS = [
  '/',
    '/index.html',
      '/manifest.json',
        '/logo.jpeg'
        ];

        // Install event - cache static assets
        self.addEventListener('install', (event) => {
          event.waitUntil(
              caches.open(CACHE_NAME)
                    .then((cache) => {
                            console.log('Caching static assets');
                                    return cache.addAll(STATIC_ASSETS);
                                          })
                                                .then(() => self.skipWaiting())
                                                  );
                                                  });

                                                  // Activate event - clean old caches
                                                  self.addEventListener('activate', (event) => {
                                                    event.waitUntil(
                                                        caches.keys().then((cacheNames) => {
                                                              return Promise.all(
                                                                      cacheNames.map((cacheName) => {
                                                                                if (cacheName !== CACHE_NAME) {
                                                                                            console.log('Deleting old cache:', cacheName);
                                                                                                        return caches.delete(cacheName);
                                                                                                                  }
                                                                                                                          })
                                                                                                                                );
                                                                                                                                    }).then(() => self.clients.claim())
                                                                                                                                      );
                                                                                                                                      });

                                                                                                                                      // Fetch event - network first, fallback to cache
                                                                                                                                      self.addEventListener('fetch', (event) => {
                                                                                                                                        // Skip non-GET requests
                                                                                                                                          if (event.request.method !== 'GET') return;

                                                                                                                                            // Skip chrome-extension and other non-http requests
                                                                                                                                              if (!event.request.url.startsWith('http')) return;

                                                                                                                                                event.respondWith(
                                                                                                                                                    fetch(event.request)
                                                                                                                                                          .then((response) => {
                                                                                                                                                                  // Clone the response before caching
                                                                                                                                                                          const responseClone = response.clone();
                                                                                                                                                                                  
                                                                                                                                                                                          caches.open(CACHE_NAME).then((cache) => {
                                                                                                                                                                                                    // Only cache same-origin requests
                                                                                                                                                                                                              if (event.request.url.startsWith(self.location.origin)) {
                                                                                                                                                                                                                          cache.put(event.request, responseClone);
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                    return response;
                                                                                                                                                                                                                                                          })
                                                                                                                                                                                                                                                                .catch(() => {
                                                                                                                                                                                                                                                                        // Network failed, try cache
                                                                                                                                                                                                                                                                                return caches.match(event.request).then((cachedResponse) => {
                                                                                                                                                                                                                                                                                          if (cachedResponse) {
                                                                                                                                                                                                                                                                                                      return cachedResponse;
                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                          // Return offline page for navigation requests
                                                                                                                                                                                                                                                                                                                                    if (event.request.mode === 'navigate') {
                                                                                                                                                                                                                                                                                                                                                return caches.match('/index.html');
                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                    return new Response('Offline', { status: 503 });
                                                                                                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                                                                                                  })
                                                                                                                                                                                                                                                                                                                                                                                    );
                                                                                                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                                                                                                    // Handle messages from the app
                                                                                                                                                                                                                                                                                                                                                                                    self.addEventListener('message', (event) => {
                                                                                                                                                                                                                                                                                                                                                                                      if (event.data && event.data.type === 'SKIP_WAITING') {
                                                                                                                                                                                                                                                                                                                                                                                          self.skipWaiting();
                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                                                                                                            
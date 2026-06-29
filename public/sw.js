const CACHE_NAME = 'vatavaranam-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// 1. ઇન્સ્ટોલેશન સમયે બધી મુખ્ય ફાઇલો કેશ કરો
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ઓફલાઇન મોડ માટે રિક્વેસ્ટ ઇન્ટરસેપ્ટ કરો
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // જો કેશમાં ફાઇલ હોય તો ત્યાંથી આપો, નહિતર નેટવર્ક પરથી લાવો
      return cachedResponse || fetch(event.request).catch(() => {
        // જો ઓપનવેધર API ની રિક્વેસ્ટ ફેલ થાય (ઓફલાઇન હોય) તો કસ્ટમ રિસ્પોન્સ
        if (event.request.url.includes('api.openweathermap.org')) {
          return new Response(JSON.stringify({ error: "offline" }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      });
    })
  );
});
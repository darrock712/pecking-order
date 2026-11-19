// Offline support. Pages are fetched fresh when online (so new puzzles and
// fixes arrive straight away) and fall back to the cache when offline.
const CACHE = 'peckish-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only keep good same-origin answers: never cache an error page or a redirect.
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return response
      })
      // Offline: the cached copy, or the app shell for page loads only (never as a script or image).
      .catch(() =>
        caches.match(request).then((hit) => hit ?? (request.mode === 'navigate' ? caches.match('./') : Response.error())),
      ),
  )
})

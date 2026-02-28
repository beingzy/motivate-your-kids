const CACHE = 'myk-v1'

// Cache the app shell on install
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest'])))
})

// Delete old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // _next/static assets are immutable — cache-first
  if (url.pathname.startsWith('/_next/static')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
      }),
    )
    return
  }

  // Navigation requests — network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/').then(r => r ?? Response.error())),
    )
    return
  }

  // Everything else — network-first
  e.respondWith(
    fetch(request).catch(() => caches.match(request).then(r => r ?? Response.error())),
  )
})

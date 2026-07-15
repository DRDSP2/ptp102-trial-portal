// Minimal PWA service worker for the PTP-102 Trial Portal.
//
// Design goals:
//  - The app installs cleanly on iOS Safari and Android Chrome.
//  - Network-first for navigations; the cached app shell is only a fallback so
//    the PWA still launches offline. No aggressive caching of app content.
//  - Cross-origin requests (Supabase API, storage, email JS, etc.) are NEVER
//    cached, so no stale clinical data can be served from the SW.
//  - Same-origin static assets (JS/CSS/icons) use stale-while-revalidate: fast
//    loads that still self-update on each visit.

const CACHE = 'ptp102-portal-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/assets/byrock-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {
        /* offline pre-cache is best-effort */
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache cross-origin traffic (Supabase, email JS, etc.) so clinical
  // data is always live.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to the cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

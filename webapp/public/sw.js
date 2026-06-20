// OpenWhoop service worker — scope "/" covers the landing and the dashboard.
// Strategy: network-first for navigations + same-origin GETs (so deploys land
// immediately), falling back to the runtime cache when offline. IndexedDB (the
// real app data) is untouched — it's always local.
// ponytail: runtime cache only, no precache manifest to chase Next's hashed
// asset names. Bump CACHE to evict old entries when behaviour changes.
const CACHE = "openwhoop-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(request).then((c) => c || caches.match("/"))),
  );
});

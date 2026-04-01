const CACHE_NAME = "prayer-room-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/manifest.json", "/icon.svg"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))); event.waitUntil(clients.claim()); });
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url); if (event.request.method !== "GET") return; if (url.hostname.includes("convex.cloud") || url.hostname.includes("clerk")) return;
  if (event.request.headers.get("accept")?.includes("text/html")) { event.respondWith(fetch(event.request).then((r) => { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, c)); return r; }).catch(() => caches.match(event.request))); return; }
  event.respondWith(caches.match(event.request).then((cached) => { if (cached) return cached; return fetch(event.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, c)); } return r; }); }));
});

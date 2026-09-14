const CACHE_NAME = "phoneshop-v1";
const ASSETS = ["./", "./index.html", "./style.css", "./shop.js", "./parser.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  // catalog + admin: always network-first so prices are fresh
  e.respondWith(fetch(e.request).then((res) => {
    if (res && res.status === 200) { const clone = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, clone)); }
    return res;
  }).catch(() => caches.match(e.request)));
});

// service-worker.js — cache offline
const CACHE = "sxrate-v1";
self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      "./index.html",
      "./style.css",
      "./app.js",
      "./manifest.json",
      "./icon.png"
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(r => r || fetch(evt.request))
  );
});

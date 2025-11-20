const CACHE = 'sxrate-v1';
self.addEventListener('install', evt=>{
  evt.waitUntil(
    caches.open(CACHE).then(c=> c.addAll([
      '/',
      '/index.html',
      '/style.css',
      '/app.js',
      '/manifest.json',
      '/icons/icon.png'
    ]))
  );
  self.skipWaiting();
});
self.addEventListener('fetch', evt=>{
  evt.respondWith(caches.match(evt.request).then(r=> r || fetch(evt.request)));
});

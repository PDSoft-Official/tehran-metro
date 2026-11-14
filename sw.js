const CACHE = 'tehran-metro-1.5-pwa-6';
const ASSETS = ['./', './index.html', './pwa.js', './manifest.webmanifest', './icon-v3-192.png', './icon-v3-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, {cache: "reload"}))))));
self.addEventListener('message', event => { if(event.data === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tehran-metro-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;
 if(event.request.mode === 'navigate') { event.respondWith(caches.open(CACHE).then(c => c.match('./index.html')).then(r => r || fetch(event.request))); return; }
 event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});

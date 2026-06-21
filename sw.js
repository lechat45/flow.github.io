const CACHE = 'flow-v3.1';
// Fonctionne en sous-dossier GitHub Pages (ex: lechat45.github.io/flow.github.io/)
const ASSETS = ['./', './index.html', './logo.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Ne pas intercepter Firebase, Google Fonts, ou les APIs externes
  const external = ['googleapis.com','gstatic.com','firebaseio.com','groq.com','cdnjs.cloudflare.com'];
  if (external.some(d => url.hostname.includes(d))) return;
  if (url.hostname !== self.location.hostname) return;

  // Stratégie network-first : on essaie toujours le réseau en priorité pour
  // servir la dernière version déployée. Le cache ne sert que de secours
  // hors-ligne, jamais de version "par défaut" affichée à la place du réseau.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && res.status < 400) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || new Response('Hors ligne', {status: 503})))
  );
});

/* Control de Obras: hace que la app abra rápido y se pueda instalar.
   La página siempre se busca primero en internet (así cada index.html nuevo se ve enseguida);
   si no hay señal, abre la última versión guardada. Los datos de Supabase nunca se guardan acá. */
const CACHE = 'control-obras-v2';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const propio = u.origin === self.location.origin;
  const libreria = /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if (!propio && !libreria) return; /* Supabase y todo lo demás va directo a internet */
  if (propio && (r.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/'))) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => {
    const red = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; }).catch(() => m);
    return m || red;
  }));
});

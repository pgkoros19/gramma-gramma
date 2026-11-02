// Keeps the app usable without internet once it has been opened.
// Raise the version when you upload a new index.html, so every device drops the old copy.
const CACHE = 'gramma-gramma-v3';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts/fonts.css',
  './fonts/commissioner-greek.woff2',
  './fonts/commissioner-latin.woff2',
  './fonts/literata-greek.woff2',
  './fonts/literata-latin.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const keep = (req, res) => {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(req, copy));
  return res;
};

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // the app's own files: try the network first so updates arrive, fall back to the saved copy offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => keep(req, res))
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // the PDF libraries never change at a given address: use the saved copy when there is one
  if (/(^|\.)cdnjs\.cloudflare\.com$/.test(url.hostname)) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res))));
  }
});

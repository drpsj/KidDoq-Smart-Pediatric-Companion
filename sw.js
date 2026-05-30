const CACHE_NAME = 'kiddoq-v32-cache';

const urlsToCache = [
    './',
    './index.html',
    './css/theme.css',
    './css/desktop.css',
    './css/mobile.css',
    './js/database.js',
    './js/store.js',
    './js/patient-store.js',
    './js/patient-registry.js',
    './js/clinical-math.js',
    './js/encounter-ledger.js',
    './js/module-rx.js',
    './js/module-er.js',
    './js/module-nutrition.js',
    './js/module-growth.js',
    './js/module-vax.js',
    './js/core-settings.js',
    './js/print-engine.js',
    './js/view-controller.js',
    './js/app.js',
    './icon-rx.png',
    './icon-cert.png',
    './icon-growth.png',
    './icon-vax.png',
    './icon-er.png',
    './icon-miles.png',
    './icon-triage.png',
    './icon-diet.png',
    './icon-jaundice.png',
    './icon-asthma.png',
    './kiddoq lite.png'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force the new worker to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error("SW Cache Install Error:", err))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
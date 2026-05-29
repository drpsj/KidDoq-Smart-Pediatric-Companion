const CACHE_NAME = 'kiddoq-v12-cache'; // Bumped to v12

const urlsToCache = [
    './',
    './index.html',
    './css/theme.css',
    './css/desktop.css',
    './css/mobile.css',
    './js/app.js',
    './js/patient-registry.js',
    './js/encounter-ledger.js',
    './js/module-rx.js', // RENAMED (was calculators.js)
    './js/core-settings.js',
    './js/module-er.js',
    './js/module-nutrition.js',
    './js/module-er.js', // ADD THIS LINE
    './js/clinical-math.js',
    './js/database.js',
    './js/module-growth.js',
    './js/module-vax.js',
    './js/patient-store.js',
    './js/print-engine.js',
    './js/store.js',
    './js/view-controller.js',
    './kiddoq lite.png'
];

// Install Event: Download and cache all the files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch Event: Serve files from the cache if offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the file is in the cache, return it!
                if (response) {
                    return response;
                }
                // Otherwise, try to fetch it from the internet
                return fetch(event.request);
            })
    );
});
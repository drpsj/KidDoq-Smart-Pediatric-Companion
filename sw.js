// sw.js - KidDoq Offline Engine
const CACHE_NAME = 'kiddoq-v2-cache';

// The files we want to save directly to the device's hard drive
const urlsToCache = [
    './',
    './index.html',
    './css/theme.css',
    './css/desktop.css',
    './css/mobile.css',,
    './js/app.js',
    './js/calculators.js',
    './js/clinical-math.js',
    './js/database.js',
    './js/growth-vax.js',
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
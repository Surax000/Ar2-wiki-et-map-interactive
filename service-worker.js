const CACHE_NAME = 'ar2-wiki-v3-explosives';
const CACHE_PREFIX = 'ar2-wiki-';
const MAX_CACHED_REQUESTS = 300;
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './pwa-icon.svg',
    './data-version.json',
    './site-data.js',
    './site-status.js',
    './events.js',
    './accessories.js',
    './cosmetics.js',
    './crosshair-app/src/autocolor.js',
    './crosshair-app/src/aimtrainer.js',
    './crosshair-app/src/ar2-tools.js',
    './crosshair-app/src/ar2-quick.js'
];
const EXTERNAL_CACHE_HOSTS = new Set([
    'cdn.tailwindcss.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
]);
const REQUIRED_URLS = new Set(PRECACHE_URLS.map(url => new URL(url, self.location.href).href));

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

async function storeResponse(cache, request, response) {
    if (!response.ok && response.type !== 'opaque') return;
    try {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        while (keys.length > MAX_CACHED_REQUESTS) {
            const removable = keys.find(key => {
                if (REQUIRED_URLS.has(key.url)) return false;
                return !EXTERNAL_CACHE_HOSTS.has(new URL(key.url).hostname);
            });
            if (!removable) break;
            await cache.delete(removable);
            keys.splice(keys.indexOf(removable), 1);
        }
    } catch (error) {
        console.warn('AR2: impossible de mettre cette ressource en cache hors ligne.', error);
    }
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !EXTERNAL_CACHE_HOSTS.has(url.hostname)) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (request.mode === 'navigate') {
            try {
                const response = await fetch(request);
                await storeResponse(cache, request, response);
                return response;
            } catch (error) {
                const shell = cached || await cache.match('./index.html');
                if (shell) return shell;
                throw error;
            }
        }

        const refresh = fetch(request).then(async response => {
            await storeResponse(cache, request, response);
            return response;
        });
        if (cached) {
            event.waitUntil(refresh.catch(error => {
                console.warn('AR2: ressource indisponible en ligne, version en cache conservée.', error);
            }));
            return cached;
        }
        return refresh;
    })());
});

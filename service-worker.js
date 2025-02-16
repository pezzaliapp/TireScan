self.addEventListener("install", event => {
    event.waitUntil(
        caches.open("tireScan-cache").then(cache => {
            return cache.addAll([
                "/",
                "/index.html",
                "/style.css",
                "/app.js",
                "/opencv.js",
                "/manifest.json",
                "/icons/TireScan-192.png",
                "/icons/TireScan-512.png"
            ]);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

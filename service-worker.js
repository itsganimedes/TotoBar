const CACHE_NAME = "totobar-v1";

const ASSETS = [
  // raíz de la app
    "/TotoBar/",
    "/TotoBar/index.html",
    "/TotoBar/manifest.json",

    // estilos
    "/TotoBar/css/reset.css",
    "/TotoBar/css/index.css",
    "/TotoBar/css/headernav.css",
    ];

    // ===== INSTALL =====
    self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log("📦 Cacheando assets...");
            return cache.addAll(ASSETS);
        })
    );
    });

    // ===== ACTIVATE (limpia caches viejas) =====
    self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
        Promise.all(
            keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
        )
    );
    self.clients.claim();
    });

    // ===== FETCH =====
    self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(cached => {
            if (cached) return cached;
            return fetch(event.request);
        })
        .catch(() => {
            // fallback offline (opcional)
            if (event.request.mode === "navigate") {
            return caches.match("/TotoBar/index.html");
            }
        })
    );
});

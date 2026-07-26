const CACHE_VERSION = "v4";
const CACHE_NAME = `adenbungalov-pwa-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const APP_SHELL_FILES = [
  OFFLINE_URL,
  "/",
  "/bungalovlarimiz",
  "/iletisim",
  "/kurumsal",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        APP_SHELL_FILES.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            // Keep install resilient even if one static asset is unavailable.
            console.warn("Failed to cache asset:", asset, error);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          return await fetch(event.request);
        } catch (err) {
          console.warn("[PWA] Network failed, serving offline page.", err);
          const cache = await caches.open(CACHE_NAME);
          const offlineResponse = await cache.match(OFFLINE_URL);
          return offlineResponse || Response.error();
        }
      })()
    );

    return;
  }

  const staticDestinations = ["script", "style", "image", "font"];
  if (staticDestinations.includes(event.request.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        const networkPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cachedResponse) {
          void networkPromise;
          return cachedResponse;
        }

        const networkResponse = await networkPromise;
        return networkResponse || Response.error();
      })()
    );
  }

  if (
    requestUrl.pathname.startsWith("/api/public/") ||
    requestUrl.pathname.startsWith("/api/bungalovlar") ||
    requestUrl.pathname.startsWith("/api/customer/") ||
    requestUrl.pathname.startsWith("/api/settings/public")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await cache.match(event.request);
          return cached || Response.error();
        }
      })()
    );
  }
});

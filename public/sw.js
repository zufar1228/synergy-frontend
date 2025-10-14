const CACHE_NAME = "warehouse-monitoring-cache-v2";
const PRECACHE_URLS = [
  "/favicon.ico",
  "/window.svg",
  "/file.svg",
  "/manifest.webmanifest",
];

const STATIC_ASSET_EXTENSIONS = [
  ".js",
  ".css",
  ".ico",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".json",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
];

const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith("/_next/") ||
    STATIC_ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Always go to the network for API, auth, and other dynamic routes
  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.startsWith("/auth/") ||
    requestUrl.pathname.startsWith("/supabase") ||
    !isStaticAsset(event.request.url)
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }

          const clonedResponse = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });

          return networkResponse;
        })
        .catch(() => caches.match("/"));
    })
  );
});

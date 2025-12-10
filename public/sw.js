const CACHE_NAME = "warehouse-monitoring-cache-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
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

  // Network-first strategy for navigations with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return cachedOffline || Response.error();
      })
    );
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

// ============================
// PUSH NOTIFICATION HANDLERS
// ============================

self.addEventListener("push", function (event) {
  console.log("[SW] Push event received!"); // <-- Cek apakah ini muncul di konsol SW

  if (event.data) {
    console.log("[SW] Raw Data:", event.data.text()); // <-- Lihat data mentahnya

    try {
      const data = event.data.json();
      console.log("[SW] Parsed Data:", data);

      const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: { url: data.url },
      };

      const promiseChain = self.registration
        .showNotification(data.title, options)
        .then(() => console.log("[SW] Notification shown!"))
        .catch((err) => console.error("[SW] Error showing notification:", err));

      event.waitUntil(promiseChain);
    } catch (err) {
      console.error("[SW] Error parsing JSON:", err);
    }
  } else {
    console.log("[SW] Push event but no data.");
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  // Open URL when notification is clicked
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/dashboard")
  );
});

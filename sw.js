const CACHE_NAME = "ot-manager-v1";
const REPO_PATH = "/ot-management";

const urlsToCache = [
  REPO_PATH + "/",
  REPO_PATH + "/index.html",
  REPO_PATH + "/manifest.json"
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log("[Service Worker] Cache addAll error:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (
    event.request.url.includes("firebase") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return new Response("Offline - Content not cached", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({"Content-Type": "text/plain"})
          });
        });
      })
  );
});

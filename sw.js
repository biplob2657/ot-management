const CACHE_NAME = "ot-management-shell-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon.png"
];

// ================================
// INSTALL
// ================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});


// ================================
// ACTIVATE
// ================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});


// ================================
// FETCH
// ================================
self.addEventListener("fetch", (event) => {

  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Do NOT cache Firebase / Google API requests
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firebaseapp.com")
  ) {
    return;
  }

  // Only handle requests from this website
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    fetch(request)

      .then((response) => {

        // Save a copy for offline use
        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseClone);
          });

        return response;
      })

      .catch(() => {

        // If internet is unavailable,
        // load the cached version
        return caches.match(request)
          .then((cachedResponse) => {

            return (
              cachedResponse ||
              caches.match("./index.html")
            );

          });

      })

  );

});

const CACHE_NAME = "book-freedom-thumb-cache-v3";
const COVER_HOSTS = new Set([
  "covers.openlibrary.org",
  "books.google.com",
  "books.googleusercontent.com",
]);

function isThumbRequest(request) {
  if (request.method !== "GET") return false;
  try {
    const url = new URL(request.url);
    return COVER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("book-freedom-thumb-cache-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isThumbRequest(event.request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response && (response.type === "opaque" || response.ok)) {
        cache.put(event.request, response.clone());
      }
      return response;
    }),
  );
});

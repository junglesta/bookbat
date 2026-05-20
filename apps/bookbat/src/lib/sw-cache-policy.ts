const CACHEABLE_DESTINATIONS = new Set(["document", "script", "style", "image", "font"]);
const COVER_IMAGE_HOSTS = new Set([
  "covers.openlibrary.org",
  "books.google.com",
  "books.googleusercontent.com",
]);

export function shouldHandleFetch(input: {
  method: string;
  origin: string;
  hostname: string;
  swOrigin: string;
  pathname: string;
  destination: string;
}): boolean {
  if (input.method !== "GET") return false;
  if (input.origin === input.swOrigin) {
    if (input.pathname.startsWith("/api")) return false;
    if (input.destination && !CACHEABLE_DESTINATIONS.has(input.destination)) return false;
    return true;
  }

  return input.destination === "image" && COVER_IMAGE_HOSTS.has(input.hostname);
}

export function shouldCacheResponse(input: { ok: boolean; type: string }): boolean {
  return input.ok && input.type === "basic";
}

export function shouldCacheCoverResponse(input: { ok: boolean; type: string }): boolean {
  if (input.type === "opaque") return true;
  return input.ok && (input.type === "basic" || input.type === "cors");
}

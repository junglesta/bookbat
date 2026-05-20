import {
  shouldCacheCoverResponse,
  shouldCacheResponse,
  shouldHandleFetch,
} from "./sw-cache-policy";

describe("shouldHandleFetch", () => {
  it("accepts same-origin GET asset requests", () => {
    expect(
      shouldHandleFetch({
        method: "GET",
        origin: "https://app.example",
        hostname: "app.example",
        swOrigin: "https://app.example",
        pathname: "/assets/app.js",
        destination: "script",
      }),
    ).toBe(true);
  });

  it("rejects non-GET requests", () => {
    expect(
      shouldHandleFetch({
        method: "POST",
        origin: "https://app.example",
        hostname: "app.example",
        swOrigin: "https://app.example",
        pathname: "/submit",
        destination: "",
      }),
    ).toBe(false);
  });

  it("accepts cross-origin cover image requests from approved hosts", () => {
    expect(
      shouldHandleFetch({
        method: "GET",
        origin: "https://covers.openlibrary.org",
        hostname: "covers.openlibrary.org",
        swOrigin: "https://app.example",
        pathname: "/b/id/12345-L.jpg",
        destination: "image",
      }),
    ).toBe(true);
  });

  it("rejects cross-origin requests outside approved cover hosts", () => {
    expect(
      shouldHandleFetch({
        method: "GET",
        origin: "https://example-cdn.invalid",
        hostname: "example-cdn.invalid",
        swOrigin: "https://app.example",
        pathname: "/cover.jpg",
        destination: "image",
      }),
    ).toBe(false);
  });

  it("rejects API paths", () => {
    expect(
      shouldHandleFetch({
        method: "GET",
        origin: "https://app.example",
        hostname: "app.example",
        swOrigin: "https://app.example",
        pathname: "/api/books",
        destination: "",
      }),
    ).toBe(false);
  });

  it("rejects unknown destination types", () => {
    expect(
      shouldHandleFetch({
        method: "GET",
        origin: "https://app.example",
        hostname: "app.example",
        swOrigin: "https://app.example",
        pathname: "/video.mp4",
        destination: "video",
      }),
    ).toBe(false);
  });
});

describe("shouldCacheResponse", () => {
  it("accepts successful same-origin basic responses", () => {
    expect(shouldCacheResponse({ ok: true, type: "basic" })).toBe(true);
  });

  it("rejects non-ok or non-basic responses", () => {
    expect(shouldCacheResponse({ ok: false, type: "basic" })).toBe(false);
    expect(shouldCacheResponse({ ok: true, type: "cors" })).toBe(false);
  });
});

describe("shouldCacheCoverResponse", () => {
  it("accepts opaque cover responses", () => {
    expect(shouldCacheCoverResponse({ ok: false, type: "opaque" })).toBe(true);
  });

  it("accepts ok basic/cors and rejects non-ok basic/cors", () => {
    expect(shouldCacheCoverResponse({ ok: true, type: "basic" })).toBe(true);
    expect(shouldCacheCoverResponse({ ok: true, type: "cors" })).toBe(true);
    expect(shouldCacheCoverResponse({ ok: false, type: "cors" })).toBe(false);
  });
});

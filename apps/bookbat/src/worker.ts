import { version } from "../package.json";

// BOOK BAT runs as a Worker-with-assets. This script exists for ONE reason:
// to proxy Open Library API calls so they carry an identifying User-Agent and
// land in Open Library's 3 req/s tier. Browsers can't do this themselves —
// `User-Agent` is a forbidden header (silently stripped) and a custom header
// trips Open Library's CORS preflight (it returns no Access-Control-Allow-Headers),
// which would break every lookup. See issue #4. So the request is made here,
// server-side. Every non-proxy path falls through to the static Svelte SPA via
// the ASSETS binding.

const OL_ORIGIN = "https://openlibrary.org";
const API_PREFIX = "/api/ol";
const USER_AGENT = `Bookbat/${version} (info@junglestar.org; +https://bat.junglestar.org)`;

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith(`${API_PREFIX}/`)) {
      return proxyOpenLibrary(request, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function proxyOpenLibrary(request: Request, url: URL): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // The origin is hard-coded and only the path/query are taken from the
  // request, so this can only ever reach openlibrary.org — never an open proxy.
  const target = OL_ORIGIN + url.pathname.slice(API_PREFIX.length) + url.search;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
  } catch {
    return new Response("Bad Gateway", { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  // Let Cloudflare's edge cache successful metadata for an hour — a second
  // layer in front of the 30-day client-side cache. Never cache errors.
  headers.set("cache-control", upstream.ok ? "public, max-age=3600" : "no-store");

  return new Response(upstream.body, { status: upstream.status, headers });
}

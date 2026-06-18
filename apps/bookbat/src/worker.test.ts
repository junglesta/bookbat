import { beforeEach, describe, expect, it, vi } from "vitest";
import { version } from "../package.json";
import worker from "./worker";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

function makeEnv() {
  return { ASSETS: { fetch: vi.fn(async () => new Response("asset-body", { status: 200 })) } };
}

function req(path: string, init?: RequestInit) {
  return new Request(`https://bat.junglestar.org${path}`, init);
}

describe("worker Open Library proxy", () => {
  it("proxies /api/ol/* to openlibrary.org with an identifying User-Agent", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "X" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const env = makeEnv();
    const res = await worker.fetch(req("/api/ol/isbn/9780141439518.json"), env);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openlibrary.org/isbn/9780141439518.json");
    expect(init.headers["User-Agent"]).toBe(
      `Bookbat/${version} (info@junglestar.org; +https://bat.junglestar.org)`,
    );
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("preserves the path and query string when proxying", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const env = makeEnv();
    await worker.fetch(req("/api/ol/search.json?title=Dune&limit=1"), env);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://openlibrary.org/search.json?title=Dune&limit=1",
    );
  });

  it("can only ever target the openlibrary.org origin (not an open proxy)", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const env = makeEnv();
    await worker.fetch(req("/api/ol/works/OL1W.json"), env);
    expect((fetchMock.mock.calls[0][0] as string).startsWith("https://openlibrary.org/")).toBe(
      true,
    );
  });

  it("caches successful responses but never errors", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const ok = await worker.fetch(req("/api/ol/isbn/1.json"), makeEnv());
    expect(ok.headers.get("cache-control")).toBe("public, max-age=3600");

    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 404 }));
    const missing = await worker.fetch(req("/api/ol/isbn/2.json"), makeEnv());
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects non-GET proxy requests without calling upstream", async () => {
    const env = makeEnv();
    const res = await worker.fetch(req("/api/ol/isbn/x.json", { method: "POST" }), env);
    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 if the upstream fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const res = await worker.fetch(req("/api/ol/isbn/x.json"), makeEnv());
    expect(res.status).toBe(502);
  });

  it("delegates every non-API request to the static assets binding", async () => {
    const env = makeEnv();
    const res = await worker.fetch(req("/library"), env);
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    expect(await res.text()).toBe("asset-body");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

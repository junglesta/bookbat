import {
  formatWebhookClientError,
  formatWebhookError,
  getWebhookHost,
  validateWebhookUrl,
} from "./webhook";

describe("validateWebhookUrl", () => {
  it("accepts valid https URL", () => {
    const result = validateWebhookUrl("https://script.google.com/macros/s/abc/exec");
    expect(result.ok).toBe(true);
    expect(result.normalizedUrl).toBe("https://script.google.com/macros/s/abc/exec");
  });

  it("rejects empty URL", () => {
    const result = validateWebhookUrl("   ");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Please enter");
  });

  it("rejects non-https URL", () => {
    const result = validateWebhookUrl("http://example.com/hook");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("https://");
  });

  it("rejects local URLs", () => {
    const result = validateWebhookUrl("https://localhost:3000/hook");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("publicly reachable");
  });

  it("rejects URLs with credentials", () => {
    const result = validateWebhookUrl("https://user:pass@example.com/hook");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("username/password");
  });

  it("rejects Apps Script URLs that do not end with /exec", () => {
    const result = validateWebhookUrl("https://script.google.com/macros/s/abc/usercallback");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("deployment URL");
  });

  it("normalizes bare Apps Script deployment URLs to /exec", () => {
    const result = validateWebhookUrl("https://script.google.com/macros/s/abc123");
    expect(result.ok).toBe(true);
    expect(result.normalizedUrl).toBe("https://script.google.com/macros/s/abc123/exec");
  });

  it("rejects Apps Script dev URLs", () => {
    const result = validateWebhookUrl("https://script.google.com/macros/s/abc/dev");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("/dev");
  });
});

describe("getWebhookHost", () => {
  it("extracts host", () => {
    expect(getWebhookHost("https://script.google.com/macros/s/abc/exec")).toBe("script.google.com");
  });
});

describe("formatWebhookError", () => {
  it("formats plain-text response errors", async () => {
    const resp = new Response("bad request", { status: 400, statusText: "Bad Request" });
    const msg = await formatWebhookError(resp);
    expect(msg).toContain("400");
    expect(msg).toContain("bad request");
  });

  it("formats JSON response errors", async () => {
    const resp = new Response(JSON.stringify({ message: "invalid payload" }), {
      status: 422,
      statusText: "Unprocessable Entity",
      headers: { "content-type": "application/json" },
    });
    const msg = await formatWebhookError(resp);
    expect(msg).toContain("422");
    expect(msg).toContain("invalid payload");
  });
});

describe("formatWebhookClientError", () => {
  it("returns guidance for network fetch failures", () => {
    const msg = formatWebhookClientError(new TypeError("Failed to fetch"));
    expect(msg).toContain("Network request failed");
    expect(msg).toContain("/exec");
  });
});

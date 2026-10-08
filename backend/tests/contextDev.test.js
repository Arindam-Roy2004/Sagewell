// Unit tests for the Context.dev wrapper. They use a fake fetch, so they never call the
// live API and never spend credits. Run with: bun test
import { describe, test, expect, beforeEach, afterEach } from "bun:test";

// env.js validates these at import time; give it harmless values for the test run.
process.env.MONGODB_URI ||= "mongodb://localhost:27017/test";
process.env.JWTSECRET_KEY ||= "test-secret";
process.env.GEMINI_API_KEY ||= "test-gemini";

const { scrapeMarkdown, ContextDevError, isContextDevConfigured } = await import(
  "../shared/libs/contextDev.js"
);

/** Builds a fake fetch that returns the given responses in order and records each call. */
function fakeFetch(...responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const r = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (r instanceof Error) throw r;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: new Headers(r.headers || {}),
      json: async () => r.body,
    };
  };
  fn.calls = calls;
  return fn;
}

const successBody = {
  url: "https://example.com/",
  markdown: { requested: true, success: true, data: "# Example Domain\n\nSome text." },
  html: { requested: false, success: null, data: null },
  metadata: { sourceUrl: "https://example.com", finalUrl: "https://example.com/", title: "Example Domain" },
  cache_metadata: { status: "miss", age_ms: 0 },
  key_metadata: { credits_consumed: 1, credits_remaining: 999 },
  request_id: "req-123",
};

let savedKey;
beforeEach(() => {
  savedKey = process.env.CONTEXT_DEV_API_KEY;
  process.env.CONTEXT_DEV_API_KEY = "ctxt_secret_test";
});
afterEach(() => {
  if (savedKey === undefined) delete process.env.CONTEXT_DEV_API_KEY;
  else process.env.CONTEXT_DEV_API_KEY = savedKey;
});

describe("scrapeMarkdown", () => {
  test("sends the documented request and parses the Markdown output", async () => {
    const fetchImpl = fakeFetch({ status: 200, body: successBody });
    const result = await scrapeMarkdown("https://example.com", { fetchImpl });

    const [call] = fetchImpl.calls;
    expect(call.url).toBe("https://api.context.dev/v1/web/scrape");
    expect(call.init.method).toBe("POST");
    expect(call.init.headers.Authorization).toBe("Bearer ctxt_secret_test");
    expect(call.init.headers["Content-Type"]).toBe("application/json");
    expect(call.body.url).toBe("https://example.com");
    expect(call.body.formats).toEqual({ markdown: true });
    expect(call.body.markdownParams).toEqual({ includeLinks: false, includeImages: false });
    expect(call.body.timeoutOpts.behavior).toBe("fail");

    expect(result.markdown).toBe("# Example Domain\n\nSome text.");
    expect(result.title).toBe("Example Domain");
    expect(result.finalUrl).toBe("https://example.com/");
    expect(result.isPartial).toBe(false);
    expect(result.cacheStatus).toBe("miss");
    expect(result.creditsConsumed).toBe(1);
    expect(result.creditsRemaining).toBe(999);
  });

  test("throws NOT_CONFIGURED without an API key and makes no request", async () => {
    delete process.env.CONTEXT_DEV_API_KEY;
    const fetchImpl = fakeFetch({ status: 200, body: successBody });
    expect(isContextDevConfigured()).toBe(false);
    await expect(scrapeMarkdown("https://example.com", { fetchImpl })).rejects.toMatchObject({
      code: "NOT_CONFIGURED",
    });
    expect(fetchImpl.calls.length).toBe(0);
  });

  test("maps non-2xx responses to ContextDevError with code and request id", async () => {
    const fetchImpl = fakeFetch({
      status: 401,
      body: { message: "Not enough credits", error_code: "USAGE_EXCEEDED", request_id: "req-401" },
    });
    const err = await scrapeMarkdown("https://example.com", { fetchImpl }).catch((e) => e);
    expect(err).toBeInstanceOf(ContextDevError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("USAGE_EXCEEDED");
    expect(err.requestId).toBe("req-401");
    expect(fetchImpl.calls.length).toBe(1); // 4xx (other than 429) is not retried
  });

  test("retries once on 429, then succeeds", async () => {
    const fetchImpl = fakeFetch(
      { status: 429, headers: { "retry-after": "0" }, body: { error_code: "RATE_LIMITED", request_id: "r1" } },
      { status: 200, body: successBody }
    );
    const result = await scrapeMarkdown("https://example.com", { fetchImpl });
    expect(fetchImpl.calls.length).toBe(2);
    expect(result.markdown).toContain("Example Domain");
  });

  test("gives up after the retry on repeated 5xx", async () => {
    const fetchImpl = fakeFetch({ status: 503, body: { message: "Down", request_id: "r5" } });
    const err = await scrapeMarkdown("https://example.com", { fetchImpl }).catch((e) => e);
    expect(err.status).toBe(503);
    expect(fetchImpl.calls.length).toBe(2);
  });

  test("throws when the Markdown output failed", async () => {
    const fetchImpl = fakeFetch({
      status: 200,
      body: {
        ...successBody,
        isPartial: true,
        markdown: { requested: true, success: false, data: null, error_code: "WEBSITE_BLOCKED", message: "Blocked" },
      },
    });
    const err = await scrapeMarkdown("https://example.com", { fetchImpl }).catch((e) => e);
    expect(err.code).toBe("WEBSITE_BLOCKED");
    expect(err.message).toBe("Blocked");
  });

  test("throws EMPTY_RESULT when Markdown is blank", async () => {
    const fetchImpl = fakeFetch({
      status: 200,
      body: { ...successBody, markdown: { requested: true, success: true, data: "   " } },
    });
    await expect(scrapeMarkdown("https://example.com", { fetchImpl })).rejects.toMatchObject({
      code: "EMPTY_RESULT",
    });
  });

  test("wraps repeated network failures as NETWORK_ERROR", async () => {
    const fetchImpl = fakeFetch(new TypeError("fetch failed"));
    await expect(scrapeMarkdown("https://example.com", { fetchImpl })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(fetchImpl.calls.length).toBe(2);
  });
});

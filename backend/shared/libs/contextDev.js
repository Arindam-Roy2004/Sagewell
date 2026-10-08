import "./env.js";

/**
 * Context.dev web scraping (server-side only).
 *
 * Wraps POST https://api.context.dev/v1/web/scrape and returns a page as Markdown.
 * Context.dev renders pages in a real browser, so it can read JavaScript-built sites
 * that the local reader (Readability) cannot.
 *
 * Config: CONTEXT_DEV_API_KEY in backend/.env (never send it to the browser).
 * Cost: about 1 credit per scrape; cached results (see maxAgeMs) are cheaper to repeat.
 * Docs: https://docs.context.dev/api-reference/web-scraping/scrape
 */

const BASE_URL = "https://api.context.dev/v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 60000; // Context.dev's own deadline for the scrape
const MAX_ATTEMPTS = 2; // one retry on 429 / 5xx / network errors
const MAX_RETRY_WAIT_MS = 10000;

export class ContextDevError extends Error {
  constructor(message, { status = null, code = null, requestId = null } = {}) {
    super(message);
    this.name = "ContextDevError";
    this.status = status; // HTTP status, when there was a response
    this.code = code; // Context.dev error_code, e.g. RATE_LIMITED, USAGE_EXCEEDED
    this.requestId = requestId; // useful when contacting Context.dev support
  }
}

export const isContextDevConfigured = () => Boolean(process.env.CONTEXT_DEV_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wait time before a retry: honours Retry-After (seconds) on 429, otherwise 1s. Capped. */
function retryDelayMs(res) {
  const retryAfter = Number(res?.headers?.get?.("retry-after"));
  const ms = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000;
  return Math.min(ms, MAX_RETRY_WAIT_MS);
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Scrapes one URL and returns its main content as Markdown.
 *
 * @param {string} url Public http(s) URL.
 * @param {object} [options]
 * @param {number} [options.maxAgeMs] Accept a cached copy up to this old (default 1 day; 0 = always fresh).
 * @param {number} [options.timeoutMs] Scrape deadline in ms (default 60s).
 * @param {typeof fetch} [options.fetchImpl] Injectable fetch, used by tests.
 * @returns {Promise<{ markdown: string, title: string|null, finalUrl: string, isPartial: boolean,
 *   cacheStatus: string|null, creditsConsumed: number|null, creditsRemaining: number|null, requestId: string|null }>}
 * @throws {ContextDevError} on missing key, HTTP errors, or an empty/failed Markdown output.
 */
export async function scrapeMarkdown(
  url,
  { maxAgeMs = DAY_MS, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = {}
) {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) {
    throw new ContextDevError("CONTEXT_DEV_API_KEY is not set", { code: "NOT_CONFIGURED" });
  }

  const body = {
    url,
    formats: { markdown: true },
    // Links and images are noise for question answering, so leave them out of the Markdown.
    markdownParams: { includeLinks: false, includeImages: false },
    maxAgeMs,
    timeoutOpts: { milliseconds: timeoutMs, behavior: "fail" },
  };

  let res;
  let payload;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetchImpl(`${BASE_URL}/web/scrape`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        // Our own safety net, a little longer than Context.dev's deadline.
        signal: AbortSignal.timeout(timeoutMs + 15000),
      });
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(1000);
        continue;
      }
      throw new ContextDevError(`Could not reach Context.dev: ${err.message}`, { code: "NETWORK_ERROR" });
    }

    payload = await readJson(res);
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      await sleep(retryDelayMs(res));
      continue;
    }
    break;
  }

  if (!res.ok) {
    throw new ContextDevError(payload?.message || `Context.dev responded with HTTP ${res.status}`, {
      status: res.status,
      code: payload?.error_code || null,
      requestId: payload?.request_id || null,
    });
  }

  const output = payload?.markdown;
  const markdown = typeof output?.data === "string" ? output.data.trim() : "";
  if (!output?.success || !markdown) {
    throw new ContextDevError(output?.message || "Context.dev returned no Markdown for this page", {
      status: res.status,
      code: output?.error_code || "EMPTY_RESULT",
      requestId: payload?.request_id || null,
    });
  }

  return {
    markdown,
    title: payload.metadata?.title?.trim() || null,
    finalUrl: payload.metadata?.finalUrl || payload.url || url,
    isPartial: Boolean(payload.isPartial),
    cacheStatus: payload.cache_metadata?.status ?? null,
    creditsConsumed: payload.key_metadata?.credits_consumed ?? null,
    creditsRemaining: payload.key_metadata?.credits_remaining ?? null,
    requestId: payload.request_id ?? null,
  };
}

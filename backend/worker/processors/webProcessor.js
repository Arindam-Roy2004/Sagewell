import { Document } from "@langchain/core/documents";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import http from "http";
import https from "https";
import zlib from "zlib";
import { assertSafeUrl, safeLookup } from "../../shared/libs/urlGuard.js";
import { isContextDevConfigured, scrapeMarkdown } from "../../shared/libs/contextDev.js";

const FETCH_TIMEOUT_MS = 45000; // large pages (e.g. a 1.4 MB Wikipedia article) can be slow
const FETCH_ATTEMPTS = 2; // retry once on network errors / timeouts
const MAX_REDIRECTS = 5;
const MAX_BYTES = 10 * 1024 * 1024; // refuse pages larger than 10 MB
const MIN_ARTICLE_CHARS = 200; // below this, Readability probably failed; use the fallback
// Many sites (Wikipedia included) ask automated clients to identify themselves.
const USER_AGENT = "SagewellBot/1.0 (document ingestion; contact: set-your-email@example.com)";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.remove(["script", "style", "noscript"]);
// For question answering, link URLs and images are noise (and cost extra embedding time).
// Keep the link text, drop the URL; keep image alt text only.
turndown.addRule("plainLinks", {
  filter: "a",
  replacement: (content) => content,
});
turndown.addRule("altTextImages", {
  filter: "img",
  replacement: (_content, node) => {
    const alt = (node.getAttribute("alt") || "").trim();
    return alt ? `${alt}` : "";
  },
});

const tooLarge = () => new Error("This page is too large to process");

/** Picks a decoder for the response's Content-Encoding (identity when absent or unknown). */
function decoderFor(encoding) {
  switch ((encoding || "").trim().toLowerCase()) {
    case "gzip":
    case "x-gzip":
      return zlib.createGunzip();
    case "deflate":
      return zlib.createInflate();
    case "br":
      return zlib.createBrotliDecompress();
    default:
      return null;
  }
}

/**
 * One HTTP(S) GET, no redirect following. The socket connects through `safeLookup`, so the
 * SSRF check runs on the exact IP we connect to; a DNS answer that changes after the early
 * `assertSafeUrl` check (DNS rebinding) cannot reach an internal address.
 *
 * Resolves with { status, headers, body? }. The body (decompressed, capped at MAX_BYTES) is
 * read only for a 2xx HTML/XML response; for anything else it is discarded.
 */
function requestOnce(url) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const req = client.get(
      url,
      {
        lookup: safeLookup,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Encoding": "gzip, deflate, br",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const headers = res.headers;
        const contentType = String(headers["content-type"] || "");
        const wantBody = status >= 200 && status < 300 && /html|xml/i.test(contentType);

        if (!wantBody) {
          res.resume(); // drain and discard
          return finish(resolve, { status, headers });
        }

        const declaredLength = Number(headers["content-length"]);
        if (declaredLength > MAX_BYTES) {
          req.destroy();
          return finish(reject, tooLarge());
        }

        // Cap the DECOMPRESSED size too, so a small compressed bomb can't exhaust memory.
        const decoder = decoderFor(headers["content-encoding"]);
        const stream = decoder ? res.pipe(decoder) : res;
        const chunks = [];
        let total = 0;

        stream.on("data", (chunk) => {
          total += chunk.length;
          if (total > MAX_BYTES) {
            req.destroy();
            decoder?.destroy();
            return finish(reject, tooLarge());
          }
          chunks.push(chunk);
        });
        stream.on("end", () => finish(resolve, { status, headers, body: Buffer.concat(chunks) }));
        stream.on("error", (err) => finish(reject, err));
        res.on("error", (err) => finish(reject, err));
      }
    );

    const timer = setTimeout(() => {
      req.destroy();
      finish(reject, new Error("The page took too long to respond"));
    }, FETCH_TIMEOUT_MS);

    req.on("error", (err) => finish(reject, err));
  });
}

/**
 * Downloads a page's HTML. Redirects are followed by hand so EVERY hop passes the SSRF guard;
 * otherwise a public URL could redirect the server to an internal address.
 */
async function fetchHtml(startUrl) {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeUrl(current);

    let res;
    for (let attempt = 1; ; attempt++) {
      try {
        res = await requestOnce(url);
        break;
      } catch (err) {
        // A blocked address or an oversized page will not change on retry.
        if (err.code === "ESSRFBLOCKED") {
          throw new Error(err.message || "This URL cannot be processed");
        }
        if (attempt >= FETCH_ATTEMPTS || err.message === tooLarge().message) throw err;
      }
    }

    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).toString();
      continue;
    }

    if (res.status < 200 || res.status >= 300) throw new Error(`The page responded with HTTP ${res.status}`);

    const contentType = String(res.headers["content-type"] || "");
    if (!/html|xml/i.test(contentType)) {
      throw new Error(
        `Unsupported content type (${contentType || "unknown"}). Only web pages are supported; upload PDFs and other documents as files.`
      );
    }

    const buffer = res.body;
    const charset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().replace(/^"|"$/g, "") || "utf-8";
    let html;
    try {
      html = new TextDecoder(charset).decode(buffer);
    } catch {
      html = new TextDecoder("utf-8").decode(buffer);
    }
    return { html, finalUrl: current };
  }

  throw new Error("Too many redirects");
}

/**
 * Extracts the main readable content of a page as Markdown.
 *
 * 1. Mozilla Readability (the algorithm behind Firefox Reader View) finds the article and drops
 *    menus, sidebars, ads, footers and scripts.
 * 2. If it finds too little (e.g. a very small or unusual page), fall back to the page body with
 *    the obvious clutter tags removed.
 * 3. Turndown converts the HTML to Markdown, keeping headings, lists, links and code blocks, which
 *    gives the chunker and the AI cleaner, better-structured text.
 */
function extractMarkdown(html, url) {
  // A silent console keeps jsdom from printing noisy CSS-parse warnings from real-world pages.
  const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
  try {
    const doc = dom.window.document;
    const pageTitle = doc.title?.trim() || "";

    let article = null;
    try {
      // Readability modifies the document it is given, so give it a copy.
      article = new Readability(doc.cloneNode(true)).parse();
    } catch {
      article = null;
    }

    let contentHtml;
    let title = pageTitle;
    if (article?.content && (article.textContent || "").trim().length >= MIN_ARTICLE_CHARS) {
      contentHtml = article.content;
      title = article.title?.trim() || pageTitle;
    } else {
      doc
        .querySelectorAll("script,style,noscript,nav,header,footer,aside,form,iframe,svg")
        .forEach((node) => node.remove());
      contentHtml = doc.body?.innerHTML || "";
    }

    const markdown = turndown
      .turndown(contentHtml)
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { title, markdown };
  } finally {
    dom.window.close();
  }
}

/** Local reader: download the HTML ourselves and extract the article with Readability. */
async function readLocally(url) {
  const { html, finalUrl } = await fetchHtml(url);
  const { title, markdown } = extractMarkdown(html, finalUrl);

  if (!markdown) {
    throw new Error(
      "No readable text found on this page. It may need JavaScript, a login, or have no text content."
    );
  }
  return { title, markdown, finalUrl };
}

/**
 * Turns a URL into a LangChain Document.
 *
 * 1. If CONTEXT_DEV_API_KEY is set, use Context.dev (renders JavaScript, handles more sites).
 * 2. If that is not configured or fails for any reason (credits, rate limit, timeout, empty
 *    result), fall back to the free local reader.
 */
export async function processWeb(url) {
  // Reject private/internal addresses up front, whichever reader ends up fetching the page.
  await assertSafeUrl(url);

  let page = null;
  if (isContextDevConfigured()) {
    try {
      const result = await scrapeMarkdown(url);
      page = { title: result.title, markdown: result.markdown, finalUrl: result.finalUrl };
      console.log(
        `🌐 Context.dev scrape OK (cache: ${result.cacheStatus}, credits used: ${result.creditsConsumed}, remaining: ${result.creditsRemaining})`
      );
    } catch (err) {
      console.warn(
        `⚠️ Context.dev scrape failed (${err.code || "ERROR"}: ${err.message}); using the local reader instead`
      );
    }
  }

  if (!page) page = await readLocally(url);
  const { title, finalUrl } = page;
  const markdown = page.markdown;

  // Page title, falling back to the hostname.
  let pageTitle = title;
  if (!pageTitle) {
    try {
      pageTitle = new URL(finalUrl).hostname;
    } catch {
      pageTitle = "Web Article";
    }
  }

  return [
    new Document({
      pageContent: markdown,
      metadata: {
        sourceType: "link",
        originalFileName: pageTitle.trim(),
        url,
        pageNumber: 1,
        headingHierarchy: [],
      },
    }),
  ];
}

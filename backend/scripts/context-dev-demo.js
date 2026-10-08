// Live check of the Context.dev integration. Makes ONE real request (about 1 credit;
// repeats within a day are usually served from Context.dev's cache).
//
// Usage (from backend/):
//   bun run demo:context-dev                      # scrapes https://example.com
//   bun run demo:context-dev https://some.site/page
import "../shared/libs/env.js";
import { isContextDevConfigured, scrapeMarkdown } from "../shared/libs/contextDev.js";

const url = process.argv[2] || "https://example.com";

if (!isContextDevConfigured()) {
  console.error("❌ CONTEXT_DEV_API_KEY is not set in backend/.env");
  process.exit(1);
}

try {
  const started = Date.now();
  const r = await scrapeMarkdown(url);
  console.log(`✅ Scraped ${url} in ${Date.now() - started} ms`);
  console.log(`   title:     ${r.title}`);
  console.log(`   final URL: ${r.finalUrl}`);
  console.log(`   length:    ${r.markdown.length} characters (partial: ${r.isPartial})`);
  console.log(`   cache:     ${r.cacheStatus}`);
  console.log(`   credits:   used ${r.creditsConsumed}, remaining ${r.creditsRemaining}`);
  console.log(`   request:   ${r.requestId}`);
  console.log("--- first 400 characters ---");
  console.log(r.markdown.slice(0, 400));
  process.exit(0);
} catch (err) {
  console.error(`❌ ${err.name}: ${err.message}`);
  if (err.code) console.error(`   code: ${err.code}`);
  if (err.status) console.error(`   HTTP: ${err.status}`);
  if (err.requestId) console.error(`   request: ${err.requestId}`);
  process.exit(1);
}

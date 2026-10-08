// Scrapes a website with the official Context.dev SDK and saves it as a local DESIGN REFERENCE
// (HTML, Markdown, light + dark full-page screenshots). Used to study a landing page's layout.
//
// Output goes to backend/design-reference/<name>/ which is git-ignored: reference material
// only, never committed or shipped.
//
// Usage (from backend/):
//   bun run scrape:design
//   bun run scrape:design <url> <name>
//
// Cost: two requests (light: html + markdown + screenshot; dark: screenshot only).
import "../shared/libs/env.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ContextDev, APIError } from "context.dev";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_URL = "https://notus-agent-marketing-template.vercel.app/";
const DEFAULT_NAME = "notus";

const sharedParams = (theme) => ({
  viewport: { width: 1440, height: 900 },
  theme,
  waitFor: 2000, // let entrance animations and lazy images settle
});
const timeoutOpts = { milliseconds: 90000, behavior: "fail" };

/** Returns an output's data, or null with a warning when it was not returned. */
function readOutput(response, key, warnings) {
  const out = response?.[key];
  if (!out?.requested) return null;
  if (!out.success) {
    warnings.push(`${key}: ${out.error_code || "FAILED"}${out.message ? ` - ${out.message}` : ""}`);
    return null;
  }
  if (out.data == null || (typeof out.data === "string" && !out.data.trim())) {
    warnings.push(`${key}: empty result`);
    return null;
  }
  return out.data;
}

/** Decodes a "data:image/png;base64,..." string into { buffer, ext }. */
export function decodeDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) throw new Error("Screenshot is not a base64 image data URL");
  return { buffer: Buffer.from(match[2], "base64"), ext: match[1] === "jpeg" ? "jpg" : match[1] };
}

/**
 * Runs the two scrapes and writes the reference files.
 * The client is injected so tests can pass a fake one (no live calls, no credits).
 */
export async function scrapeDesignReference({ client, url = DEFAULT_URL, outDir }) {
  const warnings = [];
  const written = [];
  await fs.mkdir(outDir, { recursive: true });

  const light = await client.web.scrape({
    url,
    formats: { html: true, markdown: true, screenshot: true },
    screenshotParams: { area: "fullPage", format: "png" },
    sharedParams: sharedParams("light"),
    timeoutOpts,
  });

  const dark = await client.web.scrape({
    url,
    formats: { screenshot: true },
    screenshotParams: { area: "fullPage", format: "png" },
    sharedParams: sharedParams("dark"),
    timeoutOpts,
  });

  if (light?.isPartial) warnings.push("light request: partial result (some outputs failed)");
  if (dark?.isPartial) warnings.push("dark request: partial result (some outputs failed)");

  const save = async (name, content) => {
    await fs.writeFile(path.join(outDir, name), content);
    written.push(name);
  };

  const html = readOutput(light, "html", warnings);
  if (html) await save("page.html", html);

  const markdown = readOutput(light, "markdown", warnings);
  if (markdown) await save("page.md", markdown);

  for (const [theme, response] of [["light", light], ["dark", dark]]) {
    const shot = readOutput(response, "screenshot", warnings);
    if (!shot) continue;
    try {
      const { buffer, ext } = decodeDataUrl(shot);
      await save(`screenshot-${theme}.${ext}`, buffer);
    } catch (err) {
      warnings.push(`screenshot (${theme}): ${err.message}`);
    }
  }

  const meta = {
    url,
    scrapedAt: new Date().toISOString(),
    title: light?.metadata?.title ?? null,
    finalUrl: light?.metadata?.finalUrl ?? light?.url ?? url,
    requests: [light, dark].map((r) => ({
      requestId: r?.request_id ?? null,
      cache: r?.cache_metadata?.status ?? null,
      creditsConsumed: r?.key_metadata?.credits_consumed ?? null,
      creditsRemaining: r?.key_metadata?.credits_remaining ?? null,
      isPartial: Boolean(r?.isPartial),
    })),
    files: [...written],
    warnings,
  };
  await save("meta.json", JSON.stringify(meta, null, 2));

  if (written.length === 1) {
    // Only meta.json: nothing useful came back.
    throw new Error(`No content was returned. ${warnings.join("; ")}`);
  }
  return meta;
}

async function main() {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) {
    console.error("❌ CONTEXT_DEV_API_KEY is not set in backend/.env");
    process.exit(1);
  }
  const url = process.argv[2] || DEFAULT_URL;
  const name = process.argv[3] || DEFAULT_NAME;
  const outDir = path.resolve(__dirname, "..", "design-reference", name);

  // Starting configuration from the Context.dev dashboard request, with the key from the env.
  const client = new ContextDev({ apiKey, timeout: 120000, maxRetries: 2 });

  console.log(`Scraping ${url} -> ${path.relative(process.cwd(), outDir)}/`);
  try {
    const meta = await scrapeDesignReference({ client, url, outDir });
    console.log(`✅ Saved: ${meta.files.join(", ")}`);
    for (const r of meta.requests) {
      console.log(`   request ${r.requestId}: cache ${r.cache}, credits used ${r.creditsConsumed}, remaining ${r.creditsRemaining}`);
    }
    if (meta.warnings.length) console.log(`⚠️  ${meta.warnings.join("\n⚠️  ")}`);
  } catch (err) {
    if (err instanceof APIError) {
      console.error(`❌ Context.dev error (HTTP ${err.status}): ${err.error?.error_code || ""} ${err.error?.message || err.message}`);
      if (err.error?.request_id) console.error(`   request: ${err.error.request_id}`);
    } else {
      console.error(`❌ ${err.message}`);
    }
    process.exit(1);
  }
}

if (import.meta.main) await main();

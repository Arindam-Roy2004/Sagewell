// Tests for the design-reference scraper. Uses a fake Context.dev client: no live calls, no credits.
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";

process.env.MONGODB_URI ||= "mongodb://localhost:27017/test";
process.env.JWTSECRET_KEY ||= "test-secret";
process.env.GEMINI_API_KEY ||= "test-gemini";

const { scrapeDesignReference, decodeDataUrl } = await import("../scripts/scrape-design-reference.js");

const PNG = "data:image/png;base64," + Buffer.from("fake-png-bytes").toString("base64");
const out = (data, extra = {}) => ({ requested: true, success: true, data, ...extra });
const notRequested = { requested: false, success: null, data: null };

const lightResponse = {
  url: "https://example.com/",
  html: out("<html><body>Hi</body></html>"),
  markdown: out("# Hi"),
  screenshot: out(PNG),
  metadata: { title: "Example", finalUrl: "https://example.com/" },
  cache_metadata: { status: "miss" },
  key_metadata: { credits_consumed: 3, credits_remaining: 996 },
  request_id: "req-light",
};
const darkResponse = {
  url: "https://example.com/",
  html: notRequested,
  markdown: notRequested,
  screenshot: out(PNG),
  cache_metadata: { status: "miss" },
  key_metadata: { credits_consumed: 2, credits_remaining: 994 },
  request_id: "req-dark",
};

function fakeClient(...responses) {
  const calls = [];
  return {
    calls,
    web: {
      scrape: async (body) => {
        calls.push(body);
        const r = responses[calls.length - 1];
        if (r instanceof Error) throw r;
        return r;
      },
    },
  };
}

let outDir;
beforeEach(async () => {
  outDir = await fs.mkdtemp(path.join(os.tmpdir(), "design-ref-"));
});
afterEach(async () => {
  await fs.rm(outDir, { recursive: true, force: true });
});

describe("scrapeDesignReference", () => {
  test("sends the light and dark requests and writes every file", async () => {
    const client = fakeClient(lightResponse, darkResponse);
    const meta = await scrapeDesignReference({ client, url: "https://example.com/", outDir });

    expect(client.calls[0].formats).toEqual({ html: true, markdown: true, screenshot: true });
    expect(client.calls[0].screenshotParams).toEqual({ area: "fullPage", format: "png" });
    expect(client.calls[0].sharedParams.theme).toBe("light");
    expect(client.calls[1].formats).toEqual({ screenshot: true });
    expect(client.calls[1].sharedParams.theme).toBe("dark");

    const files = (await fs.readdir(outDir)).sort();
    expect(files).toEqual(["meta.json", "page.html", "page.md", "screenshot-dark.png", "screenshot-light.png"]);
    expect(await fs.readFile(path.join(outDir, "screenshot-light.png"), "utf8")).toBe("fake-png-bytes");
    expect(meta.title).toBe("Example");
    expect(meta.requests.map((r) => r.creditsConsumed)).toEqual([3, 2]);
    expect(meta.warnings).toEqual([]);
  });

  test("records partial results and failed outputs as warnings", async () => {
    const partialDark = {
      ...darkResponse,
      isPartial: true,
      screenshot: { requested: true, success: false, data: null, error_code: "REQUEST_TIMEOUT", message: "Too slow" },
    };
    const meta = await scrapeDesignReference({ client: fakeClient(lightResponse, partialDark), outDir });
    expect(meta.files).not.toContain("screenshot-dark.png");
    expect(meta.warnings.join(" ")).toContain("partial");
    expect(meta.warnings.join(" ")).toContain("REQUEST_TIMEOUT");
  });

  test("throws when nothing useful comes back", async () => {
    const empty = { ...lightResponse, html: out("  "), markdown: out(""), screenshot: out(null) };
    const emptyDark = { ...darkResponse, screenshot: out(null) };
    await expect(scrapeDesignReference({ client: fakeClient(empty, emptyDark), outDir })).rejects.toThrow(
      "No content was returned"
    );
  });

  test("propagates request errors", async () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    await expect(scrapeDesignReference({ client: fakeClient(err), outDir })).rejects.toThrow("Unauthorized");
  });
});

describe("decodeDataUrl", () => {
  test("decodes base64 image data URLs", () => {
    const { buffer, ext } = decodeDataUrl("data:image/jpeg;base64," + Buffer.from("x").toString("base64"));
    expect(ext).toBe("jpg");
    expect(buffer.toString()).toBe("x");
  });
  test("rejects anything else", () => {
    expect(() => decodeDataUrl("not-an-image")).toThrow();
  });
});

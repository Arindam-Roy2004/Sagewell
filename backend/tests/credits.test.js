// Tests for credit pricing and the per-request usage meter. Pure functions, no network or DB.
import { describe, test, expect } from "bun:test";

import {
  toMicros,
  toCredits,
  llmCostMicros,
  embeddingCostMicros,
  ingestCostMicros,
  estimateTokens,
  PRICING,
  STARTING_CREDITS,
  COST_MARKUP,
  MAX_PRICE,
} from "../shared/libs/pricing.js";
import { usageStore, createMeter, recordLlmUsage, recordEmbeddingChars } from "../shared/libs/usageMeter.js";

describe("pricing", () => {
  test("credits and micros convert both ways", () => {
    expect(toMicros(1)).toBe(1000);
    expect(toCredits(2500)).toBe(2.5);
    expect(toCredits(toMicros(7.25))).toBe(7.25);
  });

  test("llm cost follows the per-million token price plus markup", () => {
    // 1M tokens of deepseek-v4-flash is billed at the price cap: $0.20 in, $0.60 out.
    expect(llmCostMicros("deepseek/deepseek-v4-flash", 1_000_000, 0)).toBeCloseTo(MAX_PRICE.input * 1_000_000 * COST_MARKUP);
    expect(llmCostMicros("deepseek/deepseek-v4-flash", 0, 1_000_000)).toBeCloseTo(MAX_PRICE.output * 1_000_000 * COST_MARKUP);
  });

  test("an unknown model is billed at the price cap, never for free", () => {
    expect(llmCostMicros("some-new-model", 1000, 1000)).toBeGreaterThan(0);
    expect(llmCostMicros("some-new-model", 1000, 1000)).toBe(llmCostMicros("deepseek/deepseek-v4-flash", 1000, 1000));
  });

  test("embedding cost scales with tokens", () => {
    expect(embeddingCostMicros(1_000_000)).toBeCloseTo(150_000 * COST_MARKUP);
  });

  test("a typical answer costs a few credits, so the hold covers it", () => {
    // ~6k tokens in, ~1k out on the main model, plus ~4 small calls.
    const answer = llmCostMicros("deepseek/deepseek-v4-flash", 6000, 1000) + 4 * llmCostMicros("deepseek/deepseek-v4-flash", 2000, 200);
    const credits = toCredits(answer) + PRICING.chatOverhead;
    expect(credits).toBeGreaterThan(1);
    expect(credits).toBeLessThan(PRICING.chatReserve);
  });

  test("a new account can afford some of everything", () => {
    expect(STARTING_CREDITS).toBeGreaterThan(PRICING.chatReserve * 5);
    expect(toCredits(ingestCostMicros(100_000))).toBeLessThan(STARTING_CREDITS / 4);
  });

  test("ingest estimate grows with document size and adds the link fee", () => {
    expect(ingestCostMicros(400_000)).toBeGreaterThan(ingestCostMicros(4_000));
    expect(ingestCostMicros(4_000, { link: true })).toBe(ingestCostMicros(4_000) + toMicros(PRICING.linkFlat));
  });

  test("token estimate rounds up", () => {
    expect(estimateTokens(1)).toBe(1);
    expect(estimateTokens(0)).toBe(0);
  });
});

describe("usage meter", () => {
  test("records nothing outside a scope", () => {
    expect(() => recordLlmUsage({ model: "deepseek/deepseek-v4-flash", inputTokens: 10, outputTokens: 10 })).not.toThrow();
  });

  test("accumulates llm and embedding usage inside a scope", async () => {
    const meter = createMeter({ userId: "u1" });
    await usageStore.run(meter, async () => {
      recordLlmUsage({ model: "deepseek/deepseek-v4-flash", inputTokens: 1000, outputTokens: 500 });
      await Promise.resolve(); // survives async hops
      recordEmbeddingChars(3000);
    });
    expect(meter.calls).toBe(2);
    expect(meter.micros).toBeCloseTo(llmCostMicros("deepseek/deepseek-v4-flash", 1000, 500) + embeddingCostMicros(1000));
  });

  test("concurrent scopes do not mix", async () => {
    const a = createMeter();
    const b = createMeter();
    await Promise.all([
      usageStore.run(a, async () => {
        await new Promise((r) => setTimeout(r, 5));
        recordLlmUsage({ model: "deepseek/deepseek-v4-flash", inputTokens: 100, outputTokens: 0 });
      }),
      usageStore.run(b, async () => {
        recordLlmUsage({ model: "deepseek/deepseek-v4-flash", inputTokens: 200, outputTokens: 0 });
      }),
    ]);
    expect(a.inputTokens).toBe(100);
    expect(b.inputTokens).toBe(200);
  });
});

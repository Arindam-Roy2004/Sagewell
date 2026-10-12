import { AsyncLocalStorage } from "node:async_hooks";
import { llmCostMicros, embeddingCostMicros, estimateTokens } from "./pricing.js";

/**
 * Per-request usage meter.
 *
 * A request (or worker job) runs inside `usageStore.run(meter, ...)`. Anything below it that
 * calls Gemini (`run()` in llm.js, the wrapped embeddings) adds its cost to that meter, so the
 * caller can charge exactly what the request used without threading a user id through every
 * retrieval function. Outside a scope (scripts, evals) recording is a no-op.
 */
export const usageStore = new AsyncLocalStorage();

export function createMeter(info = {}) {
  return { ...info, micros: 0, calls: 0, inputTokens: 0, outputTokens: 0 };
}

export const currentMeter = () => usageStore.getStore();

export function recordLlmUsage({ model, inputTokens = 0, outputTokens = 0 }) {
  const meter = usageStore.getStore();
  if (!meter) return;
  meter.micros += llmCostMicros(model, inputTokens, outputTokens);
  meter.inputTokens += inputTokens;
  meter.outputTokens += outputTokens;
  meter.calls += 1;
}

export function recordEmbeddingChars(chars) {
  const meter = usageStore.getStore();
  if (!meter) return;
  const tokens = estimateTokens(chars);
  meter.micros += embeddingCostMicros(tokens);
  meter.inputTokens += tokens;
  meter.calls += 1;
}

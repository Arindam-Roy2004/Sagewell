import "./env.js";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText, Output } from "ai";
import { recordLlmUsage } from "./usageMeter.js";
import { estimateTokens, MAX_PRICE } from "./pricing.js";

/**
 * LLM agent runner, built on the AI SDK's OpenAI-compatible provider pointed at OpenRouter.
 *
 * An `Agent` is a named prompt (system instructions + model + optional zod output schema).
 * `run(agent, prompt)` returns `{ finalOutput }`: the parsed object when the agent has an
 * `outputType`, otherwise plain text. `run(agent, prompt, { stream: true, signal })`
 * returns an object whose `toTextStream()` yields text chunks as they arrive.
 *
 * Models (OpenRouter ids, override in backend/.env):
 *   LLM_MODEL_MAIN  - answers, re-ranking, grading, routing, evaluation
 *   LLM_MODEL_LIGHT - quick tasks: query rewriting, summaries
 */
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: { "X-Title": "Sagewell" },
  includeUsage: true,
  supportsStructuredOutputs: true,
  // Provider routing: never pay more than the cap (USD per 1M tokens) that pricing.js bills
  // at, prefer the fastest provider under it (the default pick streams ~40 tok/s, the fastest
  // ~65), and send structured-output calls only to providers that honour json_schema.
  transformRequestBody: (body) => ({
    ...body,
    provider: {
      max_price: { prompt: MAX_PRICE.input, completion: MAX_PRICE.output },
      sort: "throughput",
      ...(body.response_format ? { require_parameters: true } : {}),
    },
  }),
});

/**
 * Reasoning ("thinking") adds 2-3s to every call, even trivial ones, and the chat pipeline
 * makes several calls in a row before the answer starts. So it is off unless an agent asks
 * for it: "off" | "low" | "medium" | "high".
 */
function reasoningOptions(level) {
  return { openrouter: { reasoning: level && level !== "off" ? { effort: level } : { enabled: false } } };
}

export const MODELS = {
  main: process.env.LLM_MODEL_MAIN || "deepseek/deepseek-v4-flash",
  light: process.env.LLM_MODEL_LIGHT || "deepseek/deepseek-v4-flash",
};

/** Accepts a tier name ("main" / "light") or a full OpenRouter model id. */
export function resolveModelName(model) {
  return MODELS[model] || model || MODELS.main;
}

export function getModel(model) {
  return openrouter.chatModel(resolveModelName(model));
}

// Optional lifecycle hooks (see src/utils/traceMiddleware.js). Hook errors never break a run.
const traceProcessors = new Set();

export function addTraceProcessor(processor) {
  if (processor) traceProcessors.add(processor);
}

async function notify(hook, payload) {
  for (const processor of traceProcessors) {
    if (typeof processor[hook] !== "function") continue;
    try {
      await processor[hook](payload);
    } catch {
      // tracing must never affect the request
    }
  }
}

// Reports one finished model call to the active credit meter (see usageMeter.js).
// `outputTokens` already includes reasoning tokens, which are billed as output.
function meterUsage(model, usage) {
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? Math.max(0, (usage?.totalTokens ?? 0) - inputTokens);
  recordLlmUsage({ model, inputTokens, outputTokens });
}

// Wraps a text stream so its usage is metered exactly once, even if the client aborts: the
// provider's own count when it arrives, otherwise an estimate from the characters seen.
async function* meteredTextStream(result, { model, promptChars, state }) {
  let outChars = 0;
  try {
    for await (const chunk of result.textStream) {
      outChars += chunk.length;
      yield chunk;
    }
  } finally {
    if (!state.recorded) {
      const usage = await Promise.race([
        Promise.resolve(result.totalUsage ?? result.usage).catch(() => null),
        new Promise((resolve) => setTimeout(resolve, 1500, null)),
      ]);
      if (!state.recorded) {
        state.recorded = true;
        if (usage) meterUsage(model, usage);
        else recordLlmUsage({ model, inputTokens: estimateTokens(promptChars), outputTokens: estimateTokens(outChars) });
      }
    }
  }
}

export class Agent {
  constructor({ name, model, instructions, outputType, reasoning } = {}) {
    this.name = name || "llm-agent";
    this.reasoning = reasoning || "off";
    this.model = resolveModelName(model);
    this.instructions = instructions || "";
    this.outputType = outputType || null;
  }
}

export async function run(agent, prompt, options = {}) {
  const modelName = agent.model;
  const model = openrouter.chatModel(modelName);
  const system = agent.instructions || undefined;
  const providerOptions = reasoningOptions(agent.reasoning);
  const signal = options.signal;

  await notify("onSpanStart", { agent: agent.name, model: modelName, prompt });

  try {
    if (options.stream) {
      const state = { recorded: false };
      const result = streamText({
        model,
        system,
        prompt,
        abortSignal: signal,
        providerOptions,
        onEnd: (event) => {
          if (state.recorded) return;
          state.recorded = true;
          meterUsage(modelName, event?.totalUsage ?? event?.usage);
        },
        // streamText reports failures here instead of throwing; log them so a broken
        // stream is visible in the API logs (the caller sees the stream end early).
        onError: ({ error }) => {
          if (signal?.aborted) return;
          console.error(`❌ [${agent.name}] LLM stream error:`, error?.message || error);
        },
      });
      return {
        stream: result,
        get textStream() {
          return this.toTextStream();
        },
        toTextStream() {
          return meteredTextStream(result, {
            model: modelName,
            promptChars: (system?.length || 0) + prompt.length,
            state,
          });
        },
      };
    }

    if (agent.outputType) {
      const result = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema: agent.outputType }),
        abortSignal: signal,
        providerOptions,
      });
      meterUsage(modelName, result.usage);
      await notify("onSpanEnd", { agent: agent.name, output: result.output });
      return { finalOutput: result.output, usage: result.usage };
    }

    const result = await generateText({ model, system, prompt, abortSignal: signal, providerOptions });
    meterUsage(modelName, result.usage);
    await notify("onSpanEnd", { agent: agent.name, output: result.text });
    return { finalOutput: result.text, usage: result.usage };
  } catch (error) {
    await notify("onSpanEnd", { agent: agent.name, error });
    throw error;
  }
}

export { openrouter };

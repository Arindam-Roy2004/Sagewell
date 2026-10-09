import "./env.js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, Output } from "ai";

/**
 * Gemini agent runner, built on the AI SDK's Google provider.
 *
 * An `Agent` is a named prompt (system instructions + model + optional zod output schema).
 * `run(agent, prompt)` returns `{ finalOutput }`: the parsed object when the agent has an
 * `outputType`, otherwise plain text. `run(agent, prompt, { stream: true, signal })`
 * returns an object whose `toTextStream()` yields text chunks as they arrive.
 *
 * Models (override in backend/.env):
 *   GEMINI_MODEL_MAIN  - answers, re-ranking, grading, routing, evaluation
 *   GEMINI_MODEL_LIGHT - quick tasks: query rewriting, summaries
 */
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  main: process.env.GEMINI_MODEL_MAIN || "gemini-3.8-flash",
  light: process.env.GEMINI_MODEL_LIGHT || "gemini-3.5-flash-lite",
};

/** Accepts a tier name ("main" / "light") or a full Gemini model id. */
export function resolveModelName(model) {
  return MODELS[model] || model || MODELS.main;
}

export function getGoogleModel(model) {
  return google(resolveModelName(model));
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

export class Agent {
  constructor({ name, model, instructions, outputType } = {}) {
    this.name = name || "gemini-agent";
    this.model = resolveModelName(model);
    this.instructions = instructions || "";
    this.outputType = outputType || null;
  }
}

export async function run(agent, prompt, options = {}) {
  const modelName = agent.model;
  const model = google(modelName);
  const system = agent.instructions || undefined;
  const signal = options.signal;

  await notify("onSpanStart", { agent: agent.name, model: modelName, prompt });

  try {
    if (options.stream) {
      const result = streamText({
        model,
        system,
        prompt,
        abortSignal: signal,
        // streamText reports failures here instead of throwing; log them so a broken
        // stream is visible in the API logs (the caller sees the stream end early).
        onError: ({ error }) => {
          if (signal?.aborted) return;
          console.error(`❌ [${agent.name}] Gemini stream error:`, error?.message || error);
        },
      });
      return {
        stream: result,
        textStream: result.textStream,
        toTextStream() {
          return result.textStream;
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
      });
      await notify("onSpanEnd", { agent: agent.name, output: result.output });
      return { finalOutput: result.output, usage: result.usage };
    }

    const result = await generateText({ model, system, prompt, abortSignal: signal });
    await notify("onSpanEnd", { agent: agent.name, output: result.text });
    return { finalOutput: result.text, usage: result.usage };
  } catch (error) {
    await notify("onSpanEnd", { agent: agent.name, error });
    throw error;
  }
}

export { google };

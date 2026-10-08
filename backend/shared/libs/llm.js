import "./env.js";
import { setDefaultModelProvider, setTracingDisabled } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions/ai-sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Routes every `Agent({ model: "..." })` call in the app to Google Gemini.
 *
 * The agents in this codebase still name OpenAI models ("gpt-4.1-mini", "gpt-4.1-nano").
 * Instead of editing ~16 files, this provider maps those names to Gemini models in one place.
 * Embeddings (search vectors) are separate: see shared/libs/embeddings.js.
 *
 * Override the Gemini models in .env if you want different ones:
 *   GEMINI_MODEL_MAIN  - answers, rerank, grading, routing (default: gemini-3.8-flash)
 *   GEMINI_MODEL_LIGHT - cheap/fast tasks like summaries   (default: gemini-3.5-flash-lite)
 */
// The Agents SDK normally uploads a log of every agent run to OpenAI's dashboard. We use Gemini and
// have no OpenAI key, so turn that off (otherwise it prints "No API key provided for OpenAI tracing
// exporter" after every run). The app's own observability traces do not depend on this.
setTracingDisabled(true);

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const MAIN_MODEL = process.env.GEMINI_MODEL_MAIN || "gemini-3.8-flash";
const LIGHT_MODEL = process.env.GEMINI_MODEL_LIGHT || "gemini-3.5-flash-lite";

const MODEL_MAP = {
  "gpt-4.1-mini": MAIN_MODEL,
  "gpt-4.1-nano": LIGHT_MODEL,
};

setDefaultModelProvider({
  getModel(modelName) {
    // Unknown or missing names fall back to the main model; a real Gemini id passes through.
    const geminiName = MODEL_MAP[modelName] || (modelName?.startsWith("gemini") ? modelName : MAIN_MODEL);
    return aisdk(google(geminiName));
  },
});

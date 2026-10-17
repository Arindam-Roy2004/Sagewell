/**
 * Credit pricing: the single place that turns LLM usage into credits.
 *
 * Units
 *  - Money is tracked in micro-USD (integers). $1 per 1M tokens == 1 micro-USD per token,
 *    so the per-million prices below can be multiplied by a token count directly.
 *  - 1 credit == CREDIT_MICROS (default $0.001). Users see credits; the database stores micros.
 *
 * Every figure can be tuned with an env var, so limits change without a deploy.
 * OpenRouter prices: https://openrouter.ai/models
 */
const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const CREDIT_MICROS = num(process.env.CREDIT_MICROS, 1000);
export const toMicros = (credits) => Math.round(credits * CREDIT_MICROS);
export const toCredits = (micros) => Math.round((micros / CREDIT_MICROS) * 100) / 100;

/** Credits every new account starts with (about 10 rupees of model usage). */
export const STARTING_CREDITS = num(process.env.CREDITS_STARTING, 100);

/** Safety multiplier on measured cost: covers FX drift, retries and the background jobs. */
export const COST_MARKUP = num(process.env.CREDITS_MARKUP, 1.2);

// USD per 1M tokens [input, output]. Output includes reasoning tokens.
// OpenRouter routes each call to one of several providers at different prices, so llm.js caps
// every request at MAX_PRICE and models are billed at that cap (the worst case).
export const MAX_PRICE = {
  input: num(process.env.LLM_MAX_PRICE_INPUT, 0.2),
  output: num(process.env.LLM_MAX_PRICE_OUTPUT, 0.6),
};
const MODEL_PRICES = {
  "deepseek/deepseek-v4-flash": [MAX_PRICE.input, MAX_PRICE.output],
};
// Any other model: bill at the cap too, since requests can never cost more than it.
const FALLBACK_PRICE = [MAX_PRICE.input, MAX_PRICE.output];
// google/gemini-embedding-001 on OpenRouter.
const EMBEDDING_PRICE = num(process.env.EMBEDDING_PRICE, 0.15);

/** Rough token estimate for text when the provider reports none (embeddings, aborted streams). */
export const estimateTokens = (chars) => Math.ceil((chars || 0) / 3);

export function llmCostMicros(model, inputTokens = 0, outputTokens = 0) {
  const [inPrice, outPrice] = MODEL_PRICES[model] || FALLBACK_PRICE;
  return (inputTokens * inPrice + outputTokens * outPrice) * COST_MARKUP;
}

export function embeddingCostMicros(tokens = 0) {
  return tokens * EMBEDDING_PRICE * COST_MARKUP;
}

/** What each action costs, in credits. Shown to users in the credits dialog. */
export const PRICING = {
  // Held up front for one chat answer; the unused part is returned once the answer is done.
  chatReserve: num(process.env.CREDITS_CHAT_RESERVE, 8),
  // Smallest balance that can still ask a question (the hold shrinks to what is left).
  chatMinimum: num(process.env.CREDITS_CHAT_MINIMUM, 2),
  // Added to every answer for the background work it triggers (summaries, memory).
  chatOverhead: num(process.env.CREDITS_CHAT_OVERHEAD, 0.5),
  // Held for a file upload until the text is read and its real size is known.
  fileReserve: num(process.env.CREDITS_FILE_RESERVE, 5),
  // Flat fee on top of processing for fetching and cleaning a web page.
  linkFlat: num(process.env.CREDITS_LINK_FLAT, 3),
  // A summary is one small model call over a few sections of the document.
  summaryEstimate: num(process.env.CREDITS_SUMMARY_ESTIMATE, 3),
};

export const LIMITS = {
  maxUrlSources: num(process.env.MAX_URL_SOURCES, 1),
  maxFileBytes: num(process.env.MAX_FILE_MB, 20) * 1024 * 1024,
  maxPastedChars: num(process.env.MAX_PASTED_CHARS, 100_000),
  maxSourceChars: num(process.env.MAX_SOURCE_CHARS, 500_000),
  maxMessageChars: num(process.env.MAX_MESSAGE_CHARS, 4_000),
};

/** Upper-bound ingest estimate (micros) for a document of this many characters. */
export function ingestCostMicros(chars, { link = false } = {}) {
  // Child chunks overlap by 25%, so about 1.33x the text gets embedded.
  const embed = embeddingCostMicros(estimateTokens(chars) * 1.33);
  return Math.ceil(embed + toMicros(PRICING.summaryEstimate) + (link ? toMicros(PRICING.linkFlat) : 0));
}

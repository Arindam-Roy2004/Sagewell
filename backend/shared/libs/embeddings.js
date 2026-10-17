import "./env.js";
import { Embeddings } from "@langchain/core/embeddings";
import { embed, embedMany } from "ai";
import { openrouter } from "./llm.js";
import { recordEmbeddingChars } from "./usageMeter.js";

/**
 * The one embeddings model used everywhere (document ingestion, search, memory), served
 * through OpenRouter and exposed as a LangChain `Embeddings` for the Qdrant vector store.
 *
 * Every vector in Qdrant must come from the SAME model. If you change EMBEDDING_MODEL
 * later, delete the Qdrant collections ("notebookLM-Collection" and
 * "memory-notebookLM-Collection") and re-upload your sources, or search results will be wrong.
 */
class OpenRouterEmbeddings extends Embeddings {
  constructor(modelId) {
    super({ maxRetries: 2 });
    this.model = openrouter.embeddingModel(modelId);
  }

  // Embeddings report no token usage, so charge the active credit meter from the text length.
  async embedDocuments(texts) {
    if (!texts.length) return [];
    recordEmbeddingChars(texts.reduce((sum, t) => sum + (t?.length || 0), 0));
    const { embeddings } = await embedMany({ model: this.model, values: texts, maxRetries: 2 });
    return embeddings;
  }

  async embedQuery(text) {
    recordEmbeddingChars(text?.length || 0);
    const { embedding } = await embed({ model: this.model, value: text, maxRetries: 2 });
    return embedding;
  }
}

export const embeddings = new OpenRouterEmbeddings(
  process.env.EMBEDDING_MODEL || "google/gemini-embedding-001"
);

import "./env.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { recordEmbeddingChars } from "./usageMeter.js";

/**
 * The one embeddings model used everywhere (document ingestion, search, memory).
 *
 * Every vector in Qdrant must come from the SAME model. If you change GEMINI_EMBEDDING_MODEL
 * later, delete the Qdrant collections ("notebookLM-Collection" and
 * "memory-notebookLM-Collection") and re-upload your sources, or search results will be wrong.
 */
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
});

// Embeddings report no token usage, so charge the active credit meter from the text length.
// Wrapping the instance covers every caller: ingestion, vector search and memory.
const embedDocuments = embeddings.embedDocuments.bind(embeddings);
const embedQuery = embeddings.embedQuery.bind(embeddings);
embeddings.embedDocuments = (texts) => {
  recordEmbeddingChars(texts.reduce((sum, t) => sum + (t?.length || 0), 0));
  return embedDocuments(texts);
};
embeddings.embedQuery = (text) => {
  recordEmbeddingChars(text?.length || 0);
  return embedQuery(text);
};

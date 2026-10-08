import "./env.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

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

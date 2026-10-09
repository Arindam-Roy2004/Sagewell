import "./env.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddings } from "./embeddings.js";

const qdrantClient = new QdrantClient({
  url: process.env.QUADRANT_URL,
  apiKey: process.env.QUADRANT_API_KEY,
});

/**
 * Every payload field the app filters on, per collection.
 *
 * Qdrant Cloud runs collections in strict mode, which rejects any filtered search or
 * delete on a field without a payload index ("Bad Request"). So these indexes are
 * required, not just an optimization, and must exist before the first query.
 */
const COLLECTION_INDEXES = {
  "notebookLM-Collection": ["metadata.userId", "metadata.sourceId", "metadata.level"],
  "memory-notebookLM-Collection": ["metadata.userId"],
};

// Vector size comes from the embeddings model itself, so changing GEMINI_EMBEDDING_MODEL
// can't silently create a collection with the wrong dimensions. Only probed when a
// collection actually has to be created.
let vectorSizePromise = null;
function getVectorSize() {
  vectorSizePromise ??= embeddings.embedQuery("dimension probe").then((v) => v.length);
  return vectorSizePromise;
}

/**
 * Creates the collection if it doesn't exist yet, with the same settings LangChain uses
 * (Cosine distance). Without this, indexes could only be created after the first upload
 * happened to create the collection, leaving search broken until the next restart.
 */
async function ensureCollection(collectionName) {
  const { exists } = await qdrantClient.collectionExists(collectionName);
  if (exists) return;

  const size = await getVectorSize();
  try {
    await qdrantClient.createCollection(collectionName, {
      vectors: { size, distance: "Cosine" },
    });
    console.log(`✅ Created Qdrant collection ${collectionName} (${size} dims)`);
  } catch (err) {
    // The API and the worker start together; the other one may have just created it.
    const { exists: nowExists } = await qdrantClient.collectionExists(collectionName);
    if (!nowExists) throw err;
  }
}

export async function ensurePayloadIndex(collectionName, fieldName) {
  try {
    const collection = await qdrantClient.getCollection(collectionName);

    const payloadIndexes =
      collection.result?.payload_schema || collection.payload_schema || {};

    if (payloadIndexes[fieldName]) {
      console.log(`✅ Index already exists for ${fieldName}`);
      return;
    }

    console.log(`🔨 Creating index for ${fieldName}...`);

    await qdrantClient.createPayloadIndex(collectionName, {
      field_name: fieldName,
      field_schema: "keyword",
      wait: true,
    });

    console.log(`✅ Created index for ${fieldName}`);
  } catch (err) {
    console.error(`❌ Failed while ensuring index ${fieldName}:`, err.message);
  }
}

/**
 * Deletes every vector point belonging to one source (scoped to its owner for safety).
 * Mirrors the payload keys used when points are created (metadata.userId / metadata.sourceId).
 */
export async function deleteSourceVectors(userId, sourceId) {
  await qdrantClient.delete("notebookLM-Collection", {
    wait: true,
    filter: {
      must: [
        { key: "metadata.userId", match: { value: userId.toString() } },
        { key: "metadata.sourceId", match: { value: sourceId.toString() } },
      ],
    },
  });
}

/**
 * Ensures every collection exists and has all required multi-tenant payload indexes.
 * Idempotent, so it is safe to run on every API and worker start.
 */
export async function initQdrantIndexes() {
  await Promise.allSettled(
    Object.entries(COLLECTION_INDEXES).map(async ([collectionName, fields]) => {
      try {
        await ensureCollection(collectionName);
      } catch (err) {
        console.error(`❌ Could not create Qdrant collection ${collectionName}:`, err.message);
        return;
      }
      for (const field of fields) {
        await ensurePayloadIndex(collectionName, field);
      }
    })
  );
}

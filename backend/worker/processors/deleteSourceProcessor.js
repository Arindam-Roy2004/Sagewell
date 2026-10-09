import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Source from "../../shared/models/source.model.js";
import Chunk from "../../shared/models/chunk.model.js";
import Chat from "../../shared/models/chat.model.js";
import { s3 } from "../../shared/libs/s3.js";
import { deleteSourceVectors } from "../../shared/libs/qdrant.js";

/**
 * Background cascade for deleting a source.
 *
 * Order matters for correctness, not just cleanup:
 *   1. Pull the source out of EVERY chat that referenced it, then delete any chat left
 *      with no sources (it has nothing left to answer from). The API request already did
 *      this so the UI could update at once; repeating it here is an idempotent safety net.
 *   2. Delete Qdrant vectors, Mongo chunks, and the S3 object (best-effort — a single
 *      failing dependency shouldn't strand the rest).
 *   3. Finally delete the Source document itself (authoritative). If this throws, BullMQ
 *      retries the whole job; every step above is idempotent, so retries are safe.
 */
export async function processSourceDeletion(job) {
  const { sourceId, userId, s3Key } = job.data;

  // 1. Remove from all chats, then delete chats left with no sources.
  await Chat.updateMany(
    { userId, sourceIds: sourceId },
    { $pull: { sourceIds: sourceId } }
  );
  await Chat.deleteMany({ userId, sourceIds: { $size: 0 } });

  // 2. External resources (best-effort).
  try {
    await deleteSourceVectors(userId, sourceId);
  } catch (e) {
    console.warn(`⚠️ Qdrant vector delete failed for source ${sourceId}:`, e.message);
  }
  try {
    await Chunk.deleteMany({ sourceId, userId });
  } catch (e) {
    console.warn(`⚠️ Chunk delete failed for source ${sourceId}:`, e.message);
  }
  if (s3Key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: s3Key }));
    } catch (e) {
      console.warn(`⚠️ S3 delete failed for source ${sourceId}:`, e.message);
    }
  }

  // 3. Authoritative delete of the source document.
  await Source.deleteOne({ _id: sourceId, userId });
}

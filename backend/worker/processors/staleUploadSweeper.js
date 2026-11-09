import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Source from "../../shared/models/source.model.js";
import Chat from "../../shared/models/chat.model.js";
import { s3 } from "../../shared/libs/s3.js";

/**
 * Removes uploads that were started (/source/presign) but never confirmed.
 *
 * Their upload URL expired after an hour, so they can never be completed; left alone, the
 * rows and any object already uploaded would pile up forever. Such sources never took a
 * credit hold or a file slot (both happen at confirm), so there is nothing to refund.
 *
 * Safe to run from several workers at once: each row is claimed with an atomic
 * "delete only if still uploading", so a confirm that races the sweep either wins (the row is
 * queued and left alone) or loses cleanly (the confirm then gets a 404).
 */
const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // upload URLs live 1h; keep a wide margin
const BATCH_SIZE = 200;

export async function sweepStaleUploads({ now = Date.now() } = {}) {
  const cutoff = new Date(now - STALE_AFTER_MS);
  const candidates = await Source.find({ status: "uploading", createdAt: { $lt: cutoff } })
    .select("_id userId s3Key")
    .limit(BATCH_SIZE)
    .lean();

  let removed = 0;
  for (const candidate of candidates) {
    const claimed = await Source.findOneAndDelete({ _id: candidate._id, status: "uploading" })
      .select("_id userId s3Key")
      .lean();
    if (!claimed) continue; // confirmed (or removed) in the meantime
    removed += 1;

    // Unconfirmed sources shouldn't be in chats, but never leave a dangling id behind.
    await Chat.updateMany(
      { userId: claimed.userId, sourceIds: claimed._id },
      { $pull: { sourceIds: claimed._id } }
    ).catch((e) => console.warn(`⚠️ Stale upload ${claimed._id}: chat cleanup failed:`, e.message));

    if (claimed.s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: claimed.s3Key }));
      } catch (e) {
        console.warn(`⚠️ Stale upload ${claimed._id}: S3 delete failed:`, e.message);
      }
    }
  }

  return { scanned: candidates.length, removed };
}

const SWEEP_INTERVAL_MS = 30 * 60 * 1000;
const FIRST_SWEEP_DELAY_MS = 60 * 1000;

/** Starts the periodic sweep. Returns a function that stops it (used on shutdown). */
export function startStaleUploadSweeper() {
  let running = false;
  const tick = async () => {
    if (running) return; // never overlap runs
    running = true;
    try {
      const { removed } = await sweepStaleUploads();
      if (removed) console.log(`🧹 Removed ${removed} stale unconfirmed upload(s)`);
    } catch (e) {
      console.warn("⚠️ Stale upload sweep failed:", e.message);
    } finally {
      running = false;
    }
  };

  const first = setTimeout(tick, FIRST_SWEEP_DELAY_MS);
  const interval = setInterval(tick, SWEEP_INTERVAL_MS);
  first.unref();
  interval.unref();
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
}

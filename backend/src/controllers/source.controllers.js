import "dotenv/config";
import Source from "../../shared/models/source.model.js";
import Chat from "../../shared/models/chat.model.js";
import { abortChatStreams } from "./chat.controllers.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Queue } from "bullmq";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../shared/libs/s3.js";
import { getSharedRedisClient } from "../../shared/libs/redis.js";
import { assertSafeUrl } from "../../shared/libs/urlGuard.js";
import { logger } from "../../shared/libs/logger.js";
import {
  reserve,
  adjust,
  canAfford,
  claimUrlSlot,
  releaseUrlSlot,
  refundSource,
} from "../../shared/libs/credits.js";
import { PRICING, LIMITS, toMicros, ingestCostMicros } from "../../shared/libs/pricing.js";
import { sendInsufficientCredits } from "../middlewares/credits.middlewares.js";

const sourceQueue = new Queue("process-source", {
  connection: getSharedRedisClient(),
});

// Dedicated queue for the (potentially slow) source-deletion cascade:
// Qdrant vectors + Mongo chunks + S3 object + pulling the source out of every chat.
const deleteSourceQueue = new Queue("delete-source", {
  connection: getSharedRedisClient(),
});

const presignedUrlCache = new Map();

// Undoes a credit hold when the request fails after it was taken. Once a source row exists
// the shared refund path owns the hold (it is idempotent); before that, return it directly.
async function releaseHold(userId, source, held, slot = false) {
  try {
    if (source) {
      await Source.updateOne({ _id: source._id }, { status: "failed", errorMessage: "Could not be queued" });
      await refundSource(source._id, "Could not queue source, credits returned");
    } else {
      if (held) await adjust(userId, -held);
      if (slot) await releaseUrlSlot(userId);
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to release credit hold");
  }
}

export const text2 = async (req, res) => {
  let held = 0;
  let source = null;
  try {
    const { text } = req.body;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    // Hold credits for the whole job up front; the worker settles to the real cost.
    held = ingestCostMicros(text.length);
    if (!(await reserve(userId, held)).ok) {
      held = 0;
      return sendInsufficientCredits(res, userId, "You don't have enough credits to add this text.");
    }

    source = await Source.create({
      userId,
      type: "text-paste",
      textContent: text,
      status: "queued",
      credit: { reserved: held },
    });

    await sourceQueue.add("process-source", {
      sourceId: source._id.toString(),
      userId: userId.toString(),
      s3Key: source.s3Key,
      type: source.type,
      typeSpecificData: source.textContent,
      mimeType: source.mimeType,
    });

    return res.status(200).json({
      success: true,
      source: {
        id: source._id,
        status: source.status,
        textContent: source.textContent,
      },
      message: "Text queued",
    });
  } catch (error) {
    await releaseHold(req.user._id, source, held);
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while queuing text",
    });
  }
};

export const web2 = async (req, res) => {
  let held = 0;
  let slot = false;
  let source = null;
  try {
    const { url } = req.body;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // SSRF guard: reject private/loopback/metadata URLs before we ever queue them.
    try {
      await assertSafeUrl(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message || "This URL cannot be processed",
      });
    }

    // Web pages are limited per account, and every one costs a flat fee on top of processing.
    slot = await claimUrlSlot(userId);
    if (!slot) {
      return res.status(403).json({
        success: false,
        code: "URL_LIMIT_REACHED",
        message: `Each account can add ${LIMITS.maxUrlSources} web link${LIMITS.maxUrlSources === 1 ? "" : "s"}. Upload the page as a file or paste its text instead.`,
      });
    }
    held = toMicros(PRICING.fileReserve + PRICING.linkFlat);
    if (!(await reserve(userId, held)).ok) {
      held = 0;
      await releaseUrlSlot(userId);
      slot = false;
      return sendInsufficientCredits(res, userId, "You don't have enough credits to add a web link.");
    }

    source = await Source.create({
      userId,
      type: "link",
      webURL: url,
      status: "queued",
      credit: { reserved: held },
    });
    await sourceQueue.add("process-source", {
      sourceId: source._id.toString(),
      userId: userId.toString(),
      s3Key: source.s3Key,
      type: source.type,
      typeSpecificData: source.webURL,
      mimeType: source.mimeType,
    });
    return res.status(200).json({
      success: true,
      source: {
        id: source._id,
        status: source.status,
        webURL: source.webURL,
      },
      message: "URL queued",
    });
  } catch (error) {
    await releaseHold(req.user._id, source, held, slot);
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while queuing URL",
    });
  }
};

// Cursor helpers: a cursor is an opaque base64 of "<createdAtMs>_<_id>", which together
// give a stable, unique sort key (createdAt can tie; _id breaks ties). This is keyset
// pagination — it stays correct and fast even as new sources are added, unlike offset
// pagination which can skip/duplicate rows when the list shifts.
function encodeCursor(doc) {
  return Buffer.from(`${new Date(doc.createdAt).getTime()}_${doc._id}`).toString("base64");
}
function decodeCursor(cursor) {
  try {
    const [ms, id] = Buffer.from(cursor, "base64").toString("utf8").split("_");
    return { createdAt: new Date(Number(ms)), id };
  } catch {
    return null;
  }
}

export const getSources = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    // Hide sources that are mid-upload or mid-deletion from the library.
    const filter = { userId, status: { $nin: ["uploading", "deleting"] } };

    // Newest first. The cursor asks for rows strictly "older" than the last one seen.
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    // Fetch one extra to know whether another page exists.
    const docs = await Source.find(filter)
      .select("-textContent")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const sources = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? encodeCursor(sources[sources.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Sources fetched successfully",
      sources: sources || [],
      nextCursor,
      hasMore,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching sources");
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching sources",
    });
  }
};

export const getPresign = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (fileSize > LIMITS.maxFileBytes) {
      return res.status(400).json({
        success: false,
        message: `File size should be less than ${Math.round(LIMITS.maxFileBytes / 1024 / 1024)}MB`,
      });
    }

    // Fail before the upload starts if the account can't pay for processing.
    if (!(await canAfford(userId, toMicros(PRICING.fileReserve)))) {
      return sendInsufficientCredits(res, userId, "You don't have enough credits to add a file.");
    }

    let type;
    if (fileType === "application/pdf") {
      type = "pdf";
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      type = "docx";
    } else if (fileType === "text/plain") {
      type = "text";
    } else if (fileType === "text/csv") {
      type = "csv";
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type. Use PDF, DOCX, TXT, or CSV.",
      });
    }

    const key = `${uuidv4()}-${fileName}`;
    const source = await Source.create({
      userId,
      originalFileName: fileName,
      s3Key: key,
      mimeType: fileType,
      type,
    });

    const putUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: fileType,
      }),
      { expiresIn: 3600 },
    );

    return res.status(200).json({
      success: true,
      message: "Pre-signed URL generated successfully",
      presignedUrl: putUrl,
      source: {
        id: source._id,
        key: source.s3Key,
        status: source.status,
        originalFileName: source.originalFileName,
        mimeType: source.mimeType,
        type: source.type,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating pre-signed URL",
    });
  }
};

export const confirmUpload = async (req, res) => {
  try {
    const { sourceId } = req.body;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!sourceId) {
      return res.status(400).json({
        success: false,
        message: "Source ID is required",
      });
    }

    const source = await Source.findById(sourceId);
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Source not found",
      });
    }

    if (source.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Only the first confirm of an upload queues it and takes a credit hold; a repeat is a no-op.
    // The status flip is atomic, so two concurrent confirms can't both charge and queue.
    if (source.status === "uploading") {
      const held = toMicros(PRICING.fileReserve);
      if (!(await reserve(userId, held)).ok) {
        return sendInsufficientCredits(res, userId, "You don't have enough credits to process this file.");
      }
      const claimed = await Source.findOneAndUpdate(
        { _id: source._id, status: "uploading" },
        { $set: { status: "queued", credit: { reserved: held, settled: false } } },
        { new: true },
      ).catch(async (error) => {
        await adjust(userId, -held);
        throw error;
      });
      source.status = "queued";
      if (!claimed) {
        await adjust(userId, -held); // another confirm got there first and queued it
      } else {
        try {
          await sourceQueue.add("process-source", {
            sourceId: source._id.toString(),
            userId: userId.toString(),
            s3Key: source.s3Key,
            type: source.type,
            typeSpecificData: source.textContent,
            mimeType: source.mimeType,
          });
        } catch (error) {
          await releaseHold(userId, source, held);
          throw error;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Source queued for processing successfully",
      source: {
        id: source._id,
        status: source.status,
        originalFileName: source.originalFileName,
        mimeType: source.mimeType,
        type: source.type,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while confirming upload",
    });
  }
};

export const getStatus = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!sourceId) {
      return res.status(400).json({
        success: false,
        message: "Source ID is required",
      });
    }

    const source = await Source.findById(sourceId).lean();
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Source not found",
      });
    }

    if (source.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Source status fetched successfully",
      source: {
        id: source._id,
        status: source.status,
        originalFileName: source.originalFileName,
        mimeType: source.mimeType,
        type: source.type,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching status",
    });
  }
};

export const getViewUrl = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!sourceId) {
      return res.status(400).json({
        success: false,
        message: "Source ID is required",
      });
    }

    const source = await Source.findById(sourceId).lean();
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Source not found",
      });
    }

    if (source.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (source.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Source is not processed yet",
      });
    }

    const exp = 3600;
    const now = Date.now();
    const cacheKey = `${userId}:${source.s3Key}`;
    const cached = presignedUrlCache.get(cacheKey);
    let presignedUrl;

    if (cached && cached.expiresAt > now + 300 * 1000) {
      presignedUrl = cached.url;
    } else {
      presignedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: source.s3Key,
        }),
        { expiresIn: exp },
      );

      if (presignedUrlCache.size > 500) {
        const oldestKey = presignedUrlCache.keys().next().value;
        presignedUrlCache.delete(oldestKey);
      }

      presignedUrlCache.set(cacheKey, {
        url: presignedUrl,
        expiresAt: now + exp * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Source view URL fetched successfully",
      viewUrl: presignedUrl,
      expiresIn: exp,
      source: {
        id: source._id,
        status: source.status,
        originalFileName: source.originalFileName,
        mimeType: source.mimeType,
        type: source.type,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching view URL",
    });
  }
};

/**
 * Delete a source.
 *
 * Dialogues are scoped to their sources, so they follow the source:
 *   - a dialogue whose ONLY source is this one has nothing left to answer from and is
 *     deleted with it;
 *   - a dialogue that still has other sources keeps them and just drops this one.
 * That part is cheap and runs here, so the response tells the client exactly which
 * dialogues went away and the UI never shows a dialogue that no longer exists.
 *
 * The heavy cascade (Qdrant vectors, Mongo chunks, S3 object, the source document)
 * runs in a background BullMQ job so a slow external service can't make the user wait.
 * The job repeats the dialogue step idempotently, as a safety net.
 */
export const deleteSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const userId = req.user._id;

    const source = await Source.findById(sourceId);
    if (!source) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }
    if (source.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this source" });
    }

    // Mark as deleting (hidden from the library) and enqueue the cascade first, so the
    // cleanup is guaranteed even if a later step in this request fails.
    source.status = "deleting";
    await Promise.all([
      source.save(),
      deleteSourceQueue.add("delete-source", {
        sourceId: source._id.toString(),
        userId: userId.toString(),
        s3Key: source.s3Key,
      }),
    ]);

    const linkedChats = await Chat.find({ userId, sourceIds: source._id }).select("_id sourceIds").lean();
    const deletedChatIds = linkedChats
      .filter((c) => c.sourceIds.every((id) => id.equals(source._id)))
      .map((c) => c._id.toString());

    if (deletedChatIds.length) {
      abortChatStreams(userId.toString(), deletedChatIds);
      await Chat.deleteMany({ _id: { $in: deletedChatIds }, userId });
    }
    await Chat.updateMany({ userId, sourceIds: source._id }, { $pull: { sourceIds: source._id } });

    return res.status(200).json({
      success: true,
      message: "Source deleted",
      sourceId,
      deletedChatIds,
    });
  } catch (error) {
    logger.error({ err: error }, "Error starting source deletion");
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting source",
    });
  }
};

/**
 * Rename a source (its display title). Owner-only.
 */
export const renameSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const source = await Source.findById(sourceId);
    if (!source) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }
    if (source.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to rename this source" });
    }

    const newTitle = title.trim();
    await Source.updateOne({ _id: sourceId, userId }, { $set: { title: newTitle } });

    return res.status(200).json({
      success: true,
      message: "Source renamed",
      source: { id: sourceId, title: newTitle },
    });
  } catch (error) {
    logger.error({ err: error }, "Error renaming source");
    return res.status(500).json({
      success: false,
      message: "Internal server error while renaming source",
    });
  }
};

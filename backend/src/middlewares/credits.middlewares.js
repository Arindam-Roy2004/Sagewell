import { reserveUpTo, settle, creditSummary } from "../../shared/libs/credits.js";
import { PRICING, LIMITS, toMicros } from "../../shared/libs/pricing.js";
import { usageStore, createMeter } from "../../shared/libs/usageMeter.js";
import User from "../../shared/models/user.model.js";

/** Standard "out of credits" reply (402) shared by every route that spends credits. */
export async function sendInsufficientCredits(res, userId, message) {
  const user = await User.findById(userId).select("credits usage").lean();
  return res.status(402).json({
    success: false,
    code: "INSUFFICIENT_CREDITS",
    message: message || "You've used all your credits.",
    credits: creditSummary(user),
  });
}

/**
 * Charges a chat answer by what it actually used.
 *
 * Holds up to PRICING.chatReserve up front (402 below PRICING.chatMinimum), runs the rest of the
 * request inside a usage meter, and when the response closes (finished, failed or aborted)
 * settles to the metered cost. A request that never reached the model (bad chat id, validation
 * error) meters nothing, so the whole hold is returned.
 */
export const chatCredits = async (req, res, next) => {
  const userId = req.user._id;
  const { ok, held: hold } = await reserveUpTo(userId, toMicros(PRICING.chatReserve), toMicros(PRICING.chatMinimum));
  if (!ok) {
    return sendInsufficientCredits(res, userId, "You don't have enough credits left to ask a question.");
  }

  const meter = createMeter({ userId: userId.toString(), kind: "chat" });
  let settled = false;
  res.on("close", async () => {
    if (settled) return;
    settled = true;
    try {
      const actual = meter.calls ? meter.micros + toMicros(PRICING.chatOverhead) : 0;
      await settle(userId, hold, actual, { kind: "chat", label: "Chat answer" });
    } catch (error) {
      console.error("Failed to settle chat credits:", error.message);
    }
  });

  usageStore.run(meter, next);
};

/** Rejects oversized chat messages before they cost anything. */
export const limitMessageSize = (req, res, next) => {
  if ((req.body?.message || "").length > LIMITS.maxMessageChars) {
    return res.status(400).json({
      success: false,
      message: `Messages can be up to ${LIMITS.maxMessageChars.toLocaleString()} characters.`,
    });
  }
  next();
};

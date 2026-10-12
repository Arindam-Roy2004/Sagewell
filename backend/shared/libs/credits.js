import User from "../models/user.model.js";
import Source from "../models/source.model.js";
import CreditTransaction from "../models/creditTransaction.model.js";
import { STARTING_CREDITS, PRICING, LIMITS, toMicros, toCredits } from "./pricing.js";

/**
 * Credit accounting. Balances are micro-USD integers on the user document.
 *
 * The rule that keeps this strict: money is *reserved* before the work starts (an atomic
 * conditional decrement, so parallel requests can never overspend), then *settled* once the
 * real usage is known, by returning the unused part or charging the small overrun, never
 * letting the balance go below zero.
 */

/** Gives accounts created before credits existed their starting balance (no-op otherwise). */
async function ensureCredits(userId) {
  const start = toMicros(STARTING_CREDITS);
  await User.updateOne(
    { _id: userId, "credits.balance": { $exists: false } },
    { $set: { credits: { granted: start, balance: start, spent: 0 } } },
  );
}

/** Atomically holds `micros` from the balance. Returns { ok, balance } (balance in micros). */
export async function reserve(userId, micros) {
  const hold = Math.ceil(micros);
  if (hold <= 0) return { ok: true };
  const attempt = () =>
    User.findOneAndUpdate(
      { _id: userId, "credits.balance": { $gte: hold } },
      { $inc: { "credits.balance": -hold, "credits.spent": hold } },
      { new: true, projection: { "credits.balance": 1 } },
    ).lean();

  let doc = await attempt();
  if (!doc) {
    await ensureCredits(userId);
    doc = await attempt();
  }
  return doc ? { ok: true, balance: doc.credits.balance } : { ok: false };
}

/**
 * Holds up to `max` micros if at least `min` is available, in one atomic update.
 * Returns { ok, held } where `held` is what was actually taken.
 */
export async function reserveUpTo(userId, max, min) {
  const take = { $min: [Math.ceil(max), "$credits.balance"] };
  const attempt = () =>
    User.findOneAndUpdate(
      { _id: userId, "credits.balance": { $gte: Math.ceil(min) } },
      [{ $set: { "credits.balance": { $subtract: ["$credits.balance", take] }, "credits.spent": { $add: ["$credits.spent", take] } } }],
      { new: false, projection: { "credits.balance": 1 } },
    ).lean();

  let doc = await attempt();
  if (!doc) {
    await ensureCredits(userId);
    doc = await attempt();
  }
  return doc ? { ok: true, held: Math.min(Math.ceil(max), doc.credits.balance) } : { ok: false };
}

/** Cheap pre-flight check (no hold) so doomed requests fail before any upload starts. */
export async function canAfford(userId, micros) {
  const user = await User.findById(userId).select("credits.balance").lean();
  const balance = user?.credits?.balance ?? toMicros(STARTING_CREDITS);
  return balance >= micros;
}

/**
 * Moves the balance by `delta` micros: positive charges more (never past zero), negative
 * returns credits. `spent` follows the same amount.
 */
export async function adjust(userId, delta) {
  const amount = Math.round(delta);
  if (!amount) return;
  await ensureCredits(userId);
  const effective = {
    $cond: [{ $gt: [amount, 0] }, { $min: [amount, "$credits.balance"] }, amount],
  };
  await User.updateOne({ _id: userId }, [
    {
      $set: {
        "credits.balance": { $subtract: ["$credits.balance", effective] },
        "credits.spent": { $max: [0, { $add: ["$credits.spent", effective] }] },
      },
    },
  ]);
}

/** Best-effort history row; never fails the request it describes. */
export async function logTransaction(userId, kind, amount, label) {
  if (Math.abs(amount) < 10) return; // ignore fractions of a hundredth of a credit
  try {
    await CreditTransaction.create({ userId, kind, amount: Math.round(amount), label });
  } catch (error) {
    console.error("Failed to log credit transaction:", error.message);
  }
}

/** Closes out a reservation: charges `actual`, returns whatever was held beyond it. */
export async function settle(userId, reserved, actual, { kind, label }) {
  await adjust(userId, actual - reserved);
  await logTransaction(userId, kind, actual, label);
}

/** Admin top-up: raises both the balance and the granted total, so the bar stays meaningful. */
export async function grantCredits(userId, micros, label = "Credits added by admin") {
  const amount = Math.round(micros);
  if (amount <= 0) return;
  await ensureCredits(userId);
  await User.updateOne({ _id: userId }, { $inc: { "credits.balance": amount, "credits.granted": amount } });
  await logTransaction(userId, "grant", -amount, label);
}

// ── Sources ───────────────────────────────────────────────────────────────────────────────
// A source holds credits from the API call until the worker finishes it. `credit.settled`
// is flipped atomically so a retry or a double call can never charge or refund twice.
async function closeSource(sourceId) {
  return Source.findOneAndUpdate(
    { _id: sourceId, "credit.settled": { $ne: true } },
    { $set: { "credit.settled": true } },
    { projection: { userId: 1, type: 1, credit: 1 } },
  ).lean();
}

/** Worker finished: charge what was really used, return the rest of the hold. */
export async function settleSource(sourceId, actualMicros, label) {
  const source = await closeSource(sourceId);
  if (!source) return;
  await settle(source.userId, source.credit?.reserved || 0, actualMicros, { kind: "source", label });
}

/** Worker failed: give the whole hold back, and the link slot if a link was using one. */
export async function refundSource(sourceId, label = "Source failed, credits returned") {
  const source = await closeSource(sourceId);
  if (!source) return;
  const reserved = source.credit?.reserved || 0;
  if (reserved > 0) {
    await adjust(source.userId, -reserved);
    await logTransaction(source.userId, "refund", -reserved, label);
  }
  if (source.type === "link") await releaseUrlSlot(source.userId);
}

/** Raises a source's hold to `neededMicros` once its real size is known. False if unaffordable. */
export async function topUpSource(sourceId, userId, neededMicros) {
  const source = await Source.findById(sourceId, { credit: 1 }).lean();
  const held = source?.credit?.reserved || 0;
  const needed = Math.ceil(neededMicros);
  if (needed <= held) return true;
  const { ok } = await reserve(userId, needed - held);
  if (!ok) return false;
  await Source.updateOne({ _id: sourceId }, { $set: { "credit.reserved": needed } });
  return true;
}

// ── Link slots (hard cap on web-page sources per account) ────────────────────────────────
export async function claimUrlSlot(userId) {
  const claimed = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [{ "usage.urlSources": { $exists: false } }, { "usage.urlSources": { $lt: LIMITS.maxUrlSources } }],
    },
    { $inc: { "usage.urlSources": 1 } },
    { projection: { _id: 1 } },
  ).lean();
  return Boolean(claimed);
}

export async function releaseUrlSlot(userId) {
  await User.updateOne({ _id: userId, "usage.urlSources": { $gt: 0 } }, { $inc: { "usage.urlSources": -1 } });
}

// ── Reading ───────────────────────────────────────────────────────────────────────────────
/** The shape the frontend consumes. Everything is in credits, never micros. */
export function creditSummary(user) {
  const start = toMicros(STARTING_CREDITS);
  const granted = user?.credits?.granted ?? start;
  const balance = user?.credits?.balance ?? start;
  const spent = user?.credits?.spent ?? 0;
  return {
    granted: toCredits(granted),
    balance: toCredits(balance),
    spent: toCredits(spent),
    // Below the minimum for one answer there is nothing useful left to do.
    exhausted: balance < toMicros(PRICING.chatMinimum),
    urlSources: { used: user?.usage?.urlSources ?? 0, max: LIMITS.maxUrlSources },
  };
}

export async function listTransactions(userId, limit = 12) {
  const rows = await CreditTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((row) => ({
    id: row._id,
    kind: row.kind === "grant" ? "grant" : row.amount < 0 ? "refund" : row.kind,
    amount: toCredits(Math.abs(row.amount)),
    label: row.label,
    createdAt: row.createdAt,
  }));
}

import User from "../models/user.model.js";
import SignInEvent from "../models/signInEvent.model.js";

/**
 * Account activity for the admin dashboard: sign-ins (an explicit Google sign-in) and
 * "last active" (any authenticated request). Both are best-effort and never fail a request.
 */

export async function recordSignIn(req, user, { isNewUser = false } = {}) {
  try {
    const now = new Date();
    await Promise.all([
      SignInEvent.create({
        userId: user._id,
        isNewUser,
        ip: req.ip || null,
        userAgent: (req.get("user-agent") || "").slice(0, 400) || null,
      }),
      User.updateOne({ _id: user._id }, { $set: { lastLoginAt: now, lastActiveAt: now }, $inc: { loginCount: 1 } }),
    ]);
  } catch (error) {
    console.error("Failed to record sign-in:", error.message);
  }
}

// "Last active" is written at most once per user per window, so normal traffic adds almost
// no database writes. The in-memory map skips the query; the filter guards across instances.
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const lastTouched = new Map();

export function touchActivity(userId) {
  const key = userId.toString();
  const now = Date.now();
  if (now - (lastTouched.get(key) || 0) < ACTIVE_WINDOW_MS) return;
  lastTouched.set(key, now);
  if (lastTouched.size > 10_000) lastTouched.clear();

  const cutoff = new Date(now - ACTIVE_WINDOW_MS);
  User.updateOne(
    { _id: userId, $or: [{ lastActiveAt: { $exists: false } }, { lastActiveAt: null }, { lastActiveAt: { $lt: cutoff } }] },
    { $set: { lastActiveAt: new Date(now) } },
  ).catch((error) => console.error("Failed to update last active:", error.message));
}

/** "Mozilla/5.0 (Macintosh…) Chrome/…" -> { browser: "Chrome", os: "macOS" }. Good enough for a glance. */
export function describeDevice(userAgent = "") {
  const ua = userAgent || "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
    ? "Opera"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Unknown browser";
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
    ? "Android"
    : /Mac OS X|Macintosh/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
    ? "Windows"
    : /Linux/.test(ua)
    ? "Linux"
    : "Unknown OS";
  return { browser, os, mobile: /Mobile|iPhone|Android/.test(ua) };
}

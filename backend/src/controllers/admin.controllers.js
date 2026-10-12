import mongoose from "mongoose";
import User from "../../shared/models/user.model.js";
import Source from "../../shared/models/source.model.js";
import Chat from "../../shared/models/chat.model.js";
import SignInEvent from "../../shared/models/signInEvent.model.js";
import { creditSummary, listTransactions, grantCredits } from "../../shared/libs/credits.js";
import { describeDevice } from "../../shared/libs/activity.js";
import { PRICING, toMicros, toCredits } from "../../shared/libs/pricing.js";

const DAY = 24 * 60 * 60 * 1000;
const ONLINE_MS = 5 * 60 * 1000;
const SERIES_DAYS = 14;
const PUBLIC_USER_FIELDS = "name email avatar role createdAt lastLoginAt lastActiveAt loginCount credits usage";

/** Client time zone for day buckets; anything invalid falls back to UTC. */
function safeTimeZone(tz) {
  try {
    if (tz) new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz || "UTC";
  } catch {
    return "UTC";
  }
}

const dayKey = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** Counts per day in `timeZone`, for docs whose `createdAt` is since `from`. */
async function countByDay(Model, from, timeZone, match = {}) {
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: from }, ...match } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone } }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.count]));
}

/** Source and chat counts for a set of users, in two grouped queries. */
async function contentCounts(userIds) {
  const [sources, chats] = await Promise.all([
    Source.aggregate([
      { $match: { userId: { $in: userIds }, status: { $nin: ["uploading", "deleting"] } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Chat.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => new Map(rows.map((r) => [r._id.toString(), r.count]));
  return { sources: toMap(sources), chats: toMap(chats) };
}

function publicUser(user, counts) {
  const id = user._id.toString();
  return {
    id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
    lastActiveAt: user.lastActiveAt || null,
    loginCount: user.loginCount || 0,
    credits: creditSummary(user),
    sources: counts?.sources.get(id) || 0,
    chats: counts?.chats.get(id) || 0,
  };
}

function publicSignIn(event) {
  return {
    id: event._id,
    at: event.createdAt,
    isNewUser: event.isNewUser,
    ip: event.ip,
    device: describeDevice(event.userAgent),
  };
}

// GET /admin/overview — headline numbers and a 14-day sign-in / sign-up series.
export const getOverview = async (req, res) => {
  const timeZone = safeTimeZone(req.query.tz);
  const now = Date.now();
  const since = (ms) => new Date(now - ms);
  const seriesFrom = since(SERIES_DAYS * DAY);

  const [
    totalUsers,
    newUsers7d,
    newUsersPrev7d,
    activeToday,
    active7d,
    online,
    signIns7d,
    signInsPrev7d,
    creditTotals,
    outOfCredits,
    totalSources,
    totalChats,
    signInsByDay,
    signUpsByDay,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since(7 * DAY) } }),
    User.countDocuments({ createdAt: { $gte: since(14 * DAY), $lt: since(7 * DAY) } }),
    User.countDocuments({ lastActiveAt: { $gte: since(DAY) } }),
    User.countDocuments({ lastActiveAt: { $gte: since(7 * DAY) } }),
    User.countDocuments({ lastActiveAt: { $gte: since(ONLINE_MS) } }),
    SignInEvent.countDocuments({ createdAt: { $gte: since(7 * DAY) } }),
    SignInEvent.countDocuments({ createdAt: { $gte: since(14 * DAY), $lt: since(7 * DAY) } }),
    User.aggregate([{ $group: { _id: null, spent: { $sum: "$credits.spent" }, balance: { $sum: "$credits.balance" } } }]),
    User.countDocuments({ "credits.balance": { $lt: toMicros(PRICING.chatMinimum) } }),
    Source.countDocuments({ status: { $nin: ["uploading", "deleting"] } }),
    Chat.countDocuments(),
    countByDay(SignInEvent, seriesFrom, timeZone),
    countByDay(User, seriesFrom, timeZone),
  ]);

  // One entry per calendar day, oldest first, including empty days.
  const series = [];
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const date = dayKey(new Date(now - i * DAY), timeZone);
    series.push({ date, signIns: signInsByDay.get(date) || 0, signUps: signUpsByDay.get(date) || 0 });
  }

  return res.status(200).json({
    success: true,
    overview: {
      users: { total: totalUsers, new7d: newUsers7d, newPrev7d: newUsersPrev7d },
      active: { online, today: activeToday, week: active7d },
      signIns: { week: signIns7d, prevWeek: signInsPrev7d },
      credits: { spent: toCredits(creditTotals[0]?.spent || 0), outOfCredits },
      content: { sources: totalSources, chats: totalChats },
      series,
      timeZone,
    },
  });
};

const SORTS = {
  active: { lastActiveAt: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
  credits: { "credits.spent": -1, _id: -1 },
  signins: { loginCount: -1, _id: -1 },
};

// GET /admin/users?q=&sort=&page= — searchable, sortable account list.
export const listUsers = async (req, res) => {
  const limit = 20;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const sort = Object.hasOwn(SORTS, req.query.sort) ? SORTS[req.query.sort] : SORTS.active;
  const q = String(req.query.q || "").trim().slice(0, 100);

  const filter = {};
  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select(PUBLIC_USER_FIELDS).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const counts = await contentCounts(users.map((u) => u._id));

  return res.status(200).json({
    success: true,
    users: users.map((u) => publicUser(u, counts)),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
};

// GET /admin/users/:userId — one account: profile, sign-in history, credit activity, sources.
export const getUser = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const user = await User.findById(userId).select(PUBLIC_USER_FIELDS).lean();
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [counts, signIns, transactions, sources] = await Promise.all([
    contentCounts([user._id]),
    SignInEvent.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    listTransactions(user._id, 15),
    Source.find({ userId: user._id, status: { $nin: ["uploading", "deleting"] } })
      .select("title originalFileName webURL type status createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    user: publicUser(user, counts),
    signIns: signIns.map(publicSignIn),
    transactions,
    sources: sources.map((s) => ({
      id: s._id,
      name: s.title || s.originalFileName || s.webURL || "Untitled",
      type: s.type,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
};

// GET /admin/sign-ins — the most recent sign-ins across all accounts.
export const listSignIns = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const events = await SignInEvent.find().sort({ createdAt: -1 }).limit(limit).populate("userId", "name email avatar").lean();

  return res.status(200).json({
    success: true,
    signIns: events
      .filter((e) => e.userId)
      .map((e) => ({
        ...publicSignIn(e),
        user: { id: e.userId._id, name: e.userId.name, email: e.userId.email, avatar: e.userId.avatar || null },
      })),
  });
};

// POST /admin/users/:userId/credits — top up an account.
export const addCredits = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId) || !(await User.exists({ _id: userId }))) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  await grantCredits(userId, toMicros(req.body.credits));
  const user = await User.findById(userId).select("credits usage").lean();
  return res.status(200).json({ success: true, credits: creditSummary(user) });
};

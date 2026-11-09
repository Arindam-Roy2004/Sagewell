// Auth hardening: no cookie-based access (CSRF), and logout revokes the refresh token.
// Redis and the User model are mocked.
import { describe, test, expect, mock, beforeEach } from "bun:test";
import jwt from "jsonwebtoken";

process.env.JWTSECRET_KEY = process.env.JWTSECRET_KEY || "test-secret";
const SECRET = process.env.JWTSECRET_KEY;
const USER_ID = "64b7f0c2a1b2c3d4e5f60718";

const redisStore = new Map();
mock.module("../shared/libs/redis.js", () => {
  const client = {
    // Supports the SET key value EX ttl [NX] form the app uses.
    set: async (key, value, ...args) => {
      if (args.includes("NX") && redisStore.has(key)) return null;
      redisStore.set(key, value);
      return "OK";
    },
    get: async (key) => (redisStore.has(key) ? redisStore.get(key) : null),
    exists: async (key) => (redisStore.has(key) ? 1 : 0),
  };
  return { getSharedRedisClient: () => client, default: () => client, redisConfig: {} };
});

const user = { _id: USER_ID, name: "T", email: "t@example.com", role: "user", blockedAt: null };
mock.module("../shared/models/user.model.js", () => ({
  default: {
    findById: (id) => ({ select: async () => (String(id) === USER_ID ? { ...user } : null) }),
  },
}));
mock.module("../shared/libs/activity.js", () => ({ touchActivity: () => {}, recordSignIn: async () => {} }));

const { isLoggedIn } = await import("../src/middlewares/auth.middlewares.js");
const { logout, refreshAccessToken } = await import("../src/controllers/user.controllers.js");
const { ROTATION_GRACE_MS } = await import("../src/utils/tokenRevocation.js");

function fakeRes() {
  const res = { statusCode: 200, cookies: {}, cleared: [] };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (p) => ((res.payload = p), res);
  res.cookie = (name, value) => {
    res.cookies[name] = value;
  };
  res.clearCookie = (name) => res.cleared.push(name);
  return res;
}

const access = () => jwt.sign({ id: USER_ID, type: "access" }, SECRET, { expiresIn: "1h" });
const refresh = (jti = "jti-1") => jwt.sign({ id: USER_ID, type: "refresh", jti }, SECRET, { expiresIn: "30d" });

beforeEach(() => redisStore.clear());

describe("isLoggedIn", () => {
  test("accepts a Bearer access token", async () => {
    const req = { headers: { authorization: `Bearer ${access()}` }, cookies: {} };
    let nexted = false;
    await isLoggedIn(req, fakeRes(), () => (nexted = true));
    expect(nexted).toBe(true);
    expect(String(req.user._id)).toBe(USER_ID);
  });

  test("ignores an access token sent only as a cookie (CSRF)", async () => {
    const res = fakeRes();
    let nexted = false;
    await isLoggedIn({ headers: {}, cookies: { token: access() } }, res, () => (nexted = true));
    expect(nexted).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  test("rejects a refresh token used as an access token", async () => {
    const res = fakeRes();
    await isLoggedIn({ headers: { authorization: `Bearer ${refresh()}` }, cookies: {} }, res, () => {});
    expect(res.statusCode).toBe(401);
  });
});

describe("logout and refresh", () => {
  test("refresh works and no longer sets an access-token cookie", async () => {
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: refresh() } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.token).toBeTruthy();
    expect(res.cookies.refreshToken).toBeTruthy();
    expect(res.cookies.token).toBeUndefined();
    expect(jwt.decode(res.cookies.refreshToken).jti).toBeTruthy();
  });

  test("logout with the user's Bearer token revokes that refresh token", async () => {
    const rt = refresh("jti-logout");
    const out = fakeRes();
    await logout({ cookies: { refreshToken: rt }, headers: { authorization: `Bearer ${access()}` } }, out);
    expect(out.statusCode).toBe(200);
    expect(out.cleared).toContain("refreshToken");

    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, res);
    expect(res.statusCode).toBe(401);
  });

  test("an expired access token still proves the logout is genuine", async () => {
    const expired = jwt.sign({ id: USER_ID, type: "access" }, SECRET, { expiresIn: -10 });
    const rt = refresh("jti-expired");
    await logout({ cookies: { refreshToken: rt }, headers: { authorization: `Bearer ${expired}` } }, fakeRes());
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, res);
    expect(res.statusCode).toBe(401);
  });

  test("a cross-site logout (cookie only, no Bearer) clears cookies but revokes nothing", async () => {
    const rt = refresh("jti-csrf");
    await logout({ cookies: { refreshToken: rt }, headers: {} }, fakeRes());
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, res);
    expect(res.statusCode).toBe(200);
  });

  test("logout never revokes using another user's token or a forged one", async () => {
    const rt = refresh("jti-other");
    const otherUser = jwt.sign({ id: "64b7f0c2a1b2c3d4e5f60000", type: "access" }, SECRET);
    const forged = jwt.sign({ id: USER_ID, type: "access" }, "wrong-secret");
    for (const bearer of [otherUser, forged]) {
      await logout({ cookies: { refreshToken: rt }, headers: { authorization: `Bearer ${bearer}` } }, fakeRes());
    }
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, res);
    expect(res.statusCode).toBe(200);
  });

  test("rotation: the old refresh token works during the grace period, then is refused", async () => {
    const rt = refresh("jti-rotate");
    const first = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, first);
    expect(first.statusCode).toBe(200);

    // A second tab refreshing at the same moment with the same cookie still succeeds.
    const concurrent = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, concurrent);
    expect(concurrent.statusCode).toBe(200);

    // The new token issued by the rotation is unaffected.
    const next = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: first.cookies.refreshToken } }, next);
    expect(next.statusCode).toBe(200);

    // After the grace period, the old token is dead.
    const realNow = Date.now;
    try {
      Date.now = () => realNow() + ROTATION_GRACE_MS + 1000;
      const later = fakeRes();
      await refreshAccessToken({ cookies: { refreshToken: rt } }, later);
      expect(later.statusCode).toBe(401);
    } finally {
      Date.now = realNow;
    }
  });

  test("the concurrent refresh doesn't extend the grace period", async () => {
    const rt = refresh("jti-nx");
    await refreshAccessToken({ cookies: { refreshToken: rt } }, fakeRes());
    const scheduled = redisStore.get("auth:revoked-refresh:jti-nx");
    await new Promise((r) => setTimeout(r, 5));
    await refreshAccessToken({ cookies: { refreshToken: rt } }, fakeRes());
    expect(redisStore.get("auth:revoked-refresh:jti-nx")).toBe(scheduled);
  });

  test("logout during the grace period revokes immediately", async () => {
    const rt = refresh("jti-grace-logout");
    await refreshAccessToken({ cookies: { refreshToken: rt } }, fakeRes());
    await logout({ cookies: { refreshToken: rt }, headers: { authorization: `Bearer ${access()}` } }, fakeRes());
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: rt } }, res);
    expect(res.statusCode).toBe(401);
  });

  test("refresh tokens issued before this change (no jti) keep working", async () => {
    const legacy = jwt.sign({ id: USER_ID, type: "refresh" }, SECRET, { expiresIn: "30d" });
    const res = fakeRes();
    await refreshAccessToken({ cookies: { refreshToken: legacy } }, res);
    expect(res.statusCode).toBe(200);
  });
});

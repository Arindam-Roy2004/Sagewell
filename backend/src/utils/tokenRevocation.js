import { getSharedRedisClient } from "../../shared/libs/redis.js";
import { logger } from "../../shared/libs/logger.js";

/**
 * Refresh-token revocation (logout and rotation).
 *
 * Each refresh token carries a random `jti`. A revoked id is stored in Redis, with the time
 * the revocation takes effect, until the token would have expired anyway. So a copied refresh
 * token stops working even though the JWT itself is still validly signed.
 *
 *  - Logout revokes the token immediately. Only that one session ends; the user's other
 *    devices stay signed in.
 *  - Every refresh revokes the token it used, after ROTATION_GRACE_MS. The grace period lets
 *    two tabs that refresh at the same moment with the same cookie both succeed, instead of
 *    one of them signing the user out. After it, an old (e.g. stolen) refresh token is dead.
 *
 * Redis calls are bounded by a short timeout. The shared client queues commands while Redis
 * is unreachable (maxRetriesPerRequest: null), and a Redis blip must not sign every user out,
 * so a check that cannot complete is treated as "not revoked" and logged.
 */
const KEY_PREFIX = "auth:revoked-refresh:";
const REDIS_TIMEOUT_MS = 1500;
export const ROTATION_GRACE_MS = 2 * 60 * 1000;

function withTimeout(promise) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Redis timeout")), REDIS_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Revokes a refresh token id, effective after `graceMs` (0 = now), until `expSeconds` (the
 * JWT's exp claim). An immediate revocation always wins over a pending one; a later rotation
 * never pushes back a revocation that is already scheduled.
 */
export async function revokeRefreshToken(jti, expSeconds, { graceMs = 0 } = {}) {
  if (!jti || !expSeconds) return;
  const ttl = Math.ceil(expSeconds - Date.now() / 1000);
  if (ttl <= 0) return; // already expired
  const key = `${KEY_PREFIX}${jti}`;
  const effectiveAt = String(Date.now() + graceMs);
  try {
    const redis = getSharedRedisClient();
    if (graceMs > 0) {
      await withTimeout(redis.set(key, effectiveAt, "EX", ttl, "NX"));
    } else {
      await withTimeout(redis.set(key, effectiveAt, "EX", ttl));
    }
  } catch (error) {
    logger.error({ err: error }, "Could not revoke refresh token");
  }
}

/** True if this refresh token id is revoked now. Tokens without an id predate revocation. */
export async function isRefreshTokenRevoked(jti) {
  if (!jti) return false;
  try {
    const value = await withTimeout(getSharedRedisClient().get(`${KEY_PREFIX}${jti}`));
    if (value === null || value === undefined) return false;
    const effectiveAt = Number(value);
    // Anything unparseable is treated as an immediate revocation.
    return !Number.isFinite(effectiveAt) || Date.now() >= effectiveAt;
  } catch (error) {
    logger.error({ err: error }, "Could not check refresh token revocation; allowing");
    return false;
  }
}

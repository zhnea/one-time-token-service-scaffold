import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token that expires after ttlSeconds.
 * Returns the tokenId string.
 */
export async function issueToken(payload, ttlSeconds) {
  // 1. Generate 16 random bytes (32 hex characters)
  const tokenId = crypto.randomBytes(16).toString("hex");

  // 2. Serialize payload to JSON
  const value = JSON.stringify(payload);

  // 3. Save atomically with TTL (EX) and set-if-not-exists (NX)
  await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");

  return tokenId;
}

/**
 * Consume a token exactly once using Redis GETDEL.
 * Returns { ok: true, payload } or { ok: false, reason: "invalid" }.
 */
export async function consumeToken(tokenId) {
  // Atomic read + delete
  const value = await redis.getdel(keyFor(tokenId));

  if (value === null) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, payload: JSON.parse(value) };
}

export function closeRedis() {
  return redis.quit();
}
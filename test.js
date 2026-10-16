import assert from "node:assert/strict";
import { issueToken, consumeToken, closeRedis } from "./token-service.js";

async function runTest() {
  try {
    // 1. Issue a token with a 60-second TTL
    const payload = { userId: 42, purpose: "password-reset" };
    const tokenId = await issueToken(payload, 60);
    console.log(`issued token: ${tokenId}`);

    // 2. Fire 5 consume requests concurrently using Promise.all
    const results = await Promise.all([
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
      consumeToken(tokenId),
    ]);

    // 3. Count how many consume attempts succeeded
    const winners = results.filter((result) => result.ok).length;
    console.log(`winners: ${winners}`);

    // 4. Assert that exactly 1 consumer won
    assert.equal(winners, 1, `expected 1 winner, got ${winners}`);
    console.log("PASS: token was single-use.");
  } finally {
    await closeRedis();
  }
}

runTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
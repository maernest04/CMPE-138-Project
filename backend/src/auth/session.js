// SJSU CMPE 138 SPRING 2026 TEAM2
// Signed opaque session cookie (HMAC). Coordinate with Task 3 if you switch to JWT (JSON web token).

const crypto = require("crypto");

const COOKIE_NAME = "scv_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-only-change-in-production";
}

function sign(payload) {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", secret())
    .update(payloadB64)
    .digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = { COOKIE_NAME, sign, verify };

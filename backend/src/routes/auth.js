// SJSU CMPE 138 SPRING 2026 TEAM2
// Minimal login/logout functionalities

const express = require("express");
const { query } = require("../db");
const { hashPassword, verifyPassword } = require("../auth/password");
const { sign, COOKIE_NAME } = require("../auth/session");
const { logEvent, logWarn } = require("../logger");

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post("/login", async (req, res) => {
  const email = (req.body && req.body.email && String(req.body.email).trim()) || "";
  const password = (req.body && req.body.password) || "";

  if (!email || !password) {
    logWarn("auth", "login rejected: missing credentials", { email: email || null });
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const rows = await query(
      `SELECT user_id, email, password_hash, role, student_id
       FROM user_account WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user) {
      logEvent("auth", "login failed: unknown email", { email });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      logEvent("auth", "login failed: bad password", { email, user_id: user.user_id });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = {
      userId: user.user_id,
      role: user.role,
      studentId: user.student_id || null
    };
    const token = sign(payload);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    logEvent("auth", "login success", {
      email,
      user_id: user.user_id,
      role: user.role
    });

    return res.json({
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        studentId: user.student_id
      }
    });
  } catch (err) {
    logWarn("auth", "login error", { email, error: String(err) });
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/logout", (req, res) => {
  const u = req.sessionUser;
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  logEvent("auth", "logout", u ? { user_id: u.userId, role: u.role } : {});
  return res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const u = req.sessionUser;
  if (!u) return res.status(401).json({ user: null });
  return res.json({
    user: {
      userId: u.userId,
      role: u.role,
      studentId: u.studentId
    }
  });
});

module.exports = router;

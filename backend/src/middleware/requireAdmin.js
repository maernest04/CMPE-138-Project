// SJSU CMPE 138 SPRING 2026 TEAM2
function requireAdmin(req, res, next) {
  const u = req.sessionUser;
  if (!u || u.role !== "ADMIN" || !u.userId) {
    return res.status(401).json({ error: "Admin login required" });
  }
  req.userId = u.userId;
  next();
}

module.exports = { requireAdmin };

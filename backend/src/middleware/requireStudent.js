// SJSU CMPE 138 SPRING 2026 TEAM2

function requireStudent(req, res, next) {
  const u = req.sessionUser;
  if (!u || u.role !== "STUDENT" || !u.studentId) {
    return res.status(401).json({ error: "Student login required" });
  }
  req.studentId = u.studentId;
  req.userId = u.userId;
  next();
}

module.exports = { requireStudent };

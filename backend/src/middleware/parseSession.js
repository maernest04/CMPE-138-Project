
const { verify, COOKIE_NAME } = require("../auth/session");

function parseSession(req, res, next) {
  const raw = req.cookies && req.cookies[COOKIE_NAME];
  req.sessionUser = verify(raw) || null;
  next();
}

module.exports = { parseSession, COOKIE_NAME };

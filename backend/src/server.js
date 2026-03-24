// SJSU CMPE 138 SPRING 2026 TEAM2
// Senior Capstone Viewer - Express backend
// React frontend -> Express JSON API -> MySQL (no ORM)

const path = require("path");

// Load .env before ./db (MySQL pool). Tries backend/.env then repo-root .env (root overrides).
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

if (process.env.NODE_ENV !== "production") {
  const hasPw = Boolean(process.env.DB_PASSWORD && String(process.env.DB_PASSWORD).length > 0);
  // eslint-disable-next-line no-console
  console.log(
    `[db] ${process.env.DB_USER || "root"}@${process.env.DB_HOST || "localhost"}/${
      process.env.DB_NAME || "senior_capstone_viewer"
    } — password ${hasPw ? "set" : "EMPTY (MySQL may require DB_PASSWORD in .env)"}`
  );
}

const fs = require("fs");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { query } = require("./db");
const appConfig = require("./appConfig");
const { parseSession } = require("./middleware/parseSession");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

const logDir = path.join(__dirname, "..", "..", "Log");
const logFile = path.join(logDir, "app.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(logFile, { flags: "a" });
app.use(morgan("combined", { stream: accessLogStream }));

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(parseSession);

// Public config for frontend (team size cap, field max lengths)
app.get("/api/config", (_req, res) => {
  res.json({
    maxTeamMembers: appConfig.getMaxTeamMembers(),
    fieldLimits: appConfig.LIMITS
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const rows = await query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok });
  } catch (err) {
    res.status(500).json({ status: "error", error: String(err) });
  }
});

// Example: list advisors with current team count and remaining capacity
app.get("/api/advisors", async (req, res) => {
  try {
    const sql = `
      SELECT a.advisor_id, a.name, a.email, a.department, a.max_teams,
             COUNT(aa.advisor_assignment_id) AS current_teams
      FROM advisor a
      LEFT JOIN advisor_assignment aa ON a.advisor_id = aa.advisor_id
      GROUP BY a.advisor_id, a.name, a.email, a.department, a.max_teams
      ORDER BY a.name
    `;
    const rows = await query(sql);
    const advisors = rows.map((r) => ({
      ...r,
      remaining: Math.max(0, r.max_teams - (r.current_teams || 0))
    }));
    res.json(advisors);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});

// SJSU CMPE 138 SPRING 2026 TEAM2
// Senior Capstone Viewer - Express backend
// React frontend -> Express JSON API -> MySQL (no ORM)

const path = require("path");
const fs = require("fs");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const { query } = require("./db");
const adminRouter = require("./admin");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging to Log/app.log
const logDir = path.join(__dirname, "..", "..", "Log");
const logFile = path.join(logDir, "app.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(logFile, { flags: "a" });
app.use(morgan("combined", { stream: accessLogStream }));

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

// Admin routes (Task 4)
app.use("/api/admin", adminRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});


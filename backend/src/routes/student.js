// Queries for student dashboard, create team, join team — student_id from session only (requireStudent)

const express = require("express");
const { pool, query } = require("../db");
const appConfig = require("../appConfig");
const { requireStudent } = require("../middleware/requireStudent");
const { logEvent, logWarn } = require("../logger");

const router = express.Router();

const MAX_TEAM_MEMBERS = appConfig.getMaxTeamMembers();

router.use(requireStudent);

/* Enrolled sections and whether student already has a team in that section */
router.get("/enrollments", async (req, res) => {
  try {
    const studentId = req.studentId;
    const rows = await query(
      `SELECT ss.section_id, cs.course_code, cs.section_number, sem.year, sem.season,
              (SELECT COUNT(*) FROM team_student ts
               JOIN project_team pt ON pt.team_id = ts.team_id
               WHERE ts.student_id = ? AND pt.section_id = ss.section_id) AS team_count_in_section
       FROM section_student ss
       JOIN course_section cs ON cs.section_id = ss.section_id
       JOIN semester sem ON sem.semester_id = cs.semester_id
       WHERE ss.student_id = ?
       ORDER BY sem.year DESC, sem.season, cs.course_code, cs.section_number`,
      [studentId, studentId]
    );
    res.json(
      rows.map((r) => ({
        sectionId: r.section_id,
        courseCode: r.course_code,
        sectionNumber: r.section_number,
        year: r.year,
        season: r.season,
        onTeamInSection: Number(r.team_count_in_section) > 0
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* Dashboard: teams, teammates, advisors, companies */
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.studentId;

    const teams = await query(
      `SELECT t.team_id, t.team_name, t.section_id, t.company_id, c.company_name,
              cs.course_code, cs.section_number, sem.year, sem.season
       FROM team_student ts
       JOIN project_team t ON t.team_id = ts.team_id
       JOIN course_section cs ON cs.section_id = t.section_id
       JOIN semester sem ON sem.semester_id = cs.semester_id
       LEFT JOIN company c ON c.company_id = t.company_id
       WHERE ts.student_id = ?
       ORDER BY sem.year DESC, sem.season, cs.course_code, t.team_name`,
      [studentId]
    );

    const teamIds = teams.map((t) => t.team_id);
    let teammates = [];
    let advisors = [];

    if (teamIds.length) {
      const ph = teamIds.map(() => "?").join(",");
      teammates = await query(
        `SELECT ts.team_id, st.student_id, st.first_name, st.last_name, st.email, st.major
         FROM team_student ts
         JOIN student st ON st.student_id = ts.student_id
         WHERE ts.team_id IN (${ph})
         ORDER BY ts.team_id, st.last_name, st.first_name`,
        teamIds
      );
      advisors = await query(
        `SELECT aa.team_id, a.advisor_id, a.name, a.email, a.department
         FROM advisor_assignment aa
         JOIN advisor a ON a.advisor_id = aa.advisor_id
         WHERE aa.team_id IN (${ph})
         ORDER BY aa.team_id, a.name`,
        teamIds
      );
    }

    res.json({
      studentId,
      teams: teams.map((t) => ({
        teamId: t.team_id,
        teamName: t.team_name,
        sectionId: t.section_id,
        courseCode: t.course_code,
        sectionNumber: t.section_number,
        year: t.year,
        season: t.season,
        companyId: t.company_id,
        companyName: t.company_name,
        teammates: teammates
          .filter((m) => m.team_id === t.team_id)
          .map((m) => ({
            studentId: m.student_id,
            firstName: m.first_name,
            lastName: m.last_name,
            email: m.email,
            major: m.major
          })),
        advisors: advisors
          .filter((a) => a.team_id === t.team_id)
          .map((a) => ({
            advisorId: a.advisor_id,
            name: a.name,
            email: a.email,
            department: a.department
          }))
      }))
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* Teams in a section the student may join (has capacity, not already on a team in this section) */
router.get("/sections/:sectionId/teams-for-join", async (req, res) => {
  try {
    const studentId = req.studentId;
    const sectionId = Number(req.params.sectionId);
    if (!Number.isFinite(sectionId)) {
      return res.status(400).json({ error: "Invalid section" });
    }

    const enroll = await query(
      `SELECT 1 FROM section_student WHERE student_id = ? AND section_id = ? LIMIT 1`,
      [studentId, sectionId]
    );
    if (!enroll.length) {
      return res.status(403).json({ error: "Not enrolled in this section" });
    }

    const onTeam = await query(
      `SELECT 1 FROM team_student ts
       JOIN project_team pt ON pt.team_id = ts.team_id
       WHERE ts.student_id = ? AND pt.section_id = ? LIMIT 1`,
      [studentId, sectionId]
    );
    if (onTeam.length) {
      return res.status(400).json({ error: "Already on a team in this section" });
    }

    const rows = await query(
      `SELECT t.team_id, t.team_name, t.company_id, c.company_name,
              COUNT(ts.student_id) AS member_count
       FROM project_team t
       LEFT JOIN team_student ts ON ts.team_id = t.team_id
       LEFT JOIN company c ON c.company_id = t.company_id
       WHERE t.section_id = ?
       GROUP BY t.team_id, t.team_name, t.company_id, c.company_name
       HAVING member_count < ?
       ORDER BY t.team_name`,
      [sectionId, MAX_TEAM_MEMBERS]
    );

    res.json(
      rows.map((r) => ({
        teamId: r.team_id,
        teamName: r.team_name,
        companyName: r.company_name,
        memberCount: Number(r.member_count),
        maxMembers: MAX_TEAM_MEMBERS
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * Create a new team in a section (student must be enrolled, not already on a team there).
 * Body: { teamName, sectionId } — section from UI limited to enrollments from GET /enrollments
 */
router.post("/teams/create", async (req, res) => {
  const studentId = req.studentId;
  const teamName = (req.body && req.body.teamName && String(req.body.teamName).trim()) || "";
  const sectionId = req.body && Number(req.body.sectionId);

  if (!teamName || !Number.isFinite(sectionId)) {
    return res.status(400).json({ error: "teamName and sectionId required" });
  }

    let conn;
  try {
    const enroll = await query(
      `SELECT 1 FROM section_student WHERE student_id = ? AND section_id = ? LIMIT 1`,
      [studentId, sectionId]
    );
    if (!enroll.length) {
      logWarn("student", "create team denied: not enrolled", { studentId, sectionId });
      return res.status(403).json({ error: "Not enrolled in this section" });
    }

    const onTeam = await query(
      `SELECT 1 FROM team_student ts
       JOIN project_team pt ON pt.team_id = ts.team_id
       WHERE ts.student_id = ? AND pt.section_id = ? LIMIT 1`,
      [studentId, sectionId]
    );
    if (onTeam.length) {
      logWarn("student", "create team denied: already on team", { studentId, sectionId });
      return res.status(400).json({ error: "Already on a team in this section" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [ins] = await conn.execute(
      `INSERT INTO project_team (team_name, section_id, company_id) VALUES (?, ?, NULL)`,
      [teamName, sectionId]
    );
    const teamId = ins.insertId;

    await conn.execute(`INSERT INTO team_student (team_id, student_id) VALUES (?, ?)`, [
      teamId,
      studentId
    ]);

    await conn.commit();
    conn.release();
    conn = null;

    logEvent("student", "created team", {
      studentId,
      teamId,
      teamName,
      sectionId
    });

    return res.status(201).json({ teamId, teamName, sectionId });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
      conn.release();
    }
    if (err && err.code === "ER_DUP_ENTRY") {
      logWarn("student", "create team failed: duplicate name", { studentId, sectionId, teamName });
      return res.status(409).json({ error: "Team name already used in this section" });
    }
    logWarn("student", "create team error", { studentId, error: String(err) });
    return res.status(500).json({ error: String(err) });
  }
});

/* Join an existing team. Body: { teamId } */
router.post("/teams/join", async (req, res) => {
  const studentId = req.studentId;
  const teamId = req.body && Number(req.body.teamId);
  if (!Number.isFinite(teamId)) {
    return res.status(400).json({ error: "teamId required" });
  }

  try {
    const teamRows = await query(
      `SELECT team_id, team_name, section_id FROM project_team WHERE team_id = ? LIMIT 1`,
      [teamId]
    );
    const team = teamRows[0];
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const enroll = await query(
      `SELECT 1 FROM section_student WHERE student_id = ? AND section_id = ? LIMIT 1`,
      [studentId, team.section_id]
    );
    if (!enroll.length) {
      logWarn("student", "join team denied: not enrolled", {
        studentId,
        teamId,
        sectionId: team.section_id
      });
      return res.status(403).json({ error: "Not enrolled in this section" });
    }

    const onTeam = await query(
      `SELECT 1 FROM team_student ts
       JOIN project_team pt ON pt.team_id = ts.team_id
       WHERE ts.student_id = ? AND pt.section_id = ? LIMIT 1`,
      [studentId, team.section_id]
    );
    if (onTeam.length) {
      return res.status(400).json({ error: "Already on a team in this section" });
    }

    const cntRows = await query(
      `SELECT COUNT(*) AS n FROM team_student WHERE team_id = ?`,
      [teamId]
    );
    if (Number(cntRows[0].n) >= MAX_TEAM_MEMBERS) {
      return res.status(400).json({ error: "Team is full" });
    }

    await query(`INSERT INTO team_student (team_id, student_id) VALUES (?, ?)`, [
      teamId,
      studentId
    ]);

    logEvent("student", "joined team", {
      studentId,
      teamId,
      teamName: team.team_name,
      sectionId: team.section_id
    });

    return res.json({ ok: true, teamId, teamName: team.team_name });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Already a member of this team" });
    }
    logWarn("student", "join team error", { studentId, error: String(err) });
    return res.status(500).json({ error: String(err) });
  }
});

/* Leave a team in student's own section. Body: { teamId } */
router.post("/teams/leave", async (req, res) => {
  const studentId = req.studentId;
  const teamId = req.body && Number(req.body.teamId);
  if (!Number.isFinite(teamId)) {
    return res.status(400).json({ error: "teamId required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [teamRows] = await conn.execute(
      `SELECT team_id, team_name, section_id FROM project_team WHERE team_id = ? LIMIT 1`,
      [teamId]
    );
    const team = teamRows[0];
    if (!team) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: "Team not found" });
    }

    const [memberRows] = await conn.execute(
      `SELECT 1 FROM team_student WHERE team_id = ? AND student_id = ? LIMIT 1`,
      [teamId, studentId]
    );
    if (!memberRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: "You are not a member of this team" });
    }

    await conn.execute(`DELETE FROM team_student WHERE team_id = ? AND student_id = ?`, [
      teamId,
      studentId
    ]);

    const [cntRows] = await conn.execute(`SELECT COUNT(*) AS n FROM team_student WHERE team_id = ?`, [
      teamId
    ]);
    const remainingMembers = Number(cntRows[0].n);
    let deletedTeam = false;

    // Cleanup: remove empty team shell once the last member leaves.
    if (remainingMembers === 0) {
      await conn.execute(`DELETE FROM project_team WHERE team_id = ?`, [teamId]);
      deletedTeam = true;
    }

    await conn.commit();
    conn.release();
    conn = null;

    logEvent("student", "left team", {
      studentId,
      teamId,
      teamName: team.team_name,
      sectionId: team.section_id,
      deletedTeam
    });

    return res.json({ ok: true, teamId, teamName: team.team_name, deletedTeam });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
      conn.release();
    }
    logWarn("student", "leave team error", { studentId, teamId, error: String(err) });
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;

const express = require("express");
const { pool, query } = require("../db");
const appConfig = require("../appConfig");
const { hashPassword } = require("../auth/password");
const { requireAdmin } = require("../middleware/requireAdmin");
const { logEvent, logWarn } = require("../logger");

const router = express.Router();

const MAX_TEAM_MEMBERS = appConfig.getMaxTeamMembers();
const LIMITS = appConfig.LIMITS;

/** 9-digit IDs used for student_id and advisor_id in this schema */
function isNineDigitId(id) {
  return typeof id === "string" && /^\d{9}$/.test(id);
}

router.use(requireAdmin);

async function sectionIsManagedByAdmin(userId, sectionId) {
  const rows = await query(
    `SELECT 1
     FROM course_section_admin
     WHERE user_id = ? AND section_id = ?
     LIMIT 1`,
    [userId, sectionId]
  );
  return rows.length > 0;
}

async function getManagedTeam(userId, teamId) {
  const rows = await query(
    `SELECT t.team_id, t.team_name, t.section_id
     FROM project_team t
     JOIN course_section_admin csa ON csa.section_id = t.section_id
     WHERE csa.user_id = ? AND t.team_id = ?
     LIMIT 1`,
    [userId, teamId]
  );
  return rows[0] || null;
}

router.get("/sections", async (req, res) => {
  try {
    const rows = await query(
      `SELECT section_id, course_code, section_number, year, season
       FROM admin_sections_v
       WHERE user_id = ?
       ORDER BY year DESC, season, course_code, section_number`,
      [req.userId]
    );
    res.json(
      rows.map((r) => ({
        sectionId: r.section_id,
        courseCode: r.course_code,
        sectionNumber: r.section_number,
        year: r.year,
        season: r.season
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/sections/:sectionId/students", async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isFinite(sectionId)) {
      return res.status(400).json({ error: "Invalid section" });
    }
    const allowed = await sectionIsManagedByAdmin(req.userId, sectionId);
    if (!allowed) {
      return res.status(403).json({ error: "Section not managed by current admin" });
    }

    const rows = await query(
      `SELECT st.student_id, st.first_name, st.last_name, st.email, st.major
       FROM section_student ss
       JOIN student st ON st.student_id = ss.student_id
       WHERE ss.section_id = ?
       ORDER BY st.last_name, st.first_name`,
      [sectionId]
    );

    res.json(
      rows.map((r) => ({
        studentId: r.student_id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        major: r.major
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/sections/:sectionId/students", async (req, res) => {
  let conn;
  try {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isFinite(sectionId)) {
      return res.status(400).json({ error: "Invalid section" });
    }
    const allowed = await sectionIsManagedByAdmin(req.userId, sectionId);
    if (!allowed) {
      return res.status(403).json({ error: "Section not managed by current admin" });
    }

    const studentId = req.body && String(req.body.studentId || "").trim();
    const firstName = req.body && String(req.body.firstName || "").trim();
    const lastName = req.body && String(req.body.lastName || "").trim();
    const email = req.body && String(req.body.email || "").trim();
    const major = req.body && String(req.body.major || "").trim();
    const loginEmailRaw = req.body && String(req.body.loginEmail || "").trim();
    const password = req.body && String(req.body.password || "");
    const hasStudentCreateFields = Boolean(firstName || lastName || email || major || loginEmailRaw || password);

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }
    if (!isNineDigitId(studentId)) {
      return res.status(400).json({ error: "studentId must be exactly 9 digits" });
    }
    if (password && password.length > 72) {
      return res.status(400).json({ error: "password max 72 characters" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [existingRows] = await conn.execute(`SELECT student_id, email FROM student WHERE student_id = ? LIMIT 1`, [
      studentId
    ]);
    const existing = existingRows[0] || null;
    let studentEmail = existing ? String(existing.email || "") : email;

    if (!existing) {
      if (!firstName || !lastName || !email || !major) {
        await conn.rollback();
        return res.status(400).json({
          error: "For a new student, firstName, lastName, email, and major are required"
        });
      }
      if (firstName.length > LIMITS.firstName || lastName.length > LIMITS.lastName) {
        await conn.rollback();
        return res.status(400).json({
          error: `firstName max ${LIMITS.firstName} chars, lastName max ${LIMITS.lastName} chars`
        });
      }
      if (email.length > LIMITS.studentEmail) {
        await conn.rollback();
        return res.status(400).json({ error: `email max ${LIMITS.studentEmail} characters` });
      }
      if (major.length > LIMITS.major) {
        await conn.rollback();
        return res.status(400).json({ error: `major max ${LIMITS.major} characters` });
      }
      if (!password) {
        await conn.rollback();
        return res.status(400).json({ error: "password is required for a new student account" });
      }
      await conn.execute(
        `INSERT INTO student (student_id, first_name, last_name, email, major)
         VALUES (?, ?, ?, ?, ?)`,
        [studentId, firstName, lastName, email, major]
      );
      studentEmail = email;
      logEvent("admin", "created student", {
        action: "student.create",
        userId: req.userId,
        sectionId,
        studentId
      });
    }

    const shouldEnsureStudentLogin = !existing || hasStudentCreateFields;
    if (shouldEnsureStudentLogin) {
      const [accountRows] = await conn.execute(
        `SELECT user_id FROM user_account WHERE student_id = ? LIMIT 1`,
        [studentId]
      );
      if (!accountRows.length) {
        if (!password) {
          await conn.rollback();
          return res.status(400).json({ error: "password is required to create a student login account" });
        }
        const loginEmail = loginEmailRaw || studentEmail;
        if (!loginEmail) {
          await conn.rollback();
          return res.status(400).json({ error: "loginEmail required when student has no email" });
        }
        if (loginEmail.length > LIMITS.studentEmail) {
          await conn.rollback();
          return res.status(400).json({ error: `loginEmail max ${LIMITS.studentEmail} characters` });
        }
        const passwordHash = await hashPassword(password);
        await conn.execute(
          `INSERT INTO user_account (email, password_hash, role, student_id, advisor_id)
           VALUES (?, ?, 'STUDENT', ?, NULL)`,
          [loginEmail, passwordHash, studentId]
        );
        logEvent("admin", "created student account", {
          action: "user_account.create_student",
          userId: req.userId,
          sectionId,
          studentId
        });
      }
    }

    await conn.execute(`INSERT INTO section_student (section_id, student_id) VALUES (?, ?)`, [sectionId, studentId]);
    logEvent("admin", "enrolled student", {
      action: "section.enroll_student",
      userId: req.userId,
      sectionId,
      studentId
    });
    await conn.commit();
    return res.status(201).json({ ok: true, sectionId, studentId });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Student already exists or already enrolled in this section" });
    }
    logWarn("admin", "add student error", { userId: req.userId, error: String(err) });
    return res.status(500).json({ error: String(err) });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/sections/:sectionId/teams", async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isFinite(sectionId)) {
      return res.status(400).json({ error: "Invalid section" });
    }
    const allowed = await sectionIsManagedByAdmin(req.userId, sectionId);
    if (!allowed) {
      return res.status(403).json({ error: "Section not managed by current admin" });
    }

    const teams = await query(
      `SELECT t.team_id, t.team_name, t.company_id, c.company_name
       FROM project_team t
       LEFT JOIN company c ON c.company_id = t.company_id
       WHERE t.section_id = ?
       ORDER BY t.team_name`,
      [sectionId]
    );

    const teamIds = teams.map((t) => t.team_id);
    let members = [];
    let advisors = [];
    if (teamIds.length) {
      const ph = teamIds.map(() => "?").join(",");
      members = await query(
        `SELECT ts.team_id, st.student_id, st.first_name, st.last_name
         FROM team_student ts
         JOIN student st ON st.student_id = ts.student_id
         WHERE ts.team_id IN (${ph})
         ORDER BY ts.team_id, st.last_name, st.first_name`,
        teamIds
      );
      advisors = await query(
        `SELECT aa.team_id, a.advisor_id, a.name
         FROM advisor_assignment aa
         JOIN advisor a ON a.advisor_id = aa.advisor_id
         WHERE aa.team_id IN (${ph})
         ORDER BY aa.team_id, a.name`,
        teamIds
      );
    }

    res.json(
      teams.map((t) => {
        const mem = members.filter((m) => m.team_id === t.team_id);
        return {
          teamId: t.team_id,
          teamName: t.team_name,
          companyId: t.company_id,
          companyName: t.company_name,
          memberCount: mem.length,
          maxMembers: MAX_TEAM_MEMBERS,
          members: mem.map((m) => ({
            studentId: m.student_id,
            name: `${m.first_name} ${m.last_name}`
          })),
          advisors: advisors
            .filter((a) => a.team_id === t.team_id)
            .map((a) => ({ advisorId: a.advisor_id, name: a.name }))
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/sections/:sectionId/teams", async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    const teamName = req.body && String(req.body.teamName || "").trim();
    if (!Number.isFinite(sectionId) || !teamName) {
      return res.status(400).json({ error: "Valid sectionId and teamName are required" });
    }
    if (teamName.length > LIMITS.teamName) {
      return res.status(400).json({ error: `teamName max ${LIMITS.teamName} characters` });
    }
    const allowed = await sectionIsManagedByAdmin(req.userId, sectionId);
    if (!allowed) {
      return res.status(403).json({ error: "Section not managed by current admin" });
    }
    const ins = await query(`INSERT INTO project_team (team_name, section_id, company_id) VALUES (?, ?, NULL)`, [
      teamName,
      sectionId
    ]);
    logEvent("admin", "created team", {
      action: "team.create",
      userId: req.userId,
      sectionId,
      teamName,
      teamId: ins.insertId
    });
    return res.status(201).json({ teamId: ins.insertId, teamName, sectionId });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Team name already used in this section" });
    }
    logWarn("admin", "create team error", { userId: req.userId, error: String(err) });
    return res.status(500).json({ error: String(err) });
  }
});

router.put("/teams/:teamId", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });

    const teamName = req.body && req.body.teamName !== undefined ? String(req.body.teamName).trim() : null;
    const companyIdRaw = req.body && req.body.companyId;
    const companyId =
      companyIdRaw === null || companyIdRaw === "" || companyIdRaw === undefined ? null : Number(companyIdRaw);

    if (teamName === null && companyIdRaw === undefined) {
      return res.status(400).json({ error: "Provide teamName and/or companyId" });
    }
    if (companyIdRaw !== undefined && companyId !== null && !Number.isFinite(companyId)) {
      return res.status(400).json({ error: "Invalid companyId" });
    }

    if (teamName !== null) {
      if (!teamName) {
        return res.status(400).json({ error: "teamName cannot be empty" });
      }
      if (teamName.length > LIMITS.teamName) {
        return res.status(400).json({ error: `teamName max ${LIMITS.teamName} characters` });
      }
      await query(`UPDATE project_team SET team_name = ? WHERE team_id = ?`, [teamName, teamId]);
    }
    if (companyIdRaw !== undefined) {
      if (companyId !== null) {
        const c = await query(`SELECT 1 FROM company WHERE company_id = ? LIMIT 1`, [companyId]);
        if (!c.length) {
          return res.status(404).json({ error: "Company not found" });
        }
      }
      await query(`UPDATE project_team SET company_id = ? WHERE team_id = ?`, [companyId, teamId]);
    }
    logEvent("admin", "updated team", {
      action: "team.update",
      userId: req.userId,
      teamId,
      sectionId: team.section_id
    });
    return res.json({ ok: true, teamId });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Team name already used in this section" });
    }
    if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid company reference" });
    }
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/teams/:teamId", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });
    await query(`DELETE FROM project_team WHERE team_id = ?`, [teamId]);
    logEvent("admin", "deleted team", {
      action: "team.delete",
      userId: req.userId,
      teamId,
      sectionId: team.section_id
    });
    return res.json({ ok: true, teamId });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/teams/:teamId/members", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const studentId = req.body && String(req.body.studentId || "").trim();
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    if (!isNineDigitId(studentId)) {
      return res.status(400).json({ error: "studentId must be exactly 9 digits" });
    }
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });

    const enrolled = await query(
      `SELECT 1 FROM section_student WHERE section_id = ? AND student_id = ? LIMIT 1`,
      [team.section_id, studentId]
    );
    if (!enrolled.length) {
      return res.status(400).json({ error: "Student is not enrolled in this team's section" });
    }

    const onOtherTeam = await query(
      `SELECT 1 FROM team_student ts
       JOIN project_team pt ON pt.team_id = ts.team_id
       WHERE ts.student_id = ? AND pt.section_id = ? AND pt.team_id <> ?
       LIMIT 1`,
      [studentId, team.section_id, teamId]
    );
    if (onOtherTeam.length) {
      return res.status(400).json({
        error: "Student is already on another team in this section (one team per student per section)"
      });
    }

    const cntRows = await query(`SELECT COUNT(*) AS n FROM team_student WHERE team_id = ?`, [teamId]);
    if (Number(cntRows[0].n) >= MAX_TEAM_MEMBERS) {
      return res.status(400).json({ error: `Team is full (max ${MAX_TEAM_MEMBERS} members)` });
    }

    await query(`INSERT INTO team_student (team_id, student_id) VALUES (?, ?)`, [teamId, studentId]);
    logEvent("admin", "added team member", {
      action: "team.add_member",
      userId: req.userId,
      teamId,
      studentId
    });
    return res.status(201).json({ ok: true, teamId, studentId });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Student already in this team" });
    }
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/teams/:teamId/members/:studentId", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const studentId = String(req.params.studentId);
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });
    const [result] = await pool.execute(`DELETE FROM team_student WHERE team_id = ? AND student_id = ?`, [
      teamId,
      studentId
    ]);
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Student is not on this team" });
    }
    logEvent("admin", "removed team member", {
      action: "team.remove_member",
      userId: req.userId,
      teamId,
      studentId
    });
    return res.json({ ok: true, teamId, studentId });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/teams/:teamId/advisors", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const advisorId = req.body && String(req.body.advisorId || "").trim();
    if (!advisorId) return res.status(400).json({ error: "advisorId required" });
    if (!isNineDigitId(advisorId)) {
      return res.status(400).json({ error: "advisorId must be exactly 9 digits" });
    }
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });

    const advRows = await query(
      `SELECT advisor_id, max_teams FROM advisor WHERE advisor_id = ? LIMIT 1`,
      [advisorId]
    );
    if (!advRows.length) {
      return res.status(404).json({ error: "Advisor not found" });
    }
    const loadRows = await query(
      `SELECT COUNT(*) AS n FROM advisor_assignment WHERE advisor_id = ?`,
      [advisorId]
    );
    const current = Number(loadRows[0].n);
    const maxTeams = Number(advRows[0].max_teams);
    if (current >= maxTeams) {
      return res.status(400).json({
        error: `Advisor is at capacity (${maxTeams} team${maxTeams === 1 ? "" : "s"} max)`
      });
    }

    await query(`INSERT INTO advisor_assignment (advisor_id, team_id) VALUES (?, ?)`, [advisorId, teamId]);
    logEvent("admin", "assigned advisor", { userId: req.userId, teamId, advisorId });
    return res.status(201).json({ ok: true, teamId, advisorId });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Advisor already assigned to this team" });
    }
    if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid advisor reference" });
    }
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/teams/:teamId/advisors/:advisorId", async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const advisorId = String(req.params.advisorId);
    const team = await getManagedTeam(req.userId, teamId);
    if (!team) return res.status(403).json({ error: "Team not in a managed section" });
    const [result] = await pool.execute(
      `DELETE FROM advisor_assignment WHERE team_id = ? AND advisor_id = ?`,
      [teamId, advisorId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Advisor is not assigned to this team" });
    }
    logEvent("admin", "unassigned advisor", {
      action: "team.unassign_advisor",
      userId: req.userId,
      teamId,
      advisorId
    });
    return res.json({ ok: true, teamId, advisorId });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get("/advisors", async (_req, res) => {
  try {
    const rows = await query(
      `SELECT advisor_id, name, email, department, max_teams, current_teams, remaining_capacity
       FROM advisor_capacity_v
       ORDER BY name`
    );
    res.json(
      rows.map((r) => ({
        advisorId: r.advisor_id,
        name: r.name,
        email: r.email,
        department: r.department,
        maxTeams: r.max_teams,
        currentTeams: Number(r.current_teams),
        remaining: Number(r.remaining_capacity),
        availabilityStatus: r.availability_status ?? r.AVAILABILITY_STATUS
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/companies", async (_req, res) => {
  try {
    const rows = await query(
      `SELECT company_id, company_name, contact_name, contact_email
       FROM company
       ORDER BY company_name`
    );
    res.json(
      rows.map((r) => ({
        companyId: r.company_id,
        companyName: r.company_name,
        contactName: r.contact_name,
        contactEmail: r.contact_email
      }))
    );
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;

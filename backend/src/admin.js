// SJSU CMPE 138 SPRING 2026 TEAM2
// Admin Features Router
// Handles professor/admin operations: sections, students, teams, advisors, companies

const express = require('express');
const { query } = require('./db');

const router = express.Router();

// ============================================================================
// MIDDLEWARE: Admin Authentication Guard
// ============================================================================
// TODO: Replace with real auth from Task 3 (get_current_user + require_admin)
// For now, extracts admin_id from header for development/demo
async function requireAdmin(req, res, next) {
  try {
    // Development: extract admin_id from X-Admin-ID header
    const adminId = req.headers['x-admin-id'];
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    req.adminId = adminId;
    next();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
// GET /api/admin/dashboard
// Returns: sections managed by this admin, student/team counts, etc.
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const adminId = req.adminId;

    // Get admin's managed sections with metadata
    const sql = `
      SELECT
        cs.section_id,
        cs.course_code,
        cs.section_number,
        s.year,
        s.season,
        COUNT(DISTINCT st.student_id) AS student_count,
        COUNT(DISTINCT pt.team_id) AS team_count
      FROM course_section cs
      JOIN semester s ON s.semester_id = cs.semester_id
      LEFT JOIN student st ON st.student_id IN (
        SELECT ts.student_id FROM team_student ts
        JOIN project_team pt ON pt.team_id = ts.team_id
        WHERE pt.section_id = cs.section_id
      )
      LEFT JOIN project_team pt ON pt.section_id = cs.section_id
      WHERE cs.section_id IN (
        SELECT section_id FROM course_section_admin WHERE admin_id = ?
      )
      GROUP BY cs.section_id, cs.course_code, cs.section_number, s.year, s.season
      ORDER BY s.year DESC, s.season DESC, cs.course_code, cs.section_number
    `;

    const sections = await query(sql, [adminId]);

    res.json({
      admin_id: adminId,
      sections: sections,
      total_sections: sections.length
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ============================================================================
// SECTION MANAGEMENT
// ============================================================================

// GET /api/admin/sections/:sectionId/students
// Returns: all students enrolled in this section
router.get('/sections/:sectionId/students', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const adminId = req.adminId;

    // Verify admin manages this section
    const canAccess = await query(
      'SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?',
      [adminId, sectionId]
    );
    if (canAccess.length === 0) {
      return res.status(403).json({ error: 'Access denied to this section' });
    }

    // Get students in section (via teams)
    const sql = `
      SELECT DISTINCT
        st.student_id,
        st.first_name,
        st.last_name,
        st.email,
        st.major,
        pt.team_id,
        pt.team_name,
        COUNT(DISTINCT ts2.student_id) AS team_size
      FROM course_section cs
      LEFT JOIN project_team pt ON pt.section_id = cs.section_id
      LEFT JOIN team_student ts ON ts.team_id = pt.team_id
      LEFT JOIN student st ON st.student_id = ts.student_id
      LEFT JOIN team_student ts2 ON ts2.team_id = pt.team_id
      WHERE cs.section_id = ?
      GROUP BY st.student_id, st.first_name, st.last_name, st.email, st.major,
               pt.team_id, pt.team_name
      ORDER BY st.last_name, st.first_name
    `;

    const students = await query(sql, [sectionId]);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/admin/sections/:sectionId/students/unassigned
// Returns: students NOT yet on any team in this section
router.get('/sections/:sectionId/students/unassigned', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const adminId = req.adminId;

    // Verify admin manages this section
    const canAccess = await query(
      'SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?',
      [adminId, sectionId]
    );
    if (canAccess.length === 0) {
      return res.status(403).json({ error: 'Access denied to this section' });
    }

    // Get all students NOT on a team in this section
    const sql = `
      SELECT st.student_id, st.first_name, st.last_name, st.email, st.major
      FROM student st
      WHERE st.student_id NOT IN (
        SELECT DISTINCT ts.student_id
        FROM team_student ts
        JOIN project_team pt ON pt.team_id = ts.team_id
        WHERE pt.section_id = ?
      )
      ORDER BY st.last_name, st.first_name
    `;

    const students = await query(sql, [sectionId]);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/sections/:sectionId/students/add
// Body: { student_id, team_id (optional) }
// Adds student to section (optionally to a team)
router.post('/sections/:sectionId/students/add', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { student_id, team_id } = req.body;
    const adminId = req.adminId;

    // Verify admin manages this section
    const canAccess = await query(
      'SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?',
      [adminId, sectionId]
    );
    if (canAccess.length === 0) {
      return res.status(403).json({ error: 'Access denied to this section' });
    }

    // If team_id provided, add to team; otherwise, just verify section exists
    if (team_id) {
      // Verify team is in this section
      const teamExists = await query(
        'SELECT 1 FROM project_team WHERE team_id = ? AND section_id = ?',
        [team_id, sectionId]
      );
      if (teamExists.length === 0) {
        return res.status(400).json({ error: 'Team not found in this section' });
      }

      // Check student not already on a team in this section
      const alreadyOnTeam = await query(
        `SELECT 1 FROM team_student ts
         JOIN project_team pt ON pt.team_id = ts.team_id
         WHERE ts.student_id = ? AND pt.section_id = ?`,
        [student_id, sectionId]
      );
      if (alreadyOnTeam.length > 0) {
        return res.status(400).json({ error: 'Student already on a team in this section' });
      }

      // Add to team
      await query(
        'INSERT IGNORE INTO team_student (team_id, student_id) VALUES (?, ?)',
        [team_id, student_id]
      );
    }

    res.json({ success: true, student_id, team_id: team_id || null });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ============================================================================
// TEAM MANAGEMENT (CRUD)
// ============================================================================

// GET /api/admin/sections/:sectionId/teams
// Returns: all teams in a section with member counts
router.get('/sections/:sectionId/teams', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const adminId = req.adminId;

    // Verify admin manages this section
    const canAccess = await query(
      'SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?',
      [adminId, sectionId]
    );
    if (canAccess.length === 0) {
      return res.status(403).json({ error: 'Access denied to this section' });
    }

    const sql = `
      SELECT
        pt.team_id,
        pt.team_name,
        c.company_id,
        c.company_name,
        COUNT(DISTINCT ts.student_id) AS member_count,
        COUNT(DISTINCT aa.advisor_assignment_id) AS advisor_count
      FROM project_team pt
      LEFT JOIN company c ON c.company_id = pt.company_id
      LEFT JOIN team_student ts ON ts.team_id = pt.team_id
      LEFT JOIN advisor_assignment aa ON aa.team_id = pt.team_id
      WHERE pt.section_id = ?
      GROUP BY pt.team_id, pt.team_name, c.company_id, c.company_name
      ORDER BY pt.team_name
    `;

    const teams = await query(sql, [sectionId]);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/sections/:sectionId/teams
// Body: { team_name, company_id (optional) }
// Creates a new team
router.post('/sections/:sectionId/teams', requireAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { team_name, company_id } = req.body;
    const adminId = req.adminId;

    if (!team_name || team_name.trim() === '') {
      return res.status(400).json({ error: 'team_name is required' });
    }

    // Verify admin manages this section
    const canAccess = await query(
      'SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?',
      [adminId, sectionId]
    );
    if (canAccess.length === 0) {
      return res.status(403).json({ error: 'Access denied to this section' });
    }

    // Verify company exists if provided
    if (company_id) {
      const companyExists = await query(
        'SELECT 1 FROM company WHERE company_id = ?',
        [company_id]
      );
      if (companyExists.length === 0) {
        return res.status(400).json({ error: 'Company not found' });
      }
    }

    // Create team
    const result = await query(
      'INSERT INTO project_team (team_name, section_id, company_id) VALUES (?, ?, ?)',
      [team_name, sectionId, company_id || null]
    );

    res.json({ success: true, team_id: result.insertId, team_name });
  } catch (err) {
    if (err.message.includes('Duplicate')) {
      res.status(400).json({ error: 'Team name already exists in this section' });
    } else {
      res.status(500).json({ error: String(err) });
    }
  }
});

// PUT /api/admin/teams/:teamId
// Body: { team_name (optional), company_id (optional) }
// Edits a team
router.put('/teams/:teamId', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { team_name, company_id } = req.body;

    const updates = [];
    const values = [];

    if (team_name !== undefined) {
      updates.push('team_name = ?');
      values.push(team_name);
    }
    if (company_id !== undefined) {
      updates.push('company_id = ?');
      values.push(company_id || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(teamId);
    const sql = `UPDATE project_team SET ${updates.join(', ')} WHERE team_id = ?`;

    await query(sql, values);
    res.json({ success: true, team_id: teamId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/admin/teams/:teamId
// Deletes a team (cascades to team_student and advisor_assignment)
router.delete('/teams/:teamId', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;

    await query('DELETE FROM project_team WHERE team_id = ?', [teamId]);

    res.json({ success: true, team_id: teamId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ============================================================================
// TEAM MEMBERSHIP MANAGEMENT
// ============================================================================

// GET /api/admin/teams/:teamId/members
// Returns: all members of a team
router.get('/teams/:teamId/members', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;

    const sql = `
      SELECT
        st.student_id,
        st.first_name,
        st.last_name,
        st.email,
        st.major
      FROM team_student ts
      JOIN student st ON st.student_id = ts.student_id
      WHERE ts.team_id = ?
      ORDER BY st.last_name, st.first_name
    `;

    const members = await query(sql, [teamId]);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/teams/:teamId/members
// Body: { student_id }
// Adds student to team
router.post('/teams/:teamId/members', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    // Verify student exists
    const studentExists = await query(
      'SELECT 1 FROM student WHERE student_id = ?',
      [student_id]
    );
    if (studentExists.length === 0) {
      return res.status(400).json({ error: 'Student not found' });
    }

    // Add to team
    await query(
      'INSERT IGNORE INTO team_student (team_id, student_id) VALUES (?, ?)',
      [teamId, student_id]
    );

    res.json({ success: true, team_id: teamId, student_id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/admin/teams/:teamId/members/:studentId
// Removes student from team
router.delete('/teams/:teamId/members/:studentId', requireAdmin, async (req, res) => {
  try {
    const { teamId, studentId } = req.params;

    await query(
      'DELETE FROM team_student WHERE team_id = ? AND student_id = ?',
      [teamId, studentId]
    );

    res.json({ success: true, team_id: teamId, student_id: studentId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ============================================================================
// ADVISOR ASSIGNMENT
// ============================================================================

// GET /api/admin/advisors
// Returns: all advisors with capacity info
router.get('/advisors', requireAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT
        a.advisor_id,
        a.name,
        a.email,
        a.department,
        a.max_teams,
        COUNT(DISTINCT aa.advisor_assignment_id) AS current_teams,
        GREATEST(a.max_teams - COUNT(DISTINCT aa.advisor_assignment_id), 0) AS remaining_capacity
      FROM advisor a
      LEFT JOIN advisor_assignment aa ON aa.advisor_id = a.advisor_id
      GROUP BY a.advisor_id, a.name, a.email, a.department, a.max_teams
      ORDER BY a.name
    `;

    const advisors = await query(sql);
    res.json(advisors);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/teams/:teamId/advisor
// Body: { advisor_id }
// Assigns advisor to team (with capacity check)
router.post('/teams/:teamId/advisor', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { advisor_id } = req.body;

    if (!advisor_id) {
      return res.status(400).json({ error: 'advisor_id is required' });
    }

    // Check advisor capacity
    const capacityCheck = await query(
      `SELECT a.max_teams, COUNT(DISTINCT aa.advisor_assignment_id) AS current_teams
       FROM advisor a
       LEFT JOIN advisor_assignment aa ON aa.advisor_id = a.advisor_id
       WHERE a.advisor_id = ?
       GROUP BY a.advisor_id, a.max_teams`,
      [advisor_id]
    );

    if (capacityCheck.length === 0) {
      return res.status(400).json({ error: 'Advisor not found' });
    }

    const { max_teams, current_teams } = capacityCheck[0];
    if (current_teams >= max_teams) {
      return res.status(400).json({
        error: `Advisor at capacity (${current_teams}/${max_teams} teams)`
      });
    }

    // Assign advisor to team
    await query(
      'INSERT IGNORE INTO advisor_assignment (advisor_id, team_id) VALUES (?, ?)',
      [advisor_id, teamId]
    );

    res.json({ success: true, team_id: teamId, advisor_id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/admin/teams/:teamId/advisor/:advisorId
// Removes advisor from team
router.delete('/teams/:teamId/advisor/:advisorId', requireAdmin, async (req, res) => {
  try {
    const { teamId, advisorId } = req.params;

    await query(
      'DELETE FROM advisor_assignment WHERE team_id = ? AND advisor_id = ?',
      [teamId, advisorId]
    );

    res.json({ success: true, team_id: teamId, advisor_id: advisorId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ============================================================================
// COMPANY ASSIGNMENT
// ============================================================================

// GET /api/admin/companies
// Returns: all companies
router.get('/companies', requireAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT
        company_id,
        company_name,
        contact_name,
        contact_email,
        COUNT(DISTINCT pt.team_id) AS team_count
      FROM company c
      LEFT JOIN project_team pt ON pt.company_id = c.company_id
      GROUP BY c.company_id, c.company_name, c.contact_name, c.contact_email
      ORDER BY c.company_name
    `;

    const companies = await query(sql);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/admin/teams/:teamId/company
// Body: { company_id }
// Assigns company to team
router.post('/teams/:teamId/company', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    // Verify company exists
    const companyExists = await query(
      'SELECT 1 FROM company WHERE company_id = ?',
      [company_id]
    );
    if (companyExists.length === 0) {
      return res.status(400).json({ error: 'Company not found' });
    }

    // Update team's company
    await query(
      'UPDATE project_team SET company_id = ? WHERE team_id = ?',
      [company_id, teamId]
    );

    res.json({ success: true, team_id: teamId, company_id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/admin/teams/:teamId/company
// Removes company from team
router.delete('/teams/:teamId/company', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;

    await query(
      'UPDATE project_team SET company_id = NULL WHERE team_id = ?',
      [teamId]
    );

    res.json({ success: true, team_id: teamId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;

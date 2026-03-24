-- SJSU CMPE 138 SPRING 2026 TEAM2

-- Canonical queries (copy/paste into routers)
USE senior_capstone_viewer;

-- 1) Advisors with current teams + remaining capacity
SELECT
  advisor_id, name, email, department, max_teams,
  current_teams, remaining_capacity, availability_status
FROM advisor_capacity_v
ORDER BY name;

-- 2) Teams for a given semester/section (filter placeholders shown)
-- Replace ? with your values in application code.
SELECT *
FROM team_overview_v
WHERE year = ? AND season = ? AND course_code = ? AND section_number = ?
ORDER BY team_name;

-- 3) Team members for a team
SELECT *
FROM team_members_v
WHERE team_id = ?
ORDER BY last_name, first_name;

-- 4) Students NOT assigned to any team in a given section
-- This is useful for “Add members to team” UI.
SELECT st.*
FROM student st
WHERE st.student_id NOT IN (
  SELECT ts.student_id
  FROM team_student ts
  JOIN project_team t ON t.team_id = ts.team_id
  WHERE t.section_id = ?
)
ORDER BY st.last_name, st.first_name;

-- 5) Advisor capacity check before assigning a new team
SELECT
  a.max_teams,
  COUNT(aa.advisor_assignment_id) AS current_teams
FROM advisor a
LEFT JOIN advisor_assignment aa ON aa.advisor_id = a.advisor_id
WHERE a.advisor_id = ?
GROUP BY a.advisor_id, a.max_teams;

-- 6) Find user by email for login (Task 3)
SELECT user_id, email, password_hash, role, student_id, advisor_id
FROM user_account
WHERE email = ?;

-- 7) Sections managed by an admin (admin dashboard)
SELECT section_id, course_code, section_number, year, season
FROM admin_sections_v
WHERE user_id = ?
ORDER BY year DESC, season, course_code, section_number;

-- 8) Teams assigned to an advisor (advisor dashboard)
SELECT t.team_id, t.team_name, s.course_code, s.section_number, sem.year, sem.season,
       c.company_name
FROM advisor_assignment aa
JOIN project_team t ON t.team_id = aa.team_id
JOIN course_section s ON s.section_id = t.section_id
JOIN semester sem ON sem.semester_id = s.semester_id
LEFT JOIN company c ON c.company_id = t.company_id
WHERE aa.advisor_id = ?
ORDER BY sem.year DESC, sem.season, t.team_name;

-- 9) Sections a student is enrolled in
SELECT ss.section_id, cs.course_code, cs.section_number, sem.year, sem.season
FROM section_student ss
JOIN course_section cs ON cs.section_id = ss.section_id
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE ss.student_id = ?
ORDER BY sem.year DESC, sem.season, cs.course_code, cs.section_number;

-- 10) Student dashboard — teams + section + company
SELECT t.team_id, t.team_name, t.section_id, t.company_id, c.company_name,
       cs.course_code, cs.section_number, sem.year, sem.season
FROM team_student ts
JOIN project_team t ON t.team_id = ts.team_id
JOIN course_section cs ON cs.section_id = t.section_id
JOIN semester sem ON sem.semester_id = cs.semester_id
LEFT JOIN company c ON c.company_id = t.company_id
WHERE ts.student_id = ?
ORDER BY sem.year DESC, sem.season, cs.course_code, t.team_name;

-- =========================
-- Task 4 admin operations
-- =========================

-- A1) Admin sections (dashboard)
-- Express uses admin_sections_v for GET /api/admin/sections (equivalent join logic).
SELECT section_id, course_code, section_number, year, season
FROM admin_sections_v
WHERE user_id = ?
ORDER BY year DESC, season, course_code, section_number;

-- A2) Students in a managed section
SELECT st.student_id, st.first_name, st.last_name, st.email, st.major
FROM section_student ss
JOIN student st ON st.student_id = ss.student_id
WHERE ss.section_id = ?
ORDER BY st.last_name, st.first_name;

-- A3) Enroll an existing student into section
INSERT INTO section_student (section_id, student_id) VALUES (?, ?);

-- A4) Create new student + enroll into section
INSERT INTO student (student_id, first_name, last_name, email, major)
VALUES (?, ?, ?, ?, ?);
INSERT INTO section_student (section_id, student_id) VALUES (?, ?);

-- A5) Create/edit/delete teams in section
INSERT INTO project_team (team_name, section_id, company_id) VALUES (?, ?, NULL);
UPDATE project_team SET team_name = ?, company_id = ? WHERE team_id = ?;
DELETE FROM project_team WHERE team_id = ?;

-- A6) Team membership management
INSERT INTO team_student (team_id, student_id) VALUES (?, ?);
DELETE FROM team_student WHERE team_id = ? AND student_id = ?;

-- A7) Advisor assignment management
INSERT INTO advisor_assignment (advisor_id, team_id) VALUES (?, ?);
DELETE FROM advisor_assignment WHERE team_id = ? AND advisor_id = ?;

-- A8) Admin API business rules (enforced in Express, same checks in app code)
-- Before adding a student to a team:
--   - Student must be in section_student for that team's section_id
--   - Student must not already be on another team in the same section (one team per student per section)
--   - COUNT(team_student) for that team_id must be < MAX_TEAM_MEMBERS (env, default 5)
-- Before assigning an advisor:
--   - advisor_id must exist in advisor
--   - COUNT(advisor_assignment) for that advisor_id must be < advisor.max_teams
-- Before setting project_team.company_id:
--   - company_id IS NULL or must exist in company
-- Team rename: trimmed team_name must be non-empty; unique per (team_name, section_id)


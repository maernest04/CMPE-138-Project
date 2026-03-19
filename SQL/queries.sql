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

-- ============================================================================
-- TASK 4: ADMIN FEATURES - CANONICAL QUERIES
-- ============================================================================

-- 6) Admin's managed sections with metadata (dashboard)
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
LEFT JOIN project_team pt ON pt.section_id = cs.section_id
LEFT JOIN team_student ts ON ts.team_id = pt.team_id
LEFT JOIN student st ON st.student_id = ts.student_id
WHERE cs.section_id IN (
  SELECT section_id FROM course_section_admin WHERE admin_id = ?
)
GROUP BY cs.section_id, cs.course_code, cs.section_number, s.year, s.season
ORDER BY s.year DESC, s.season DESC, cs.course_code, cs.section_number;

-- 7) All students in a section with team assignments
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
ORDER BY st.last_name, st.first_name;

-- 8) Unassigned students in a section (for "Add to Team" UI)
SELECT st.student_id, st.first_name, st.last_name, st.email, st.major
FROM student st
WHERE st.student_id NOT IN (
  SELECT DISTINCT ts.student_id
  FROM team_student ts
  JOIN project_team pt ON pt.team_id = ts.team_id
  WHERE pt.section_id = ?
)
ORDER BY st.last_name, st.first_name;

-- 9) All teams in a section with member/advisor counts
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
ORDER BY pt.team_name;

-- 10) Team members with full details
SELECT
  st.student_id,
  st.first_name,
  st.last_name,
  st.email,
  st.major
FROM team_student ts
JOIN student st ON st.student_id = ts.student_id
WHERE ts.team_id = ?
ORDER BY st.last_name, st.first_name;

-- 11) All advisors with capacity info
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
ORDER BY a.name;

-- 12) All companies with team assignment counts
SELECT
  c.company_id,
  c.company_name,
  c.contact_name,
  c.contact_email,
  COUNT(DISTINCT pt.team_id) AS team_count
FROM company c
LEFT JOIN project_team pt ON pt.company_id = c.company_id
GROUP BY c.company_id, c.company_name, c.contact_name, c.contact_email
ORDER BY c.company_name;

-- 13) Verify admin has access to section
SELECT 1 FROM course_section_admin WHERE admin_id = ? AND section_id = ?;


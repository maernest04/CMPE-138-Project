-- SJSU CMPE 138 SPRING 2026 TEAM2

-- Views for Senior Capstone Viewer

USE senior_capstone_viewer;

-- Advisor capacity summary (availability is derived)
CREATE OR REPLACE VIEW advisor_capacity_v AS
SELECT
  a.advisor_id,
  a.name,
  a.email,
  a.department,
  a.max_teams,
  COUNT(aa.advisor_assignment_id) AS current_teams,
  GREATEST(a.max_teams - COUNT(aa.advisor_assignment_id), 0) AS remaining_capacity,
  CASE
    WHEN COUNT(aa.advisor_assignment_id) < a.max_teams THEN 'AVAILABLE'
    ELSE 'FULL'
  END AS availability_status
FROM advisor a
LEFT JOIN advisor_assignment aa ON aa.advisor_id = a.advisor_id
GROUP BY a.advisor_id, a.name, a.email, a.department, a.max_teams;

-- Team overview (who/what is on a team)
CREATE OR REPLACE VIEW team_overview_v AS
SELECT
  t.team_id,
  t.team_name,
  t.company_name,
  s.section_id,
  s.course_code,
  s.section_number,
  sem.year,
  sem.season,
  a.advisor_id,
  a.name AS advisor_name
FROM project_team t
JOIN course_section s ON s.section_id = t.section_id
JOIN semester sem ON sem.semester_id = s.semester_id
LEFT JOIN advisor_assignment aa ON aa.team_id = t.team_id
LEFT JOIN advisor a ON a.advisor_id = aa.advisor_id;

-- Student membership list (for “Team Members” screen)
CREATE OR REPLACE VIEW team_members_v AS
SELECT
  t.team_id,
  t.team_name,
  s.section_id,
  s.course_code,
  s.section_number,
  sem.year,
  sem.season,
  st.student_id,
  st.first_name,
  st.last_name,
  st.email,
  st.major
FROM team_student ts
JOIN project_team t ON t.team_id = ts.team_id
JOIN student st ON st.student_id = ts.student_id
JOIN course_section s ON s.section_id = t.section_id
JOIN semester sem ON sem.semester_id = s.semester_id;

-- Sections managed by an admin (for admin dashboard)
CREATE OR REPLACE VIEW admin_sections_v AS
SELECT
  ua.user_id,
  ua.email AS admin_email,
  cs.section_id,
  cs.course_code,
  cs.section_number,
  sem.year,
  sem.season
FROM course_section_admin csa
JOIN user_account ua ON ua.user_id = csa.user_id
JOIN course_section cs ON cs.section_id = csa.section_id
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE ua.role = 'ADMIN';

-- Teams assigned to advisors (for advisor dashboard)
CREATE OR REPLACE VIEW advisor_teams_v AS
SELECT
  a.advisor_id,
  a.name AS advisor_name,
  t.team_id,
  t.team_name,
  t.company_name,
  s.section_id,
  s.course_code,
  s.section_number,
  sem.year,
  sem.season
FROM advisor a
JOIN advisor_assignment aa ON aa.advisor_id = a.advisor_id
JOIN project_team t ON t.team_id = aa.team_id
JOIN course_section s ON s.section_id = t.section_id
JOIN semester sem ON sem.semester_id = s.semester_id;
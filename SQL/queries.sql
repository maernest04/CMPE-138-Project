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


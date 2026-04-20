-- SJSU CMPE 138 SPRING 2026 TEAM2
-- Sample data for development/demo

USE senior_capstone_viewer;

-- Semesters
INSERT INTO semester (year, season) VALUES
  (2026, 'Spring'),
  (2026, 'Fall')
AS new ON DUPLICATE KEY UPDATE year = new.year, season = new.season;

-- Sections (assumes the semesters above exist)
INSERT INTO course_section (course_code, section_number, semester_id)
SELECT 'CMPE195A', '01', semester_id FROM semester WHERE year=2026 AND season='Spring'
ON DUPLICATE KEY UPDATE course_code = course_code;

INSERT INTO course_section (course_code, section_number, semester_id)
SELECT 'CMPE195B', '01', semester_id FROM semester WHERE year=2026 AND season='Spring'
ON DUPLICATE KEY UPDATE course_code = course_code;

-- Advisors (9-digit ID, max_teams defaults to 2)
INSERT INTO advisor (advisor_id, name, email, department) VALUES
  ('111111111', 'Ben Reed', 'ben.reed@sjsu.edu', 'SWE'),
  ('222222222', 'Daphne Chen', 'daphne.chen@sjsu.edu', 'CMPE'),
  ('333333333', 'Charan Bhaskar', 'charan.bhaskar@sjsu.edu', 'CMPE')
AS new ON DUPLICATE KEY UPDATE name = new.name, department = new.department;

-- Students
INSERT INTO student (student_id, first_name, last_name, email, major) VALUES
  ('123456789', 'Nathan', 'Chuop', 'nathan.chuop@sjsu.edu', 'ROBOTICS'),
  ('234567890', 'Paul Brandon', 'Estigoy', 'paul.estigoy@sjsu.edu', 'CMPE'),
  ('345678901', 'Raghav', 'Gautam', 'raghav.gautam@sjsu.edu', 'CMPE'),
  ('456789012', 'Ernest', 'Ma', 'ernest.ma@sjsu.edu', 'CMPE'),
  ('567890123', 'Colin', 'Oliva', 'colin.oliva@sjsu.edu', 'SE')
AS new ON DUPLICATE KEY UPDATE email = new.email, major = new.major;

-- User accounts for login
-- admin: admin123; students: student1..student5
INSERT INTO user_account (email, password_hash, role, student_id) VALUES
  ('admin@sjsu.edu', '$2b$10$dcN3E7/oOORUJ/oiHC4BTe5eosDvIgbW3HGmKbNak9iS9vCkwzlOa', 'ADMIN', NULL),
  ('nathan.chuop@sjsu.edu', '$2b$10$89S8UY.2IqWpKz2SSo2N/OJ/AbLE7/NLZ.uE5UnG0zfXjSh767KlW', 'STUDENT', '123456789'),
  ('paul.estigoy@sjsu.edu', '$2b$10$XcP/0L4Z6Jt9qoPmB51LcubSVp4iqxktUr/JyGm.Vm9cy23d9kCca', 'STUDENT', '234567890'),
  ('raghav.gautam@sjsu.edu', '$2b$10$D5yv4.v0LzPw6SA.G9c4YOUtsC1quq7bU.7TsmQpxT7m7IQbsuiWm', 'STUDENT', '345678901'),
  ('ernest.ma@sjsu.edu', '$2b$10$6qDhrSB4CVEriQYEIo0VaeQN/4SgI65b0F288.DOShW5gtJAdcQnC', 'STUDENT', '456789012'),
  ('colin.oliva@sjsu.edu', '$2b$10$dohFVwWSRTvbkGtIbvVpFuiV.fOTmFYLf4upXuZDT9lO.TUgKUC4K', 'STUDENT', '567890123')
AS new ON DUPLICATE KEY UPDATE password_hash = new.password_hash, role = new.role, student_id = new.student_id;

-- Enroll sample students in CMPE195A-01 (Spring 2026) — required for student create/join team in that section
INSERT IGNORE INTO section_student (section_id, student_id)
SELECT cs.section_id, st.student_id
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
CROSS JOIN student st
WHERE sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code = 'CMPE195A' AND cs.section_number = '01'
  AND st.student_id IN (
    '123456789', '234567890', '345678901', '456789012', '567890123'
  );

-- Admin manages CMPE195A-01 and CMPE195B-01 (Spring 2026)
INSERT IGNORE INTO course_section_admin (user_id, section_id)
SELECT ua.user_id, cs.section_id
FROM user_account ua
CROSS JOIN course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE ua.email = 'admin@sjsu.edu'
  AND sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code IN ('CMPE195A', 'CMPE195B') AND cs.section_number = '01';

-- Teams (in Spring 2026, CMPE195A-01)
INSERT IGNORE INTO project_team (team_name, section_id, company_name)
SELECT 'Team Alpha', cs.section_id, 'Texas Instruments'
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01';

INSERT IGNORE INTO project_team (team_name, section_id, company_name)
SELECT 'Team Beta', cs.section_id, 'KLA'
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01';

INSERT IGNORE INTO project_team (team_name, section_id, company_name)
SELECT 'Team Gamma', cs.section_id, 'Texas Instruments'
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01';

-- Assign students to teams
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '123456789' FROM project_team t WHERE t.team_name='Team Alpha';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '234567890' FROM project_team t WHERE t.team_name='Team Alpha';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '345678901' FROM project_team t WHERE t.team_name='Team Beta';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '456789012' FROM project_team t WHERE t.team_name='Team Beta';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '567890123' FROM project_team t WHERE t.team_name='Team Gamma';

-- Enroll advisors into CMPE195A-01 (Spring 2026) via section_advisor
INSERT IGNORE INTO section_advisor (section_id, advisor_id)
SELECT cs.section_id, a.advisor_id
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
CROSS JOIN advisor a
WHERE sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code = 'CMPE195A' AND cs.section_number = '01'
  AND a.advisor_id IN ('111111111', '222222222', '333333333');

-- Assign advisors to teams (demonstrates capacity counting)
INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '111111111', team_id FROM project_team WHERE team_name='Team Alpha';

INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '222222222', team_id FROM project_team WHERE team_name='Team Beta';

INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '333333333', team_id FROM project_team WHERE team_name='Team Gamma';

-- -------------------------------------------------------
-- CMPE195B-01 (Spring 2026) — Team Chips
-- -------------------------------------------------------

-- Advisor: Ryan Reynolds (max 1 team)
INSERT INTO advisor (advisor_id, name, email, department, max_teams) VALUES
  ('444444444', 'Ryan Reynolds', 'ryan.reynolds@sjsu.edu', 'CMPE', 1)
AS new ON DUPLICATE KEY UPDATE name = new.name, department = new.department, max_teams = new.max_teams;

-- Students
INSERT INTO student (student_id, first_name, last_name, email, major) VALUES
  ('678901234', 'Ryan', 'Gossling', 'ryan.gossling@sjsu.edu', 'Software Engineering'),
  ('789012345', 'Dwayne', 'Johnson', 'dwayne.johnson@sjsu.edu', 'Robotics')
AS new ON DUPLICATE KEY UPDATE email = new.email, major = new.major;

-- User accounts (student6 / student7)
INSERT INTO user_account (email, password_hash, role, student_id) VALUES
  ('ryan.gossling@sjsu.edu',  '$2b$10$Z.XPkENkoJb9Gbs3sP9YZu.PIvM0J5VqCTDrQ2TzWEpniagAaWxQe', 'STUDENT', '678901234'),
  ('dwayne.johnson@sjsu.edu', '$2b$10$3svvXTAZshRNj2DhIHo7KeGhmdgnrEU8drDpmX9lk7rWLC/7DPciy', 'STUDENT', '789012345')
AS new ON DUPLICATE KEY UPDATE password_hash = new.password_hash, role = new.role, student_id = new.student_id;

-- Enroll both students in CMPE195B-01 (Spring 2026)
INSERT IGNORE INTO section_student (section_id, student_id)
SELECT cs.section_id, st.student_id
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
CROSS JOIN student st
WHERE sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code = 'CMPE195B' AND cs.section_number = '01'
  AND st.student_id IN ('678901234', '789012345');

-- Team Chips in CMPE195B-01
INSERT IGNORE INTO project_team (team_name, section_id, company_name)
SELECT 'Team Chips', cs.section_id, NULL
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code = 'CMPE195B' AND cs.section_number = '01';

-- Add members to Team Chips
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '678901234' FROM project_team t WHERE t.team_name = 'Team Chips';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '789012345' FROM project_team t WHERE t.team_name = 'Team Chips';

-- Enroll Ryan Reynolds into CMPE195B-01 via section_advisor
INSERT IGNORE INTO section_advisor (section_id, advisor_id)
SELECT cs.section_id, '444444444'
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year = 2026 AND sem.season = 'Spring'
  AND cs.course_code = 'CMPE195B' AND cs.section_number = '01';

-- Assign Ryan Reynolds as advisor to Team Chips
INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '444444444', team_id FROM project_team WHERE team_name = 'Team Chips';


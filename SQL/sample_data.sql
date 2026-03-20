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

-- Companies
INSERT INTO company (company_name, contact_name, contact_email) VALUES
  ('Texas Instruments', 'Jordan Lee', 'jordan.lee@TI.com'),
  ('KLA', 'Sam Dong', 'sam.dong@KLA.com')
AS new ON DUPLICATE KEY UPDATE contact_name = new.contact_name, contact_email = new.contact_email;

-- Students
INSERT INTO student (student_id, first_name, last_name, email, major) VALUES
  ('123456789', 'Nathan', 'Chuop', 'nathan.chuop@sjsu.edu', 'ROBOTICS'),
  ('234567890', 'Paul Brandon', 'Estigoy', 'paul.estigoy@sjsu.edu', 'CMPE'),
  ('345678901', 'Raghav', 'Gautam', 'raghav.gautam@sjsu.edu', 'CMPE'),
  ('456789012', 'Ernest', 'Ma', 'ernest.ma@sjsu.edu', 'CMPE'),
  ('567890123', 'Colin', 'Oliva', 'colin.oliva@sjsu.edu', 'SE')
AS new ON DUPLICATE KEY UPDATE email = new.email, major = new.major;

-- User accounts for login
-- admin: admin123 (also advisor Ben Reed - manages sections + advises teams); advisors: advisor1, advisor2; students: student1..student5
INSERT INTO user_account (email, password_hash, role, student_id, advisor_id) VALUES
  ('admin@sjsu.edu', '$2b$10$dcN3E7/oOORUJ/oiHC4BTe5eosDvIgbW3HGmKbNak9iS9vCkwzlOa', 'ADMIN', NULL, '111111111'),
  ('daphne.chen@sjsu.edu', '$2b$10$hbOs04iZhnHOWQs05Y0vPewHX/ukujzTzhcSrJbkAoqtHT35RfilG', 'ADVISOR', NULL, '222222222'),
  ('charan.bhaskar@sjsu.edu', '$2b$10$xIwDgvpr6LgswSOM5HlbB.l5arDhJL78Hrde5aKQNpgi7LmVxLT9y', 'ADVISOR', NULL, '333333333'),
  ('nathan.chuop@sjsu.edu', '$2b$10$89S8UY.2IqWpKz2SSo2N/OJ/AbLE7/NLZ.uE5UnG0zfXjSh767KlW', 'STUDENT', '123456789', NULL),
  ('paul.estigoy@sjsu.edu', '$2b$10$XcP/0L4Z6Jt9qoPmB51LcubSVp4iqxktUr/JyGm.Vm9cy23d9kCca', 'STUDENT', '234567890', NULL),
  ('raghav.gautam@sjsu.edu', '$2b$10$D5yv4.v0LzPw6SA.G9c4YOUtsC1quq7bU.7TsmQpxT7m7IQbsuiWm', 'STUDENT', '345678901', NULL),
  ('ernest.ma@sjsu.edu', '$2b$10$6qDhrSB4CVEriQYEIo0VaeQN/4SgI65b0F288.DOShW5gtJAdcQnC', 'STUDENT', '456789012', NULL),
  ('colin.oliva@sjsu.edu', '$2b$10$dohFVwWSRTvbkGtIbvVpFuiV.fOTmFYLf4upXuZDT9lO.TUgKUC4K', 'STUDENT', '567890123', NULL)
AS new ON DUPLICATE KEY UPDATE password_hash = new.password_hash, role = new.role, student_id = new.student_id, advisor_id = new.advisor_id;

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
INSERT IGNORE INTO project_team (team_name, section_id, company_id)
SELECT
  'Team Alpha',
  cs.section_id,
  (SELECT company_id FROM company WHERE company_name='Texas Instruments')
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01';

INSERT IGNORE INTO project_team (team_name, section_id, company_id)
SELECT
  'Team Beta',
  cs.section_id,
  (SELECT company_id FROM company WHERE company_name='KLA')
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01';

INSERT IGNORE INTO project_team (team_name, section_id, company_id)
SELECT
  'Team Gamma',
  cs.section_id,
  (SELECT company_id FROM company WHERE company_name='Texas Instruments')
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

-- Assign advisors to teams (demonstrates capacity counting)
INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '111111111', team_id FROM project_team WHERE team_name='Team Alpha';

INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '222222222', team_id FROM project_team WHERE team_name='Team Beta';

INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT '333333333', team_id FROM project_team WHERE team_name='Team Gamma';


-- SJSU CMPE 138 SPRING 2026 TEAM2
-- Sample data for development/demo

USE senior_capstone_viewer;

-- Semesters
INSERT INTO semester (year, season) VALUES
  (2026, 'Spring'),
  (2026, 'Fall')
ON DUPLICATE KEY UPDATE year = VALUES(year), season = VALUES(season);

-- Sections (assumes the semesters above exist)
INSERT INTO course_section (course_code, section_number, semester_id)
SELECT 'CMPE195A', '01', semester_id FROM semester WHERE year=2026 AND season='Spring'
ON DUPLICATE KEY UPDATE course_code = VALUES(course_code);

INSERT INTO course_section (course_code, section_number, semester_id)
SELECT 'CMPE195B', '01', semester_id FROM semester WHERE year=2026 AND season='Spring'
ON DUPLICATE KEY UPDATE course_code = VALUES(course_code);

-- Advisors (max_teams defaults to 2)
INSERT INTO advisor (name, email, department) VALUES
  ('Ben Reed', 'ben.reed@sjsu.edu', 'SWE'),
  ('Daphne Chen', 'daphne.chen@sjsu.edu', 'CMPE'),
  ('Charan Bhaskar', 'charan.bhaskar@sjsu.edu', 'CMPE')
ON DUPLICATE KEY UPDATE name = VALUES(name), department = VALUES(department);

-- Companies
INSERT INTO company (company_name, contact_name, contact_email) VALUES
  ('Texas Instruments', 'Jordan Lee', 'jordan.lee@TI.com'),
  ('KLA', 'Sam Dong', 'sam.dong@KLA.com')
ON DUPLICATE KEY UPDATE contact_name = VALUES(contact_name), contact_email = VALUES(contact_email);

-- Students
INSERT INTO student (student_id, first_name, last_name, email, major) VALUES
  ('123456789', 'Nathan', 'Chuop', 'nathan.chuop@sjsu.edu', 'CMPE'),
  ('234567890', 'Paul Brandon', 'Estigoy', 'paul.estigoy@sjsu.edu', 'SE'),
  ('345678901', 'Raghav', 'Gautam', 'raghav.gautam@sjsu.edu', 'CMPE'),
  ('456789012', 'Ernest', 'Ma', 'ernest.ma@sjsu.edu', 'CMPE'),
  ('567890123', 'Colin', 'Oliva', 'colin.oliva@sjsu.edu', 'SE')
ON DUPLICATE KEY UPDATE email = VALUES(email), major = VALUES(major);

-- Teams (in Spring 2026, CMPE195A-01)
INSERT INTO project_team (team_name, section_id, company_id)
SELECT
  'Team Alpha',
  cs.section_id,
  (SELECT company_id FROM company WHERE company_name='Acme Robotics')
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01'
ON DUPLICATE KEY UPDATE company_id = VALUES(company_id);

INSERT INTO project_team (team_name, section_id, company_id)
SELECT
  'Team Beta',
  cs.section_id,
  (SELECT company_id FROM company WHERE company_name='CloudWorks')
FROM course_section cs
JOIN semester sem ON sem.semester_id = cs.semester_id
WHERE sem.year=2026 AND sem.season='Spring' AND cs.course_code='CMPE195A' AND cs.section_number='01'
ON DUPLICATE KEY UPDATE company_id = VALUES(company_id);

-- Assign students to teams
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '123456789' FROM project_team t WHERE t.team_name='Team Alpha';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '234567890' FROM project_team t WHERE t.team_name='Team Alpha';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '345678901' FROM project_team t WHERE t.team_name='Team Beta';
INSERT IGNORE INTO team_student (team_id, student_id)
SELECT t.team_id, '456789012' FROM project_team t WHERE t.team_name='Team Beta';

-- Assign advisors to teams (demonstrates capacity counting)
INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT
  (SELECT advisor_id FROM advisor WHERE email='paul.estigoy@sjsu.edu'),
  (SELECT team_id FROM project_team WHERE team_name='Team Alpha');

INSERT IGNORE INTO advisor_assignment (advisor_id, team_id)
SELECT
  (SELECT advisor_id FROM advisor WHERE email='ernest.ma@sjsu.edu'),
  (SELECT team_id FROM project_team WHERE team_name='Team Beta');


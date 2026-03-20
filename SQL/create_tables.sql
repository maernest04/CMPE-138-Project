-- SJSU CMPE 138 SPRING 2026 TEAM2

-- Core schema for Senior Capstone Viewer

CREATE DATABASE IF NOT EXISTS senior_capstone_viewer;
USE senior_capstone_viewer;

-- 1) Semester: Spring/Fall + year
CREATE TABLE IF NOT EXISTS semester (
  semester_id INT AUTO_INCREMENT PRIMARY KEY,
  year        INT NOT NULL,
  season      ENUM('Spring','Fall') NOT NULL,
  UNIQUE KEY uniq_semester (year, season)
) ENGINE=InnoDB;

-- 2) Course section (e.g., CMPE195A-01) per semester
CREATE TABLE IF NOT EXISTS course_section (
  section_id      INT AUTO_INCREMENT PRIMARY KEY,
  course_code     VARCHAR(20) NOT NULL,
  section_number  VARCHAR(10) NOT NULL,
  semester_id     INT NOT NULL,
  CONSTRAINT fk_section_semester
    FOREIGN KEY (semester_id) REFERENCES semester (semester_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uniq_section (course_code, section_number, semester_id)
) ENGINE=InnoDB;

-- 3) Students (9-digit ID, no status)
CREATE TABLE IF NOT EXISTS student (
  student_id CHAR(9) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name  VARCHAR(50) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  major      VARCHAR(50) NOT NULL,
  UNIQUE KEY uniq_student_email (email)
) ENGINE=InnoDB;

-- 3b) Advisors (faculty) with 9-digit ID, capacity = 2 teams by default
CREATE TABLE IF NOT EXISTS advisor (
  advisor_id CHAR(9) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  max_teams  INT NOT NULL DEFAULT 2,
  UNIQUE KEY uniq_advisor_email (email)
) ENGINE=InnoDB;

-- 3c) User accounts for login (ADMIN, STUDENT, or ADVISOR)
CREATE TABLE IF NOT EXISTS user_account (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN','STUDENT','ADVISOR') NOT NULL,
  student_id    CHAR(9) NULL,
  advisor_id    CHAR(9) NULL,
  UNIQUE KEY uniq_user_email (email),
  UNIQUE KEY uniq_user_student (student_id),
  UNIQUE KEY uniq_user_advisor (advisor_id),
  CONSTRAINT fk_user_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_user_advisor
    FOREIGN KEY (advisor_id) REFERENCES advisor (advisor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3d) Admin ↔ course section (which sections an admin manages)
CREATE TABLE IF NOT EXISTS course_section_admin (
  user_id    INT NOT NULL,
  section_id INT NOT NULL,
  PRIMARY KEY (user_id, section_id),
  CONSTRAINT fk_csa_user
    FOREIGN KEY (user_id) REFERENCES user_account (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_csa_section
    FOREIGN KEY (section_id) REFERENCES course_section (section_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) Industry collaborators / companies
CREATE TABLE IF NOT EXISTS company (
  company_id    INT AUTO_INCREMENT PRIMARY KEY,
  company_name  VARCHAR(150) NOT NULL,
  contact_name  VARCHAR(100),
  contact_email VARCHAR(100),
  UNIQUE KEY uniq_company_name (company_name)
) ENGINE=InnoDB;

-- 5) Project teams, per section, optionally linked to a company
CREATE TABLE IF NOT EXISTS project_team (
  team_id    INT AUTO_INCREMENT PRIMARY KEY,
  team_name  VARCHAR(100) NOT NULL,
  section_id INT NOT NULL,
  company_id INT NULL,
  CONSTRAINT fk_team_section
    FOREIGN KEY (section_id) REFERENCES course_section (section_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_team_company
    FOREIGN KEY (company_id) REFERENCES company (company_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uniq_team_name_per_section (team_name, section_id)
) ENGINE=InnoDB;

-- 6) Student ↔ team membership
CREATE TABLE IF NOT EXISTS team_student (
  team_id    INT NOT NULL,
  student_id CHAR(9) NOT NULL,
  PRIMARY KEY (team_id, student_id),
  CONSTRAINT fk_ts_team
    FOREIGN KEY (team_id) REFERENCES project_team (team_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ts_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7) Advisor ↔ team assignments
CREATE TABLE IF NOT EXISTS advisor_assignment (
  advisor_assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  advisor_id            CHAR(9) NOT NULL,
  team_id               INT NOT NULL,
  CONSTRAINT fk_aa_advisor
    FOREIGN KEY (advisor_id) REFERENCES advisor (advisor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_aa_team
    FOREIGN KEY (team_id) REFERENCES project_team (team_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uniq_advisor_team (advisor_id, team_id)
) ENGINE=InnoDB;


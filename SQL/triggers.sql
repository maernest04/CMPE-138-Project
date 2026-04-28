-- SJSU CMPE 138 SPRING 2026 TEAM2

-- Triggers for Senior Capstone Viewer

USE senior_capstone_viewer;

DROP TRIGGER IF EXISTS trg_user_account_role_guard_bi;
DROP TRIGGER IF EXISTS trg_user_account_role_guard_bu;
DROP TRIGGER IF EXISTS trg_csa_admin_role_bi;
DROP TRIGGER IF EXISTS trg_csa_admin_role_bu;
DROP TRIGGER IF EXISTS trg_team_student_guard_bi;
DROP TRIGGER IF EXISTS trg_team_student_guard_bu;
DROP TRIGGER IF EXISTS trg_advisor_assignment_guard_bi;
DROP TRIGGER IF EXISTS trg_advisor_assignment_guard_bu;

DELIMITER $$

CREATE TRIGGER trg_user_account_role_guard_bi
BEFORE INSERT ON user_account
FOR EACH ROW
BEGIN
  IF NEW.role = 'STUDENT' AND NEW.student_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT account requires student_id';
  END IF;
  IF NEW.role = 'ADMIN' AND NEW.student_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ADMIN account cannot reference student_id';
  END IF;
END$$

CREATE TRIGGER trg_user_account_role_guard_bu
BEFORE UPDATE ON user_account
FOR EACH ROW
BEGIN
  IF NEW.role = 'STUDENT' AND NEW.student_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT account requires student_id';
  END IF;
  IF NEW.role = 'ADMIN' AND NEW.student_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ADMIN account cannot reference student_id';
  END IF;
END$$

CREATE TRIGGER trg_csa_admin_role_bi
BEFORE INSERT ON course_section_admin
FOR EACH ROW
BEGIN
  DECLARE v_role VARCHAR(20);
  SELECT role INTO v_role
  FROM user_account
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'ADMIN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'course_section_admin requires an ADMIN user account';
  END IF;
END$$

CREATE TRIGGER trg_csa_admin_role_bu
BEFORE UPDATE ON course_section_admin
FOR EACH ROW
BEGIN
  DECLARE v_role VARCHAR(20);
  SELECT role INTO v_role
  FROM user_account
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'ADMIN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'course_section_admin requires an ADMIN user account';
  END IF;
END$$

CREATE TRIGGER trg_team_student_guard_bi
BEFORE INSERT ON team_student
FOR EACH ROW
BEGIN
  DECLARE v_section_id INT;
  DECLARE v_member_count INT;

  SELECT section_id INTO v_section_id
  FROM project_team
  WHERE team_id = NEW.team_id
  LIMIT 1;

  IF v_section_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM section_student
    WHERE section_id = v_section_id AND student_id = NEW.student_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student must be enrolled in team section';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_student ts
    JOIN project_team pt ON pt.team_id = ts.team_id
    WHERE ts.student_id = NEW.student_id
      AND pt.section_id = v_section_id
      AND ts.team_id <> NEW.team_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student can only join one team per section';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM team_student
  WHERE team_id = NEW.team_id;

  IF v_member_count >= 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team is full (max 5 members)';
  END IF;
END$$

CREATE TRIGGER trg_team_student_guard_bu
BEFORE UPDATE ON team_student
FOR EACH ROW
BEGIN
  DECLARE v_section_id INT;
  DECLARE v_member_count INT;

  SELECT section_id INTO v_section_id
  FROM project_team
  WHERE team_id = NEW.team_id
  LIMIT 1;

  IF v_section_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM section_student
    WHERE section_id = v_section_id AND student_id = NEW.student_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student must be enrolled in team section';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_student ts
    JOIN project_team pt ON pt.team_id = ts.team_id
    WHERE ts.student_id = NEW.student_id
      AND pt.section_id = v_section_id
      AND ts.team_id <> NEW.team_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student can only join one team per section';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM team_student
  WHERE team_id = NEW.team_id;

  IF NEW.team_id <> OLD.team_id AND v_member_count >= 5 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team is full (max 5 members)';
  END IF;
END$$

CREATE TRIGGER trg_advisor_assignment_guard_bi
BEFORE INSERT ON advisor_assignment
FOR EACH ROW
BEGIN
  DECLARE v_max_teams INT;
  DECLARE v_current_teams INT;

  IF EXISTS (
    SELECT 1 FROM advisor_assignment
    WHERE team_id = NEW.team_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A team can only have one advisor';
  END IF;

  SELECT max_teams INTO v_max_teams
  FROM advisor
  WHERE advisor_id = NEW.advisor_id
  LIMIT 1;

  IF v_max_teams IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Advisor does not exist';
  END IF;

  SELECT COUNT(*) INTO v_current_teams
  FROM advisor_assignment
  WHERE advisor_id = NEW.advisor_id;

  IF v_current_teams >= v_max_teams THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Advisor is at capacity';
  END IF;
END$$

CREATE TRIGGER trg_advisor_assignment_guard_bu
BEFORE UPDATE ON advisor_assignment
FOR EACH ROW
BEGIN
  DECLARE v_max_teams INT;
  DECLARE v_current_teams INT;

  IF EXISTS (
    SELECT 1 FROM advisor_assignment
    WHERE team_id = NEW.team_id
      AND advisor_assignment_id <> OLD.advisor_assignment_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A team can only have one advisor';
  END IF;

  SELECT max_teams INTO v_max_teams
  FROM advisor
  WHERE advisor_id = NEW.advisor_id
  LIMIT 1;

  IF v_max_teams IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Advisor does not exist';
  END IF;

  SELECT COUNT(*) INTO v_current_teams
  FROM advisor_assignment
  WHERE advisor_id = NEW.advisor_id
    AND advisor_assignment_id <> OLD.advisor_assignment_id;

  IF v_current_teams >= v_max_teams THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Advisor is at capacity';
  END IF;
END$$

CREATE TRIGGER trg_team_cleanup_after_delete
AFTER DELETE ON team_student
FOR EACH ROW
BEGIN
  DECLARE v_member_count INT;
  SELECT COUNT(*) INTO v_member_count FROM team_student WHERE team_id = OLD.team_id;
  IF v_member_count = 0 THEN
    DELETE FROM project_team WHERE team_id = OLD.team_id;
  END IF;
END$$

DELIMITER ;

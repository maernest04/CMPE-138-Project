-- SJSU CMPE 138 SPRING 2026 TEAM2

-- Stored procedures for Senior Capstone Viewer

USE senior_capstone_viewer;

DROP PROCEDURE IF EXISTS sp_create_team_with_creator;
DROP PROCEDURE IF EXISTS sp_join_team;
DROP PROCEDURE IF EXISTS sp_assign_team_advisor;
DROP PROCEDURE IF EXISTS sp_set_team_company;

DELIMITER $$

CREATE PROCEDURE sp_create_team_with_creator (
  IN p_section_id INT,
  IN p_team_name VARCHAR(100),
  IN p_student_id CHAR(9)
)
BEGIN
  DECLARE v_team_id INT;

  START TRANSACTION;

  IF NOT EXISTS (
    SELECT 1
    FROM section_student
    WHERE section_id = p_section_id
      AND student_id = p_student_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not enrolled in this section';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_student ts
    JOIN project_team pt ON pt.team_id = ts.team_id
    WHERE ts.student_id = p_student_id
      AND pt.section_id = p_section_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already has a team in this section';
  END IF;

  INSERT INTO project_team (team_name, section_id, company_id)
  VALUES (p_team_name, p_section_id, NULL);

  SET v_team_id = LAST_INSERT_ID();

  INSERT INTO team_student (team_id, student_id)
  VALUES (v_team_id, p_student_id);

  COMMIT;
END$$

CREATE PROCEDURE sp_join_team (
  IN p_team_id INT,
  IN p_student_id CHAR(9)
)
BEGIN
  DECLARE v_section_id INT;

  START TRANSACTION;

  SELECT section_id INTO v_section_id
  FROM project_team
  WHERE team_id = p_team_id
  LIMIT 1;

  IF v_section_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM section_student
    WHERE section_id = v_section_id
      AND student_id = p_student_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not enrolled in team section';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_student ts
    JOIN project_team pt ON pt.team_id = ts.team_id
    WHERE ts.student_id = p_student_id
      AND pt.section_id = v_section_id
      AND pt.team_id <> p_team_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student can only join one team per section';
  END IF;

  INSERT INTO team_student (team_id, student_id)
  VALUES (p_team_id, p_student_id);

  COMMIT;
END$$

CREATE PROCEDURE sp_assign_team_advisor (
  IN p_team_id INT,
  IN p_advisor_id CHAR(9)
)
BEGIN
  START TRANSACTION;

  INSERT INTO advisor_assignment (advisor_id, team_id)
  VALUES (p_advisor_id, p_team_id);

  COMMIT;
END$$

CREATE PROCEDURE sp_set_team_company (
  IN p_team_id INT,
  IN p_company_id INT
)
BEGIN
  START TRANSACTION;

  IF p_company_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM company WHERE company_id = p_company_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company not found';
  END IF;

  UPDATE project_team
  SET company_id = p_company_id
  WHERE team_id = p_team_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team not found';
  END IF;

  COMMIT;
END$$

DELIMITER ;

-- Run once if your database was created before section_student existed.
USE senior_capstone_viewer;

CREATE TABLE IF NOT EXISTS section_student (
  section_id INT NOT NULL,
  student_id CHAR(9) NOT NULL,
  PRIMARY KEY (section_id, student_id),
  CONSTRAINT fk_ss_section
    FOREIGN KEY (section_id) REFERENCES course_section (section_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ss_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

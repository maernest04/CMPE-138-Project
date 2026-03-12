## Task 1 – Proposal, Miniworld, and Documentation Owner
**Owner:** _TBD_
**Scope**
- Maintain the **project proposal** so it matches what we actually build:
  - Miniworld: “Senior Capstone Viewer for CMPE 195 capstone projects.”
  - Actors: `Admin (course professor/TA)` and `Student`.
  - Operations for each role (add students to section, create/join team, assign advisor/company, etc.).
  - Scenarios: at least one admin story and one student story that use only those operations.
- Keep naming consistent: sections, students, teams, advisors, companies.
- Own and maintain **`README.md`**:
  - How to set up the DB and run the app.
  - How to log in as admin vs student (which seeded accounts exist).
  - Which features are available to each role.
**Deliverables**
- Clean proposal approved by the instructor (with mandatory sections).
- Up-to-date `README.md` that any teammate/grader can follow.
- Draft text for final report sections: miniworld, actors/roles, operations, scenarios.
---
## Task 2 – Database & ERD Owner (Schema + Data Requirements)
**Owner:** _TBD_
**Scope**
- Own the **ER/EER diagram** and **data requirements**:
  - Add `user_account` entity for login:
    - Attributes: `user_id` (PK), `email` (unique), `password_hash`, `role` (`ADMIN` / `STUDENT`), timestamps as desired.
    - Optional 1–1 relationship to `student` for student accounts.
  - Add `course_section_admin` (or equivalent) relationship:
    - Links an admin user to one or more `course_section` rows.
- Maintain and evolve the **SQL schema**:
  - Update `capstone.sql` (or an included SQL file) to:
    - Create `user_account` table.
    - Create `course_section_admin` table.
    - Ensure FKs and unique constraints are correct.
- Own **seed data** in `seed.sql`:
  - Insert at least one admin user (with pre-hashed password) mapped to one or more sections.
  - Insert a few student user accounts mapped to existing `student` rows.
**Deliverables**
- Final ER/EER diagram including `user_account` and `course_section_admin`.
- Updated `capstone.sql` and `seed.sql` that run cleanly on a fresh DB.
- Short writeup (for final report) of:
  - Table purposes, functional dependencies, and normal form (3NF/BCNF).
  - Any denormalization decisions.
---
## Task 3 – Auth & Infrastructure Owner (Login, Hashing, Session, Guards)
**Owner:** _TBD_
**Scope**
- Implement **authentication** in FastAPI (no ORM):
  - Use `passlib` (bcrypt) or similar for `password_hash`.
  - Functions to hash passwords and verify passwords.
  - SQL queries against `user_account` using `execute_query` from `app/db.py`.
- Implement **session / cookie** handling:
  - On successful login, store `user_id` and `role` in a secure cookie.
  - On logout, clear the cookie.
  - Implement helpers/dependencies:
    - `get_current_user()`
    - `require_admin()`
    - `require_student()`
- Implement **auth router**:
  - `GET /login` – login form.
  - `POST /login` – verify and set cookie.
  - `POST /logout` – clear cookie and redirect.
- Integrate into `app/main.py`:
  - Include `auth` router.
  - Make `/` behave differently depending on login state (redirect to admin or student dashboard or show welcome page).
**Deliverables**
- Working login/logout with hashed passwords.
- Shared dependencies `require_admin` and `require_student` used by feature routers.
- Example code snippets and explanation for the final report (password hashing, login flow).
---
## Task 4 – Admin Features Owner (Professor-Side UI + SQL)
**Owner:** _TBD_
**Scope**
- Create **admin router** and templates:
  - Admin dashboard:
    - Show the course sections this admin manages (via `course_section_admin`).
  - Section management:
    - List students in a section.
    - Add existing `student` to a section (and/or create a new `student` then enroll).
  - Team management:
    - Create/edit/delete `project_team` rows for a given section.
    - View and manage membership (`team_student`).
    - Assign advisors (`advisor_assignment`) and companies (`project_team.company_id`).
- Enforce **admin-only access**:
  - Use `require_admin` from Task 3.
  - Filter all admin data by the sections associated with the current admin.
**Deliverables**
- Fully working admin screens and routes backed by explicit SQL queries.
- Canonical SQL examples added to `queries.sql` (for key admin operations).
- An admin demo flow for presentation (e.g., “log in as admin → choose section → add student → create team → assign advisor/company → verify DB changes”).
---
## Task 5 – Student Features & Logging Owner (Student UI + Logs)
**Owner:** _TBD_
**Scope**
- Create **student router** and templates:
  - Student dashboard:
    - Show the logged-in student’s section, team (if any), teammates, advisor(s), and company.
  - `Create team` operation:
    - If student is not on a team in that section:
      - Insert a new `project_team`.
      - Insert new `team_student` row linking the student to that team.
  - `Join team` operation:
    - List existing teams in the student’s section with available slots (if you choose to enforce team size).
    - Insert a `team_student` row to join.
- Enforce **student-only access**:
  - Use `require_student` from Task 3.
  - Always get `student_id` from the logged-in user, never from query/path parameters.
- Implement **logging**:
  - Configure Python `logging` to write to text files under `Log/`.
  - Log at least:
    - Login attempts and results (coordinating with Task 3).
    - Student create/join team actions.
    - Optionally, admin operations (coordinate with Task 4).
**Deliverables**
- Working student dashboard and team create/join flows.
- Log files showing real operations (for submission and demo).
- A student demo flow for presentation (e.g., “log in as student → create/join team → see updated team/advisor info”).
---
## Coordination Notes
- **Schema & auth contracts**
  - Task 2 defines final table and column names for `user_account` and `course_section_admin` and shares them with everyone.
  - Task 3 defines how cookies/sessions and `require_admin`/`require_student` work and shares simple usage examples.
- **End-to-end demo coverage**
  - Each teammate should plan an individual live demo that:
    - Starts from some UI or route they own.
    - Shows which SQL is executed.
    - Shows how DB tables change (or what data is read).
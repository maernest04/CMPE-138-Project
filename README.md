# CMPE-138-Project

Senior Capstone Viewer – CMPE 195 project management for course professors and students.

This repository will be organized as the **DB-Application** root for the CMPE 138 term project.

## Miniworld overview

This application is a small database-backed system to help manage CMPE 195 senior capstone projects.
It tracks semesters, course sections, students, advisors, project teams, team membership, and optional company affiliations (stored as a name on each team).

There are two main app actors:

- **Admin (course professor / TA)**: manages course sections, enrolls students into sections, creates and edits
project teams, and assigns advisors/industry partners to teams. Admins can see and manage all data for the
sections they own.
- **Advisor (data entity, not app login role)**: advisors are still faculty records in the database and can be
assigned by admins to teams, but advisor accounts are not used as a separate app login role.
- **Student**: logs in, sees their own profile, section, team, advisor(s), and company, and can either create a
new team in their section (if they are not already on a team) or join an existing team in their section.

The core of the project is the **relational database schema** (SQL scripts under `SQL/`) plus a Node.js/Express
application (backend) and a React frontend that demonstrate the required operations using explicit SQL queries
against MySQL (no ORM).

## Tech stack and architecture

- **Frontend**: React (SPA) – role-based UI for admins and students.
- **Backend**: Node.js + Express – REST/JSON API, explicit SQL queries using `mysql2` or similar (no ORM).
- **Database**: MySQL – schema defined and loaded from SQL scripts.
- **Logging**: Node.js logging to a text file under `Log/app.log`.

High-level flow:

React frontend  
↓  
Node.js + Express backend (JSON API)  
↓  
MySQL database (tables, views, stored procedures, triggers)

## High-level operations (by role)

- **Admin**
  - Create new course sections (and automatically become the section's managing admin).
  - View course sections they manage (via `course_section_admin`).
  - Enroll students into sections (creating the student record and login account if needed).
  - Create, rename, and delete project teams in a section.
  - Add or remove students from teams (enforcing one team per student per section and a max of 5 members).
  - Create new advisors and add them to sections.
  - Assign or unassign advisors to/from teams (enforcing advisor capacity limits).
  - Set or clear a team's company name.
  - View advisor capacity and current team load.
- **Student**
  - Log in to the system and see their own information.
  - View their course section(s), team, teammates, advisor(s), and company name.
  - If not already on a team in that section, create a new team and become its first member.
  - If teams already exist in their section, join an existing team that has capacity.
  - Leave a team (if the last member leaves, the team is automatically deleted).
  - Set or update their team's company name.

Login, password hashing, and role-based behavior are handled in the **Express backend**.

**Task 4 (admin):** see **`TASK4_UPDATE.md`** for API list, how to run/test, demo script, SQL checks, and security notes. Public **`GET /api/config`** exposes `maxTeamMembers` and field length limits. Run **`cd backend && npm run test:admin`** with the server up (steps in that doc).

## Project layout

At the end of the project, the folder structure under this repository will match the required CMPE 138 layout:

```text
CMPE138_TEAMn_SOURCES/
  DB-Application/            # this repo (application + SQL + logs)
    backend/                 # Node.js + Express source code
    frontend/                # React frontend source code
    SQL/
      create_tables.sql      # schema (tables, FKs, constraints, student_dashboard_view)
      create_views.sql       # views (advisor_capacity_v, team_overview_v, team_members_v, admin_sections_v, advisor_teams_v)
      triggers.sql           # role guard, team size, advisor capacity triggers
      procedures.sql         # stored procedures (create team, join team, assign advisor)
      queries.sql            # reference SQL queries mirroring backend operations
      sample_data.sql        # seed data (users, sections, teams, advisors)
      reset.sql              # drops and recreates the database (dev only)
    scripts/
      hash-password.js       # generates bcrypt hashes for sample_data.sql
    Log/
      app.log                # application log file(s)
```

This repository is treated as `DB-Application/` in the hierarchy above.

## Setup

### 1) MySQL database (schema + app user)

> Task 2 implemented the schema. SQL files live under `SQL/`.

1. Log into MySQL as root (interactive):
  ```bash
   mysql -u root -p
  ```
2. Create tables and load sample data by running the schema files.
  - Option A (from your normal terminal, run from project root):
    ```bash
    mysql -u root -p < SQL/reset.sql
    mysql -u root -p < SQL/create_tables.sql
    mysql -u root -p < SQL/create_views.sql
    mysql -u root -p < SQL/triggers.sql
    mysql -u root -p < SQL/procedures.sql
    mysql -u root -p < SQL/sample_data.sql
    ```
  - Option B (from inside the MySQL prompt, after `cd` to project root):
    ```sql
    SOURCE SQL/reset.sql;
    SOURCE SQL/create_tables.sql;
    SOURCE SQL/create_views.sql;
    SOURCE SQL/triggers.sql;
    SOURCE SQL/procedures.sql;
    SOURCE SQL/sample_data.sql;
    ```
3. Create a dedicated app user (recommended) and grant access:
  ```sql
   -- Universal dev credentials for the whole team (each teammate creates the same user locally)
   CREATE USER IF NOT EXISTS 'scv_user'@'localhost' IDENTIFIED BY 'scv_password';
   GRANT ALL PRIVILEGES ON senior_capstone_viewer.* TO 'scv_user'@'localhost';
   FLUSH PRIVILEGES;
  ```
4. Quick verify (optional):
  ```sql
  USE senior_capstone_viewer;
  SHOW TABLES;
  SELECT * FROM user_account;
  SELECT * FROM course_section_admin;
  ```

### 2) Backend (Node.js + Express)

> The backend lives under `backend/` and uses raw SQL (no ORM) via `mysql2`.

1. Install dependencies:
  ```bash
   cd backend
   npm install
  ```
2. Configure the database connection using a **`.env`** file (recommended) or shell exports.
   - The backend loads **`.env`**. Node does **not** read `.env` automatically; the server uses `dotenv` for this.
   - Set **`DB_PASSWORD`** to the same password your MySQL user uses. If it is wrong or empty while MySQL expects a password, you will see: `Access denied ... (using password: NO)`.
   - Copy `backend/.env.example` to `backend/.env` or add variables to the project root `.env`.
  ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_USER=scv_user
   export DB_PASSWORD=scv_password
   export DB_NAME=senior_capstone_viewer
  ```
3. Start the backend server:
  ```bash
   npm run dev
  ```

### 3) Frontend (React)

> The frontend lives under `frontend/` and calls the Express backend using JSON APIs.

1. Install dependencies:
  ```bash
   cd frontend
   npm install
  ```
2. Start the React dev server:
  ```bash
   npm run dev
  ```
3. Open the printed URL in your browser (for example, `http://localhost:5173`) and make sure it can reach the backend API.

**Student login:** After the DB is loaded with `sample_data.sql`, use the student emails from that file with passwords `student1` … `student5`. Admin login is `admin@sjsu.edu` / `admin123`.

### Troubleshooting

- **Unknown database `senior_capstone_viewer`**:
  - The app is connecting to MySQL, but that database does not exist on **that** server yet. Run the SQL scripts in order (see Setup above). `create_tables.sql` includes `CREATE DATABASE IF NOT EXISTS senior_capstone_viewer`.
  - If you use MySQL Workbench on your machine but `DB_HOST` is `localhost`, you’re on the right track—just load the scripts into the same instance.
    - Run in this order:
  1. `SQL/create_tables.sql` — includes `CREATE DATABASE IF NOT EXISTS senior_capstone_viewer`
  2. `SQL/create_views.sql`
  3. `SQL/triggers.sql`
  4. `SQL/procedures.sql`
  5. `SQL/sample_data.sql`
      - How to run these files:
        - MySQL Workbench: connect → File → Open SQL Script → run each file in that order.
        - OR Command line (from the project folder), if mysql is on your PATH:
          - cd C:\Users\username\path\to\root\CMPE-138-Project
          - mysql -u root -p < SQL\create_tables.sql
          - mysql -u root -p < SQL\create_views.sql
          - mysql -u root -p < SQL\triggers.sql
          - mysql -u root -p < SQL\procedures.sql
          - mysql -u root -p < SQL\sample_data.sql
- **Database access denied**:
  - Check that the MySQL user/password in your environment variables match the user you created.
  - Verify that the DB name (`senior_capstone_viewer`) exists and that the user has privileges on it.
- **Backend cannot reach DB**:
  - Make sure MySQL is running and listening on the expected host/port.
  - Try a simple manual connection using the same credentials from the terminal.
- **Frontend cannot reach backend**:
  - Check CORS configuration on the Express backend (if needed).
  - Verify that the backend URL and port used in the React app are correct.

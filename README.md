# CMPE-138-Project: Senior Capstone Viewer

Senior Capstone Viewer – CMPE 195 project management for course professors and students.

This repository is organized as the **DB-Application** root for the CMPE 138 term project.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher
- **MySQL Server**: v8.0 or higher
- **npm**: v9.0.0 or higher

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

## Project layout

At the end of the project, the folder structure under this repository will match the required CMPE 138 layout:

```text
CMPE138_TEAMn_SOURCES/
  DB-Application/            # this repo (application + SQL + logs)
    CMPE138_Project.png      # project diagram / banner
    backend/                 # Node.js + Express source code
    frontend/                # React frontend source code
    SQL/
      create_tables.sql      # schema (tables, FKs, constraints, student_dashboard_view)
      alter_section_student.sql # migration for section/student relationships
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

### 1) MySQL Database Setup

The database schema and sample data live under `SQL/`. Follow these steps to initialize your database:

1. **Log into MySQL** as root:
   ```bash
   mysql -u root -p
   ```
2. **Create tables and load sample data** (choose one):
   - **Option A: From the terminal** (one-liner):
     ```bash
     mysql -u root -p < SQL/reset.sql && \
     mysql -u root -p < SQL/create_tables.sql && \
     mysql -u root -p < SQL/alter_section_student.sql && \
     mysql -u root -p < SQL/create_views.sql && \
     mysql -u root -p < SQL/triggers.sql && \
     mysql -u root -p < SQL/procedures.sql && \
     mysql -u root -p < SQL/sample_data.sql
     ```
   - **Option B: From the MySQL prompt** (after logging in):
     ```sql
     SOURCE SQL/reset.sql;
     SOURCE SQL/create_tables.sql;
     SOURCE SQL/create_views.sql;
     SOURCE SQL/triggers.sql;
     SOURCE SQL/procedures.sql;
     SOURCE SQL/sample_data.sql;
     ```

3. **Create the Application User**:
   ```sql
   -- Run this inside the MySQL prompt
   CREATE USER IF NOT EXISTS 'scv_user'@'localhost' IDENTIFIED BY 'scv_password';
   GRANT ALL PRIVILEGES ON senior_capstone_viewer.* TO 'scv_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 2) Backend (Node.js + Express)

> The backend lives under `backend/` and uses raw SQL (no ORM) via `mysql2`.

1. Install dependencies:
  ```bash
   cd backend
   npm install
  ```
2. **Environment Configuration**:
   The backend uses `dotenv` to manage configuration. It looks for a `.env` file in the `backend/` directory first, then falls back to the project root.
   - Copy `backend/.env.example` to `backend/.env`.
   - Ensure `DB_PASSWORD` matches your local MySQL setup.

   ```bash
   # Required environment variables
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=scv_user
   DB_PASSWORD=scv_password
   DB_NAME=senior_capstone_viewer
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
  - The database has not been created yet. Ensure you have run `SQL/create_tables.sql` first.
- **Database access denied**:
  - Verify your `DB_USER` and `DB_PASSWORD` in the `.env` file match the user created in MySQL.
- **Backend cannot reach DB**:
  - Ensure the MySQL service is running. Try connecting manually with `mysql -u scv_user -p`.
- **Frontend cannot reach backend**:
  - Check that the backend is running on the correct port (default: 4000).
  - Verify that CORS allows your frontend origin (default: `http://localhost:5173`).

## 🚀 Development Scripts

### Backend
- `npm run dev`: Starts the Express server using `node`.
- `npm run test:admin`: Runs a diagnostic script to verify Admin API endpoints.

### Frontend
- `npm run dev`: Starts the Vite development server.

## 🔗 API Overview

| Category | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/login` | Authenticate user and set session cookie |
| **Auth** | `POST /api/auth/logout` | Clear session cookie |
| **Student** | `GET /api/student/profile` | Get current student's profile and team info |
| **Admin** | `GET /api/admin/sections` | List sections managed by the current admin |
| **General** | `GET /api/config` | Get system-wide configuration and limits |
| **Health** | `GET /api/health` | Check backend and database connectivity |

## 👥 Contributors

- **SJSU CMPE 138 Team 2**
- Nathan Chuop
- Paul Brandon Estigoy
- Raghav Gautam
- Ernest Ma
- Colin Oliva
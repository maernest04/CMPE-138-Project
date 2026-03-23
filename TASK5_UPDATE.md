# Task 5 – Student UI & logging

This document describes what was implemented for **Task 5** while other tasks evolve. The app stack is **Express + React + MySQL** (not FastAPI templates).

## What was added

### Database

- **`section_student`** – links a student to a course section so “create/join team” has a valid section without guessing from the client.
- **`SQL/alter_section_student.sql`** – run once if your DB was created before this table existed.
- **`SQL/sample_data.sql`** – enrolls the five sample students in **CMPE195A-01** (Spring 2026).

### Backend (`backend/src/`)

| Path | Purpose |
|------|--------|
| `logger.js` | Appends **business events** to `Log/events.log` (login, logout, create/join/leave team). |
| `auth/session.js` | HMAC-signed session payload in cookie `scv_session`. |
| `middleware/parseSession.js` | Attaches `req.sessionUser` from cookie. |
| `middleware/requireStudent.js` | **401** if not a student; sets `req.studentId` from session only. |
| `routes/auth.js` | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. |
| `routes/student.js` | `GET /api/student/dashboard`, `GET /api/student/enrollments`, `GET /api/student/sections/:id/teams-for-join`, `POST /api/student/teams/create`, `POST /api/student/teams/join`, `POST /api/student/teams/leave`. |
| `server.js` | CORS with **credentials**, `cookie-parser`, mounts routers. |

HTTP access logging remains in **`Log/app.log`** (morgan).

### Frontend (`frontend/src/`)

| File | Purpose |
|------|--------|
| `api.js` | `fetch` helpers with `credentials: "include"`. |
| `LoginForm.jsx` | Student login (rejects non-student accounts). |
| `StudentDashboard.jsx` | Dashboard, create team, join team, leave team. |
| `App.jsx` | Session bootstrap via `/api/auth/me`. |

### Sample login passwords

`scripts/hash-password.js` documents bcrypt targets. Seed rows in `sample_data.sql` are intended to match:

| Order in seed INSERT | Password | Student row | Email (sample_data) |
|----------------------|----------|-------------|---------------------|
| 1 | `student1` | Nathan Chuop | nathan.chuop@sjsu.edu |
| 2 | `student2` | Paul Estigoy | paul.estigoy@sjsu.edu |
| 3 | `student3` | Raghav Gautam | raghav.gautam@sjsu.edu |
| 4 | `student4` | Ernest Ma | ernest.ma@sjsu.edu |
| 5 | `student5` | Colin Oliva | colin.oliva@sjsu.edu |

If login fails, regenerate hashes with `node scripts/hash-password.js` (from repo root, with `bcrypt` available—e.g. run from `backend` after `npm install`: `node ../scripts/hash-password.js`) and update `user_account` in `sample_data.sql`, then reload seed data.

## Step-by-step: run and verify

### 1. MySQL

Apply schema and data (from project root):

```bash
mysql -u root -p < SQL/create_tables.sql
mysql -u root -p < SQL/create_views.sql
mysql -u root -p < SQL/sample_data.sql
```

If the DB already existed **without** `section_student`:

```bash
mysql -u root -p < SQL/alter_section_student.sql
mysql -u root -p < SQL/sample_data.sql
```

(Re-running `sample_data.sql` is safe for `INSERT IGNORE` / upsert-style inserts used there.)

### 2. Backend

```powershell
cd backend
npm install
$env:DB_HOST=localhost
$env:DB_PORT=3306
$env:DB_USER=root
$env:DB_PASSWORD=your_mysql_password
$env:DB_NAME=senior_capstone_viewer
$env:SESSION_SECRET=change-me-in-production
$env:CORS_ORIGIN=http://localhost:5173
$env:MAX_TEAM_MEMBERS=5
npm run dev
```

Server listens on **http://localhost:4000**.

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** (Vite proxies `/api` to the backend).

## Coordination with other tasks

- **Task 3** – Auth here is a **minimal** slice (cookie session + bcrypt). The Task 3 owner can replace `auth/session.js` and `routes/auth.js` with JWT or server sessions while keeping the same **student routes** contract (`requireStudent`, `student_id` from session).
- **Task 4** – Admin should own inserting **`section_student`** when enrolling students; until then, seed data supplies enrollments for the demo section.

## Environment variables (reference)

| Variable | Default | Notes |
|----------|---------|--------|
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | `""` | |
| `DB_NAME` | `senior_capstone_viewer` | |
| `SESSION_SECRET` | dev placeholder | Change for any shared/production use. |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin for credentialed CORS. |
| `MAX_TEAM_MEMBERS` | `5` | Join/create capacity check. |

## Files and Folders Changes/Created

| Path | Role |
|------|------|
| SQL/create_tables.sql | Added section_student.
| SQL/sample_data.sql | Enrolls sample students in CMPE195A-01.
| SQL/alter_section_student.sql	**New** – upgrade old DBs.
| SQL/queries.sql | **New** student-oriented query examples (§9–10).
| backend/package.json | cookie-parser.
| backend/src/server.js | CORS + credentials, cookies, mounts /api/auth, /api/student.
| backend/src/logger.js | **New** – Log/events.log.
| backend/src/auth/session.js | **New** – sign/verify session cookie.
| backend/src/middleware/parseSession.js | **New**.
| backend/src/middleware/requireStudent.js | **New**.
| backend/src/routes/auth.js | **New** – login / logout / me.
| backend/src/routes/student.js | **New** – dashboard, enrollments, teams-for-join, create, join, leave.
| frontend/src/api.js | **New** – API helpers + credentials: "include".
| frontend/src/LoginForm.jsx | **New**.
| frontend/src/StudentDashboard.jsx | **New**.
| frontend/src/App.jsx | **Replaced** – session + student flow.
| TASK5_STUDENT.md | **New** – passwords, env table, coordination.
| README.md | Short pointer to Task 5 + section_student upgrade.
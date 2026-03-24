# Task 4 – Admin UI & SQL

This document describes what was implemented for **Task 4** (professor-side admin): **Express JSON API + explicit MySQL queries + React admin dashboard**. The app stack matches Task 5: **Express + React + MySQL** (no ORM).

## What was added

### Database / SQL

- **`course_section_admin`** – already in schema; links an admin `user_id` to sections they manage.
- **`SQL/queries.sql`** – Task 4 section (A1–A8): admin sections, roster, enroll, teams, membership, advisor assignment, and **business-rule notes** (A8).
- **`SQL/create_views.sql`** – `admin_sections_v`, `advisor_capacity_v` (and others) must be loaded; the admin API reads sections and advisor capacity through these views where noted below.

### Backend (`backend/src/`)

| Path | Purpose |
|------|--------|
| `appConfig.js` | **`getMaxTeamMembers()`** + **`LIMITS`** (team name, email, name, major max lengths) — single source with student routes. |
| `middleware/requireAdmin.js` | **401** unless `role === 'ADMIN'`. |
| `routes/admin.js` | All **`/api/admin/*`** handlers; data scoped via `course_section_admin`; business rules (one team per student per section, team size, advisor capacity, FK checks, string lengths). |
| `server.js` | **`GET /api/config`** (no auth) — `{ maxTeamMembers, fieldLimits }` for the frontend. |

Admin mutations log to **`Log/events.log`** via `logEvent("admin", …)` with a structured **`action`** field (e.g. `team.add_member`, `section.enroll_student`).

### Admin API routes (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/sections` | Sections this admin manages (via **`admin_sections_v`**) |
| GET | `/api/admin/sections/:id/students` | Roster |
| POST | `/api/admin/sections/:id/students` | Enroll existing or create + enroll |
| GET | `/api/admin/sections/:id/teams` | Teams + **`memberCount`**, **`maxMembers`**, members, advisors |
| POST | `/api/admin/sections/:id/teams` | Create team |
| PUT | `/api/admin/teams/:teamId` | Rename / set `company_id` |
| DELETE | `/api/admin/teams/:teamId` | Delete team (cascades) |
| POST | `/api/admin/teams/:teamId/members` | Add member |
| DELETE | `/api/admin/teams/:teamId/members/:studentId` | Remove member (**404** if not on team) |
| POST | `/api/admin/teams/:teamId/advisors` | Assign advisor |
| DELETE | `/api/admin/teams/:teamId/advisors/:advisorId` | Unassign (**404** if not assigned) |
| GET | `/api/admin/advisors` | All advisors (via **`advisor_capacity_v`**) |
| GET | `/api/admin/companies` | Companies |

### Public config

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/config` | **`maxTeamMembers`**, **`fieldLimits`** — no login required |

### Frontend (`frontend/src/`)

| File | Purpose |
|------|--------|
| `api.js` | Admin helpers + **`getConfig()`**. |
| `AdminDashboard.jsx` | Section picker, roster, enroll/create student, team CRUD, inline member/advisor/company controls, **Refresh**. |
| `LoginForm.jsx` | Student / Admin toggle; role checked after login. |
| `App.jsx` | Renders **`AdminDashboard`** for `ADMIN`, **`StudentDashboard`** for `STUDENT`. |

### Business rules (enforced in Express)

1. **One team per student per section** — cannot add a student already on another team in that section.
2. **Team size** — at most **`MAX_TEAM_MEMBERS`** (default **5**, env **`MAX_TEAM_MEMBERS`**).
3. **Advisor capacity** — cannot assign if global assignment count ≥ `advisor.max_teams`.
4. **IDs** — `student_id` and `advisor_id` must be **9 digits**.
5. **String lengths** — `team_name` ≤ 100; new student fields per **`appConfig.LIMITS`** (aligned with DB columns).
6. **Company** — non-null `company_id` must exist (**404** if not).
7. **Empty rename** — rejected (**400**).

### Security (course vs production)

- Sessions use **httpOnly** cookies; CORS is limited to **`CORS_ORIGIN`**.
- **CSRF**: Acceptable for the class project; in production add CSRF tokens or stricter SameSite / origin checks for state-changing browser requests.

### Sample admin login

From **`SQL/sample_data.sql`** (comment above `user_account` insert):

| Email | Password |
|-------|----------|
| `admin@sjsu.edu` | `admin123` |

---

## Step-by-step: run and verify

### Prerequisites

1. **MySQL** — Database **`senior_capstone_viewer`** created and loaded:
   - `SQL/create_tables.sql`, **`SQL/create_views.sql`**, triggers/procedures as needed, then **`SQL/sample_data.sql`**.
2. **Backend `.env`** — Set **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`**, etc. (see **`README.md`**).  
   If you see `Access denied … (using password: NO)`, set **`DB_PASSWORD`** in **`backend/.env`**.
3. **Two terminals** (or run the server in the background).

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Server listens on **http://localhost:4000** (or **`PORT`** in `.env`).

### 2. Automated API tests (`npm run test:admin`)

Terminal 2 (with backend already running):

```bash
cd backend
npm run test:admin
```

Optional env overrides:

```bash
BASE_URL=http://127.0.0.1:4000 ADMIN_EMAIL=admin@sjsu.edu ADMIN_PASSWORD=admin123 npm run test:admin
```

**What the script checks**

- **`GET /api/config`** — `maxTeamMembers` and `fieldLimits`
- Admin login + session cookie; **`GET /api/auth/me`**
- **`GET /api/admin/sections`** (non-empty with sample data)
- Students + teams for first managed section; teams include **`memberCount`** / **`maxMembers`**
- Advisors list (capacity from view) + companies
- Unauthenticated admin → **401**; student session on admin routes → **401**
- **Edge cases:** duplicate team member; second team in same section for same student; advisor at capacity (Ben Reed in seed); invalid **`company_id`**; empty rename; remove non-member (**404**); create + delete a throwaway team

The script creates a throwaway **synthetic student** (9-digit id starting with **`8…`**) for member-rule tests. You can delete that row from **`student`** / **`section_student`** manually if you want a clean DB.

### 3. Frontend (manual UI)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** (Vite proxies **`/api`** to the backend).

1. Use **Admin** mode on the login screen.
2. Log in as **`admin@sjsu.edu` / `admin123`**.
3. Pick a section → roster → enroll or create student → create/edit team → add members → assign advisor → save company → use **Refresh** as needed.
4. Optionally inspect **`Log/events.log`** for **`action`** fields.

### 4. SQL spot-checks (optional)

Canonical examples live in **`SQL/queries.sql`** under **Task 4 admin operations**. Quick verification:

```sql
USE senior_capstone_viewer;

-- Sections for admin user 1 (adjust user_id)
SELECT * FROM admin_sections_v WHERE user_id = 1;

-- Roster for section 1
SELECT st.* FROM section_student ss
JOIN student st ON st.student_id = ss.student_id
WHERE ss.section_id = 1;

-- Teams + members in section 1
SELECT t.team_id, t.team_name, t.company_id, ts.student_id
FROM project_team t
LEFT JOIN team_student ts ON ts.team_id = t.team_id
WHERE t.section_id = 1;

-- Advisor assignments for teams in section 1
SELECT * FROM advisor_assignment WHERE team_id IN (
  SELECT team_id FROM project_team WHERE section_id = 1
);
```

---

## Demo script (presentation)

1. Start MySQL with schema + **`sample_data.sql`**, configure **`backend/.env`**.
2. **`npm run dev`** in **`backend`** and **`frontend`**.
3. Login as **Admin** → choose a managed section → show roster.
4. **Enroll** existing student or **create** new student + enroll.
5. **Create team** → **add member** → **assign advisor** → **save company**.
6. Show **`Log/events.log`** or run the SQL snippets above.

---

## Coordination with other tasks

- **Task 3** — Admin uses the same cookie session as **`/api/auth/login`**; **`requireAdmin`** expects **`role === 'ADMIN'`**.
- **Task 5** — Students need **`section_student`** rows to create/join teams; admin enrollment API is the intended way to add those rows beyond seed data.

---

## Environment variables (reference)

| Variable | Default | Notes |
|----------|---------|--------|
| `MAX_TEAM_MEMBERS` | `5` | Exposed to UI via **`GET /api/config`**. |
| `CORS_ORIGIN` | `http://localhost:5173` | Credentialed CORS for the SPA. |
| Others | — | See **`README.md`** / **`backend/.env.example`** (`DB_*`, `SESSION_SECRET`, `PORT`). |

---

## Files and folders (Task 4–related)

| Path | Role |
|------|------|
| `backend/src/appConfig.js` | Shared limits + max team size. |
| `backend/src/middleware/requireAdmin.js` | Admin gate. |
| `backend/src/routes/admin.js` | Admin REST API + SQL. |
| `backend/scripts/test-admin-api.mjs` | Smoke + edge-case tests. |
| `backend/package.json` | Script **`test:admin`**. |
| `frontend/src/AdminDashboard.jsx` | Admin UI. |
| `frontend/src/api.js` | Admin + **`getConfig`**. |
| `SQL/queries.sql` | Task 4 query examples (A1–A8). |
| `TASK4_UPDATE.md` | This document (replaces separate Task 4 test doc). |

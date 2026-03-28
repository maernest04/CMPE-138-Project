# Task 3 – Auth & Infrastructure Owner (Login, Hashing, Session, Guards)

This document describes what was implemented for **Task 3** (Secure Authentication System + Database Optimization + SQL view Integration): The stack is consisten with the project: Express + React + MySQL (no ORM).

## What was added

### Database / SQL

Index Optimization:
- Added indexes to improve performance on join-heavy queries:
    - project_team(section_id)
    - team_student(student_id)
    - section_student(student_id)
    - advisor_assignment(advisor_id)
- Targets frequently used join and lookup columns

Result: Faster query executuion for dashboard and relational lookups

student_dashboard_view
- Created centralized SQL view combining
    - student
    - course_section
    - semester (year, season)
    - project_team
    - company
    - advisor_assignment
- Uses LEFT JOIN to handle optional relationships
- Encapsulates complex multi-table joins into reusuable query

Result: simplifies backend logic and improves maintainability

### Backend (`backend/src/`)

| Path | Purpose 
| auth/password.js | Password Hashing + verfication (bcrypt) 
| auth/session.js | Session handling + secure cookies
| routes/auth.js | Login/logout + session handling + validation + rate limiting
| routes/student.js | Updated dashboard query to use student_dashboard_view
| middleware/requireAdmin.js | Refactored using shared auth helpers
| middleware/requireStudent.js | Refactored using shared auth helpers
| logger.js | Structured logging for security + events


### Admin API routes (summary)

| Method | Path | Purpose |
| POST | /api/auth/login | Authenticate user and create session
| POST | /api/auth/logout | Destroy session
| GET | /api/auth/me | Gets current user
| POST | /api/auth/change-password | Change password securely


### Key Query Change

Before (backend)
- Complex multi-join query across:
    - team_student
    - project_team
    - course_section
    - semester
    - company
    - advisor_assignment

After
SELECT *
FROM student_dashboard_view
WHERE student_id = ?

Result:
- Cleaner backend code
- reusuable query logic
- reduced duplication

### New Features

**AUTHENTICATION**
- Password hashing using bcrypt (SALT_ROUNDS = 10)
- Secure Session Cookies (httpOnly, secure, samesite)
- Role-based access control (requireRole)
- Password change flow with verification

**Rate Limiting**
- 5 Failed login attempts per 15 minutes per IP
- Prevents brute force
- logs failed attempts

**Input Validation**
- Email format validation
- Password length enforcement
- Input sanitization

**Logging & Monitoring**
- Logs stored in:
    - Log/events.log
    - Log/app.log

- Tracks:
    - Login attempts
    - Rate limit triggers

- Includes IP + User-Agent context

### Business rules (enforced in Express)

1. Session required for protected routes
2. Password verification required for sensitive actions
3. Rate limiting enforced on login attempts
4. Role-based access control (ADMIN/STUDENT)
5. Input Validation enforced for authentication fields

### Performance & Design Improvements

Performance
- Indexes significantly improve join performance
- Faster dashboard data retrieval

Query Simplification 
- Replaced repeated join logic with a single SQL view

Maintainability
- Centralized query logic in database layer
- Future schema changes only require updating the view

Result: Cleaner, scalable backend architecture

### Validation / Testing

System was fully re-tested after implementation:
    Login/authentication works correctly
    Session persists across requests
    Student dashboard loads correctly
    Team, company, advisor, and semester data display properly
    Create / join / leave team flows still function
    Rate limiting behaves as expected
    No backend or frontend errors observed

## Step-by-step: run and verify

1. Load database changes
Run SQL/create_tables.sql

Includes:
- Indexes
- student_dashboard_view

2. Verify Indexes

SHOW INDEX FROM project_team;
SHOW INDEX FROM team_student;
SHOW INDEX FROM section_student;
SHOW INDEX FROM advisor_assignment;

3. Verify View

SELECT * FROM student_dashboard_view LIMIT 10;

4. Run application
cd backend
npm run dev

cd frontend
npm run dev

- login as student
- open dashboard
- verify correct data display

5. Check logs (optional)
Log/events.log

### Security
- Uses cookie-based sessions (httpOnly)
- CORS restricted via CORS_ORIGIN
- For production:
    - Add HTTPS enforcement
    - Add CSRF protection
    - Use Redis for distrubted rate limiting

### Outcome
Successfully implemented secure authentication system
Optimized database performance using indexes
Simplified backend queries using a SQL view
Maintained full system functionality with no regressions
Delivered a clean, production-style backend and database architecture

### Files and Folders (Task 3)

Path | Role
SQL/create_tables.sql | Added indexes + student_dashboard_view
backend/src/routes/student.js | Updated dashboard query
backend/src/routes/auth.js | Authentication logic
backend/src/auth/ | Password + session + helpers
backend/src/logger.js | Logging system
MySQL Workbench / CLI | Used for testing indexes and queries
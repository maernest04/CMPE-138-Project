# CMPE-138-Project

Senior Capstone Viewer – CMPE 195 project management for course professors.

## Setup

### 1) MySQL database (schema + app user)

1. Log into MySQL as root (interactive):

   ```bash
   mysql -u root -p
   ```

2. Create tables by running the schema file.

   - Option A (from your normal terminal):

     ```bash
     mysql -u root -p < reset.sql
     mysql -u root -p < capstone.sql
     mysql -u root -p < views.sql
     mysql -u root -p < seed.sql
     ```

   - Option B (from inside the MySQL prompt):

     ```sql
     SOURCE reset.sql;
     SOURCE capstone.sql;
     SOURCE views.sql;
     SOURCE seed.sql;
     ```

   Note:
   - `reset.sql` wipes the database so you can start clean.
   - If you skip `reset.sql` and see `Table 'semester' already exists`, you already ran the schema once.

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
   ```

### 2) Python dependencies

Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

### 3) Run the web app

Set DB config via environment (recommended: use `scv_user`):

   ```bash
   export MYSQL_USER=scv_user
   export MYSQL_PASSWORD=scv_password
   export MYSQL_DATABASE=senior_capstone_viewer
   ```

Run the app from the project root (use module form so it always works):

   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

   Open http://127.0.0.1:8000

### Troubleshooting

- If you see `Access denied ... (using password: NO)`:
  - your `MYSQL_PASSWORD` environment variable is not set in the same terminal that started uvicorn.
- If you see `Access denied ... (using password: YES)`:
  - the user/password is wrong, or the user was never created/granted privileges.

## Project layout

- `capstone.sql` – MySQL schema
- `reset.sql` – drops DB for clean reset
- `views.sql` – DB views used for common screens
- `seed.sql` – sample data for demo/dev
- `queries.sql` – canonical SQL queries to copy into routers
- `app/main.py` – FastAPI app and routes
- `app/db.py` – MySQL connection helper
- `app/routers/` – feature routers (advisors, students, teams, etc.)
- `app/templates/` – Jinja2 HTML templates
- `app/static/` – static assets

## Base responsibilities (Person 1)

These are the “foundation” items to finish so the other 4 teammates can build features quickly:

- Ensure `capstone.sql` is final and matches the agreed rules:
  - `semester.season` is `Spring/Fall`
  - `student.student_id` is `CHAR(9)`
  - `advisor.max_teams` defaults to `2`
- Keep this README accurate so teammates can run everything.
- Keep `app/db.py` as the single source of truth for MySQL config (via env vars).
- Keep `app/main.py` as the place where new routers get registered.
- Provide at least one “example feature” fully working (advisors list is already the reference pattern).

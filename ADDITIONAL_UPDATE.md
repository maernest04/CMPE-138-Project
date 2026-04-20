# Additional Updates

Changes made beyond the original Task 4 and Task 5 deliverables.

---

## 1. Advisor Management

- Added `section_advisor` junction table to link advisors to sections.
- Admins can **create a new advisor** (ID, name, email, department, max teams) — automatically linked to the current section.
- Admins can **add an existing advisor to a section** without needing to assign them to a team. Advisors at capacity are hidden from the dropdown.
- Admins can **assign an advisor to a team** from the Team management card.

New API routes in `admin.js`:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/advisors` | Create new advisor and link to section |
| GET | `/api/admin/sections/:sectionId/advisors` | Get all advisors in a section with their team assignments |
| POST | `/api/admin/sections/:sectionId/advisors` | Add existing advisor to a section |
| POST | `/api/admin/teams/:teamId/advisors` | Assign advisor to a team |

---

## 2. Section Displays (Admin Dashboard)

- **Section students** panel shows all enrolled students in the selected section.
- **Section advisors** panel shows all advisors in the selected section. If an advisor is on multiple teams, their teams are shown comma-separated on one row.
- Both panels are **collapsible** via an Expand / Collapse button.

---

## 3. Course Section Creation

- Admins can create new course sections from the **Managed sections** area.
- Form fields: course code, section number, year, and season.
- New API route: `POST /api/admin/sections`

---

## 4. Company Simplified to a Team Attribute

`company` was removed as a separate table. It is now a plain `company_name VARCHAR(150)` column directly on `project_team`.

- **Database**: dropped `company` table, removed `company_id` FK, added `company_name` to `project_team`; updated views and sample data accordingly.
- **Admin**: team editor uses a text input for company name instead of a dropdown. Null-safe (blank = no company).
- **Student**: each team card has an editable company name input with a Save button. Students can set or clear it.
- New API route: `PUT /api/student/teams/:teamId/company`

---

## 5. Dashboard Layout Reorganization (Admin)

Admin section view reorganized into four cards:

1. **Section students** — collapsible enrolled student list.
2. **Section advisors** — collapsible advisor list with team assignments.
3. **Enroll & create** — all student/advisor enrollment and creation forms.
4. **Team management** — team creation, editing, and advisor assignment.

---

## 6. Additional Sample Data

| Item | Detail |
|------|--------|
| Section | CMPE195B-01, Spring 2026 |
| Team | Team Chips |
| Student 1 | Ryan Gossling · `ryan.gossling@sjsu.edu` · Software Engineering |
| Student 2 | Dwayne Johnson · `dwayne.johnson@sjsu.edu` · Robotics |
| Advisor | Ryan Reynolds · `ryan.reynolds@sjsu.edu` · CMPE Dept · max 1 team |

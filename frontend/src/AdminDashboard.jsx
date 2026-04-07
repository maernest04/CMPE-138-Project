import React, { useEffect, useState } from "react";
import {
  addAdvisorToTeam,
  addSectionStudent,
  addTeamMember,
  createAdminTeam,
  deleteAdminTeam,
  getAdminAdvisors,
  getAdminCompanies,
  getAdminSections,
  getAdminSectionStudents,
  getAdminSectionTeams,
  getConfig,
  logout,
  removeAdvisorFromTeam,
  removeTeamMember,
  updateAdminTeam
} from "./api";

const card = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1rem",
  background: "#fafafa"
};

const inputSm = { padding: "0.35rem 0.5rem", marginRight: "0.35rem", marginTop: "0.25rem" };

function TeamEditor({ team, companies, advisors, maxTeamMembers, fieldLimits, busy, withBusy }) {
  const [rename, setRename] = useState(team.teamName);
  const [addMemberId, setAddMemberId] = useState("");
  const [removeMemberId, setRemoveMemberId] = useState("");
  const [removeAdvisorId, setRemoveAdvisorId] = useState("");
  const [assignAdvisorId, setAssignAdvisorId] = useState("");
  const [companyChoice, setCompanyChoice] = useState(team.companyId ? String(team.companyId) : "");

  useEffect(() => {
    setRename(team.teamName);
    setCompanyChoice(team.companyId ? String(team.companyId) : "");
    setAddMemberId("");
    setRemoveMemberId("");
    setRemoveAdvisorId("");
    setAssignAdvisorId("");
  }, [team.teamId, team.teamName, team.companyId]);

  const maxMembers = team.maxMembers ?? maxTeamMembers;
  const memberCount = team.memberCount ?? team.members.length;

  const assignableAdvisors = advisors.filter(
    (a) => a.remaining > 0 && !team.advisors.some((x) => x.advisorId === a.advisorId)
  );

  return (
    <article style={{ ...card, background: "#fff" }}>
      <h4 style={{ marginTop: 0 }}>
        {team.teamName} ({team.teamId})
      </h4>
      <p>
        <strong>Company:</strong> {team.companyName || "—"}
      </p>
      <p>
        <strong>Members:</strong>{" "}
        {team.members.length ? team.members.map((m) => `${m.name} (${m.studentId})`).join(", ") : "—"}{" "}
        <span style={{ color: "#666" }}>
          ({memberCount}/{maxMembers})
        </span>
      </p>
      <p>
        <strong>Advisors:</strong>{" "}
        {team.advisors.length ? team.advisors.map((a) => `${a.name} (${a.advisorId})`).join(", ") : "—"}
      </p>

      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Rename team</strong>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
          <input
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            maxLength={fieldLimits.teamName}
            style={{ ...inputSm, minWidth: "200px" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              withBusy(() => updateAdminTeam(team.teamId, { teamName: rename.trim() }), "Team updated.")
            }
          >
            Save name
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const ok = window.confirm(
              `Delete team "${team.teamName}"? Members and advisor links are removed (DB cascades).`
            );
            if (!ok) return;
            withBusy(() => deleteAdminTeam(team.teamId), "Team deleted.");
          }}
        >
          Delete team
        </button>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Add member</strong>
        <form
          style={{ marginTop: "0.25rem" }}
          onSubmit={(e) => {
            e.preventDefault();
            const sid = addMemberId.trim();
            if (!sid) return;
            withBusy(() => addTeamMember(team.teamId, sid), "Team member added.");
            setAddMemberId("");
          }}
        >
          <input
            placeholder="student_id (9 digits)"
            inputMode="numeric"
            pattern="\d{9}"
            minLength={9}
            maxLength={9}
            value={addMemberId}
            onChange={(e) => setAddMemberId(e.target.value)}
            disabled={busy || memberCount >= maxMembers}
            style={inputSm}
          />
          <button type="submit" disabled={busy || memberCount >= maxMembers}>
            Add
          </button>
          {memberCount >= maxMembers && (
            <span style={{ color: "#666", marginLeft: "0.5rem" }}>Team is full.</span>
          )}
        </form>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Remove member</strong>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
          <select
            value={removeMemberId}
            onChange={(e) => setRemoveMemberId(e.target.value)}
            style={inputSm}
          >
            <option value="">Select student</option>
            {team.members.map((m) => (
              <option key={m.studentId} value={m.studentId}>
                {m.name} ({m.studentId})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !removeMemberId}
            onClick={() => {
              const sid = removeMemberId;
              withBusy(() => removeTeamMember(team.teamId, sid), "Team member removed.");
              setRemoveMemberId("");
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Company</strong>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
          <select
            value={companyChoice}
            onChange={(e) => setCompanyChoice(e.target.value)}
            style={inputSm}
          >
            <option value="">Unassign company</option>
            {companies.map((c) => (
              <option key={c.companyId} value={String(c.companyId)}>
                {c.companyName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              withBusy(
                () =>
                  updateAdminTeam(team.teamId, {
                    companyId: companyChoice ? Number(companyChoice) : null
                  }),
                "Company assignment updated."
              )
            }
          >
            Save company
          </button>
        </div>
      </div>

      <div>
        <strong>Advisor</strong>
        {assignableAdvisors.length === 0 ? (
          <p style={{ color: "#666", fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
            No advisors with free capacity (or all eligible advisors are already on this team).
          </p>
        ) : (
          <form
            style={{ marginTop: "0.25rem" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!assignAdvisorId) return;
              withBusy(() => addAdvisorToTeam(team.teamId, assignAdvisorId), "Advisor assigned.");
              setAssignAdvisorId("");
            }}
          >
            <select
              value={assignAdvisorId}
              onChange={(e) => setAssignAdvisorId(e.target.value)}
              style={inputSm}
            >
              <option value="">Select advisor</option>
              {assignableAdvisors.map((a) => (
                <option key={a.advisorId} value={a.advisorId}>
                  {a.name} ({a.currentTeams}/{a.maxTeams}, {a.remaining} left)
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy || !assignAdvisorId}>
              Assign
            </button>
          </form>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem" }}>
          <select
            value={removeAdvisorId}
            onChange={(e) => setRemoveAdvisorId(e.target.value)}
            style={inputSm}
          >
            <option value="">Remove advisor…</option>
            {team.advisors.map((a) => (
              <option key={a.advisorId} value={a.advisorId}>
                {a.name} ({a.advisorId})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !removeAdvisorId}
            onClick={() => {
              const aid = removeAdvisorId;
              withBusy(() => removeAdvisorFromTeam(team.teamId, aid), "Advisor removed.");
              setRemoveAdvisorId("");
            }}
          >
            Remove advisor
          </button>
        </div>
      </div>
    </article>
  );
}

export function AdminDashboard({ user, onLogout }) {
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [maxTeamMembers, setMaxTeamMembers] = useState(5);
  const [fieldLimits, setFieldLimits] = useState({
    teamName: 100,
    studentEmail: 100,
    firstName: 50,
    lastName: 50,
    major: 50
  });

  const [addExistingStudentId, setAddExistingStudentId] = useState("");
  const [newStudent, setNewStudent] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    major: "",
    password: ""
  });

  async function refreshAll() {
    const [sec, adv, comp, cfg] = await Promise.all([
      getAdminSections(),
      getAdminAdvisors(),
      getAdminCompanies(),
      getConfig().catch(() => null)
    ]);
    setSections(sec);
    setAdvisors(adv);
    setCompanies(comp);
    if (cfg && typeof cfg.maxTeamMembers === "number") {
      setMaxTeamMembers(cfg.maxTeamMembers);
    }
    if (cfg && cfg.fieldLimits) {
      setFieldLimits((prev) => ({ ...prev, ...cfg.fieldLimits }));
    }
    if (!selectedSectionId && sec.length) {
      setSelectedSectionId(String(sec[0].sectionId));
    }
  }

  async function refreshSection(sectionId) {
    if (!sectionId) return;
    const sid = Number(sectionId);
    const [st, tm] = await Promise.all([getAdminSectionStudents(sid), getAdminSectionTeams(sid)]);
    setStudents(st);
    setTeams(tm);
  }

  useEffect(() => {
    refreshAll().catch((err) => setError(err.message || String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      refreshSection(selectedSectionId).catch((err) => setError(err.message || String(err)));
    }
  }, [selectedSectionId]);

  async function onLogoutClick() {
    await logout();
    onLogout();
  }

  async function withBusy(fn, successMessage) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      await fn();
      if (successMessage) setMessage(successMessage);
      await refreshAll();
      if (selectedSectionId) await refreshSection(selectedSectionId);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      await refreshAll();
      if (selectedSectionId) await refreshSection(selectedSectionId);
      setMessage("Refreshed.");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Admin dashboard</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#555" }}>
            user #{user.userId} · role {user.role}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={handleRefresh}>
            Refresh
          </button>
          <button type="button" onClick={onLogoutClick}>
            Log out
          </button>
        </div>
      </header>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Managed sections</h3>
        {sections.length === 0 ? (
          <p>No sections are assigned to this admin account.</p>
        ) : (
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            style={{ minWidth: "280px" }}
          >
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.courseCode}-{s.sectionNumber} ({s.season} {s.year})
              </option>
            ))}
          </select>
        )}
      </section>

      {selectedSectionId && (
        <>
          <section style={card}>
            <h3 style={{ marginTop: 0 }}>Section students</h3>
            <ul>
              {students.map((s) => (
                <li key={s.studentId}>
                  {s.studentId} · {s.firstName} {s.lastName} ({s.email})
                </li>
              ))}
            </ul>

            <h4>Add existing student to section</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                withBusy(
                  () =>
                    addSectionStudent(Number(selectedSectionId), {
                      studentId: addExistingStudentId.trim()
                    }),
                  "Student enrolled in section."
                );
              }}
            >
              <input
                placeholder="student_id (9 digits)"
                inputMode="numeric"
                pattern="\d{9}"
                minLength={9}
                maxLength={9}
                value={addExistingStudentId}
                onChange={(e) => setAddExistingStudentId(e.target.value)}
                required
              />
              <button type="submit" disabled={busy} style={{ marginLeft: "0.5rem" }}>
                Add existing
              </button>
            </form>

            <h4 style={{ marginTop: "1rem" }}>Create new student and enroll</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                withBusy(
                  () => addSectionStudent(Number(selectedSectionId), newStudent),
                  "New student account created and enrolled."
                );
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  placeholder="student_id (9 digits)"
                  inputMode="numeric"
                  pattern="\d{9}"
                  minLength={9}
                  maxLength={9}
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  required
                />
                <input
                  placeholder="first name"
                  maxLength={fieldLimits.firstName}
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  required
                />
                <input
                  placeholder="last name"
                  maxLength={fieldLimits.lastName}
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  required
                />
                <input
                  placeholder="email"
                  type="email"
                  maxLength={fieldLimits.studentEmail}
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  required
                />
                <input
                  placeholder="major"
                  maxLength={fieldLimits.major}
                  value={newStudent.major}
                  onChange={(e) => setNewStudent({ ...newStudent, major: e.target.value })}
                  required
                />
                <input
                  placeholder="password"
                  type="password"
                  minLength={1}
                  maxLength={72}
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={busy} style={{ marginTop: "0.5rem" }}>
                Create + enroll
              </button>
            </form>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0 }}>Team management</h3>
            <p style={{ color: "#555", fontSize: "0.9rem", marginTop: 0 }}>
              Rules: at most <strong>{maxTeamMembers}</strong> members per team; each student{" "}
              <strong>one team per section</strong>; advisors respect <strong>max teams</strong> capacity.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                withBusy(
                  () => createAdminTeam(Number(selectedSectionId), newTeamName.trim()),
                  "Team created."
                );
              }}
            >
              <input
                placeholder="New team name"
                maxLength={fieldLimits.teamName}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              <button type="submit" disabled={busy} style={{ marginLeft: "0.5rem" }}>
                Create team
              </button>
            </form>

            <div style={{ marginTop: "1rem" }}>
              {teams.map((t) => (
                <TeamEditor
                  key={t.teamId}
                  team={t}
                  companies={companies}
                  advisors={advisors}
                  maxTeamMembers={maxTeamMembers}
                  fieldLimits={fieldLimits}
                  busy={busy}
                  withBusy={withBusy}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

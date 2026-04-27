// SJSU CMPE 138 SPRING 2026 TEAM2
import React, { useEffect, useState } from "react";
import {
  addAdvisorToSection,
  addAdvisorToTeam,
  addSectionStudent,
  addTeamMember,
  createAdminSection,
  createAdminTeam,
  createAdvisor,
  deleteAdminTeam,
  getAdminAdvisors,
  getAdminSections,
  getAdminSectionAdvisors,
  getAdminSectionStudents,
  getAdminSectionTeams,
  getConfig,
  logout,
  removeAdvisorFromTeam,
  removeTeamMember,
  updateAdminTeam
} from "./api";
import { colors } from "./theme";

const card = {
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  padding: "1rem",
  marginBottom: "1rem",
  background: colors.cardBg
};

const inputSm = {
  padding: "0.35rem 0.5rem",
  marginRight: "0.35rem",
  marginTop: "0.25rem",
  borderRadius: "6px",
  border: `1px solid ${colors.border}`
};

function TeamEditor({ team, advisors, sectionAdvisors, maxTeamMembers, fieldLimits, busy, withBusy }) {
  const [rename, setRename] = useState(team.teamName);
  const [addMemberId, setAddMemberId] = useState("");
  const [removeMemberId, setRemoveMemberId] = useState("");
  const [removeAdvisorId, setRemoveAdvisorId] = useState("");
  const [assignAdvisorId, setAssignAdvisorId] = useState("");
  const [companyInput, setCompanyInput] = useState(team.companyName || "");

  useEffect(() => {
    setRename(team.teamName);
    setCompanyInput(team.companyName || "");
    setAddMemberId("");
    setRemoveMemberId("");
    setRemoveAdvisorId("");
    setAssignAdvisorId("");
  }, [team.teamId, team.teamName, team.companyName]);

  const maxMembers = team.maxMembers ?? maxTeamMembers;
  const memberCount = team.memberCount ?? team.members.length;

  const sectionAdvisorIds = new Set(sectionAdvisors.map((a) => a.advisorId));
  const assignableAdvisors = advisors.filter(
    (a) =>
      sectionAdvisorIds.has(a.advisorId) &&
      a.remaining > 0 &&
      !team.advisors.some((x) => x.advisorId === a.advisorId)
  );

  return (
    <article style={{ ...card, background: "#ffffff" }}>
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.35rem",
            marginTop: "0.25rem"
          }}
        >
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
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              backgroundColor: colors.gold,
              color: "#222",
              fontWeight: 500
            }}
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
          style={{
            padding: "0.35rem 0.9rem",
            borderRadius: "999px",
            border: `1px solid ${colors.error}`,
            backgroundColor: "#fff",
            color: colors.error,
            cursor: "pointer",
            fontSize: "0.85rem"
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
          <button
            type="submit"
            disabled={busy || memberCount >= maxMembers}
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              backgroundColor: colors.blue,
              color: "#fff",
              fontWeight: 500,
              fontSize: "0.85rem"
            }}
          >
            Add
          </button>
          {memberCount >= maxMembers && (
            <span style={{ color: colors.grayMuted, marginLeft: "0.5rem" }}>Team is full.</span>
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
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              border: `1px solid ${colors.border}`,
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Company</strong>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
          <input
            placeholder="Company name (leave blank to clear)"
            maxLength={150}
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            style={{ ...inputSm, minWidth: "200px" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              withBusy(
                () =>
                  updateAdminTeam(team.teamId, {
                    companyName: companyInput.trim() || null
                  }),
                "Company updated."
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
          <p style={{ color: colors.grayMuted, fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
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
            <button
              type="submit"
              disabled={busy || !assignAdvisorId}
              style={{
                padding: "0.35rem 0.9rem",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                backgroundColor: colors.blue,
                color: "#fff",
                fontWeight: 500,
                fontSize: "0.85rem"
              }}
            >
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
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              border: `1px solid ${colors.border}`,
              backgroundColor: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem"
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
  const [sectionAdvisors, setSectionAdvisors] = useState([]);
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

  const [newAdvisor, setNewAdvisor] = useState({
    advisorId: "",
    name: "",
    email: "",
    department: "",
    maxTeams: "2"
  });

  const [showStudentList, setShowStudentList] = useState(false);
  const [showAdvisorList, setShowAdvisorList] = useState(false);

  const [assignExistingAdvisorId, setAssignExistingAdvisorId] = useState("");

  const currentYear = new Date().getFullYear();
  const [newSection, setNewSection] = useState({
    courseCode: "",
    sectionNumber: "",
    year: String(currentYear),
    season: "Spring"
  });

  async function refreshAll() {
    const [sec, adv, cfg] = await Promise.all([
      getAdminSections(),
      getAdminAdvisors(),
      getConfig().catch(() => null)
    ]);
    setSections(sec);
    setAdvisors(adv);
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
    const [st, tm, sa] = await Promise.all([
      getAdminSectionStudents(sid),
      getAdminSectionTeams(sid),
      getAdminSectionAdvisors(sid)
    ]);
    setStudents(st);
    setTeams(tm);
    setSectionAdvisors(sa);
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
    try {
      await logout();
    } finally {
      onLogout();
    }
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
          marginBottom: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: `3px solid ${colors.blue}`
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: colors.blueDark }}>Admin dashboard</h2>
          <p style={{ margin: "0.25rem 0 0", color: colors.grayText }}>
            user #{user.userId} · role {user.role}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={busy}
            onClick={handleRefresh}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              backgroundColor: colors.gold,
              color: "#222",
              fontWeight: 500
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onLogoutClick}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${colors.blueDark}`,
              backgroundColor: "#fff",
              color: colors.blueDark,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {message && <p style={{ color: colors.success }}>{message}</p>}
      {error && <p style={{ color: colors.error }}>{error}</p>}

      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Managed sections</h3>
        {sections.length === 0 ? (
          <p style={{ color: "#666" }}>No sections are assigned to this admin account yet.</p>
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

        <h4 style={{ marginTop: "1.25rem" }}>Create new section</h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const yearNum = Number(newSection.year);
            if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
              setError("Year must be a valid 4-digit year (2000–2100).");
              return;
            }
            withBusy(
              () =>
                createAdminSection({
                  courseCode: newSection.courseCode.trim(),
                  sectionNumber: newSection.sectionNumber.trim(),
                  year: yearNum,
                  season: newSection.season
                }),
              "Section created and assigned to your account."
            );
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              placeholder="Course code (e.g. CMPE195A)"
              maxLength={20}
              value={newSection.courseCode}
              onChange={(e) => setNewSection({ ...newSection, courseCode: e.target.value })}
              required
              style={{ minWidth: "180px" }}
            />
            <input
              placeholder="Section # (e.g. 01)"
              maxLength={10}
              value={newSection.sectionNumber}
              onChange={(e) => setNewSection({ ...newSection, sectionNumber: e.target.value })}
              required
              style={{ width: "100px" }}
            />
            <input
              placeholder="Year"
              type="number"
              min={2000}
              max={2100}
              value={newSection.year}
              onChange={(e) => setNewSection({ ...newSection, year: e.target.value })}
              required
              style={{ width: "80px" }}
            />
            <select
              value={newSection.season}
              onChange={(e) => setNewSection({ ...newSection, season: e.target.value })}
              style={inputSm}
            >
              <option value="Spring">Spring</option>
              <option value="Fall">Fall</option>
            </select>
            <button type="submit" disabled={busy}>
              Create section
            </button>
          </div>
        </form>
      </section>

      {selectedSectionId && (
        <>
          {/* Card 1: Section Students list */}
          <section style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>
                Section students{" "}
                <span style={{ color: "#666", fontWeight: "normal", fontSize: "0.9rem" }}>
                  ({students.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowStudentList((v) => !v)}
                style={{ fontSize: "0.85rem" }}
              >
                {showStudentList ? "Collapse" : "Expand to show all students"}
              </button>
            </div>

            {showStudentList && (
              <ul style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                {students.length === 0 ? (
                  <li style={{ color: "#666" }}>No students enrolled yet.</li>
                ) : (
                  students.map((s) => (
                    <li key={s.studentId}>
                      {s.studentId} · {s.firstName} {s.lastName} ({s.email})
                    </li>
                  ))
                )}
              </ul>
            )}
          </section>

          {/* Card 2: Section Advisors list */}
          <section style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>
                Section advisors{" "}
                <span style={{ color: "#666", fontWeight: "normal", fontSize: "0.9rem" }}>
                  ({sectionAdvisors.length})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAdvisorList((v) => !v)}
                style={{ fontSize: "0.85rem" }}
              >
                {showAdvisorList ? "Collapse" : "Expand to show all advisors"}
              </button>
            </div>

            {showAdvisorList && (
              <ul style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                {sectionAdvisors.length === 0 ? (
                  <li style={{ color: "#666" }}>No advisors in this section yet.</li>
                ) : (
                  sectionAdvisors.map((a) => (
                    <li key={a.advisorId}>
                      {a.advisorId} · {a.name}
                      {" — "}
                      {a.teamNames ? (
                        <em>assigned to {a.teamNames}</em>
                      ) : (
                        <span style={{ color: "#888" }}>not yet assigned to a team</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </section>

          {/* Card 3: Enrollment / creation forms */}
          <section style={card}>
            <h3 style={{ marginTop: 0 }}>Enroll &amp; create</h3>

            <h4 style={{ marginTop: 0 }}>Add existing student to section</h4>
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
              <button
                type="submit"
                disabled={busy}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: colors.blue,
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: "0.9rem"
                }}
              >
                Add existing
              </button>
            </form>

            <h4 style={{ marginTop: "1rem" }}>Create new student and enroll in this section</h4>
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
              <button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: colors.gold,
                  color: "#222",
                  fontWeight: 500,
                  fontSize: "0.9rem"
                }}
              >
                Create + enroll
              </button>
            </form>

            <h4 style={{ marginTop: "1.5rem" }}>Add existing advisor to this section</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const id = assignExistingAdvisorId.trim();
                if (!id) return;
                withBusy(
                  () => addAdvisorToSection(Number(selectedSectionId), id),
                  "Advisor added to section."
                );
                setAssignExistingAdvisorId("");
              }}
            >
              <input
                placeholder="advisor_id (9 digits)"
                inputMode="numeric"
                pattern="\d{9}"
                minLength={9}
                maxLength={9}
                value={assignExistingAdvisorId}
                onChange={(e) => setAssignExistingAdvisorId(e.target.value)}
                required
              />
              <button type="submit" disabled={busy} style={{ marginLeft: "0.5rem" }}>
                Add existing
              </button>
            </form>

            <h4 style={{ marginTop: "1.5rem" }}>Create new advisor and assign to this section</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const maxTeamsParsed = parseInt(newAdvisor.maxTeams, 10);
                if (!Number.isInteger(maxTeamsParsed) || maxTeamsParsed < 1) {
                  setError("Max teams must be a whole number of at least 1.");
                  return;
                }
                withBusy(
                  () =>
                    createAdvisor({
                      advisorId: newAdvisor.advisorId.trim(),
                      name: newAdvisor.name.trim(),
                      email: newAdvisor.email.trim(),
                      department: newAdvisor.department.trim(),
                      maxTeams: maxTeamsParsed,
                      sectionId: Number(selectedSectionId)
                    }),
                  "New advisor created and added to this section."
                );
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  placeholder="advisor_id (9 digits)"
                  inputMode="numeric"
                  pattern="\d{9}"
                  minLength={9}
                  maxLength={9}
                  value={newAdvisor.advisorId}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, advisorId: e.target.value })}
                  required
                />
                <input
                  placeholder="full name"
                  maxLength={100}
                  value={newAdvisor.name}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, name: e.target.value })}
                  required
                />
                <input
                  placeholder="email"
                  type="email"
                  maxLength={100}
                  value={newAdvisor.email}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, email: e.target.value })}
                  required
                />
                <input
                  placeholder="department (optional)"
                  maxLength={100}
                  value={newAdvisor.department}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, department: e.target.value })}
                />
                <input
                  placeholder="max teams"
                  type="number"
                  min={1}
                  max={99}
                  style={{ width: "90px" }}
                  value={newAdvisor.maxTeams}
                  onChange={(e) => setNewAdvisor({ ...newAdvisor, maxTeams: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={busy} style={{ marginTop: "0.5rem" }}>
                Create advisor
              </button>
            </form>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0 }}>Team management</h3>
            <p style={{ color: colors.grayText, fontSize: "0.9rem", marginTop: 0 }}>
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
              <button
                type="submit"
                disabled={busy}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: colors.blue,
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: "0.9rem"
                }}
              >
                Create team
              </button>
            </form>

            <div style={{ marginTop: "1rem" }}>
              {teams.map((t) => (
                <TeamEditor
                  key={t.teamId}
                  team={t}
                  advisors={advisors}
                  sectionAdvisors={sectionAdvisors}
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

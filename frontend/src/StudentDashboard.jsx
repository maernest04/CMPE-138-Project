import React, { useEffect, useState } from "react";
import {
  getStudentDashboard,
  getStudentEnrollments,
  getTeamsForJoin,
  createTeam,
  joinTeam,
  leaveTeam,
  logout
} from "./api";

const card = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1rem",
  background: "#fafafa"
};

export function StudentDashboard({ user, onLogout }) {
  const [dash, setDash] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [joinSectionId, setJoinSectionId] = useState(null);
  const [joinTeams, setJoinTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [createSectionId, setCreateSectionId] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setError(null);
    const [d, e] = await Promise.all([getStudentDashboard(), getStudentEnrollments()]);
    setDash(d);
    setEnrollments(e);
    const availableSections = e.filter((x) => !x.onTeamInSection);

    if (!createSectionId && availableSections.length === 1) {
      setCreateSectionId(String(availableSections[0].sectionId));
    }

    // Keep existing join section only if still eligible; otherwise choose first eligible or clear.
    const keepJoinSection =
      joinSectionId && availableSections.some((s) => s.sectionId === joinSectionId);
    const nextJoinSectionId = keepJoinSection
      ? joinSectionId
      : availableSections.length
      ? availableSections[0].sectionId
      : null;

    setJoinSectionId(nextJoinSectionId);

    // Important: refresh joinable team list even when section doesn't change.
    if (nextJoinSectionId) {
      await loadJoinTeams(nextJoinSectionId);
    } else {
      setJoinTeams([]);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message || String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJoinTeams(sectionId) {
    if (!sectionId) {
      setJoinTeams([]);
      return;
    }
    try {
      const list = await getTeamsForJoin(sectionId);
      setJoinTeams(list);
    } catch (err) {
      setJoinTeams([]);
      if (err.status !== 400) {
        setError(err.message || String(err));
      }
    }
  }

  useEffect(() => {
    if (joinSectionId) {
      loadJoinTeams(joinSectionId);
    }
  }, [joinSectionId]);

  async function onCreateTeam(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const sid = Number(createSectionId);
      await createTeam(newTeamName.trim(), sid);
      setNewTeamName("");
      setMessage("Team created.");
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(teamId) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      await joinTeam(teamId);
      setMessage("Joined team.");
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLeave(teamId, teamName) {
    const ok = window.confirm(
      `Leave ${teamName}? If you are the last member, this team will be deleted.`
    );
    if (!ok) return;

    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      await leaveTeam(teamId);
      setMessage("Left team.");
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLogoutClick() {
    await logout();
    onLogout();
  }

  const creatableSections = enrollments.filter((x) => !x.onTeamInSection);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1.5rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Student dashboard</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#555" }}>
            {user.studentId} · logged in
          </p>
        </div>
        <button type="button" onClick={onLogoutClick}>
          Log out
        </button>
      </header>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!dash ? (
        <p>Loading…</p>
      ) : dash.teams.length === 0 ? (
        <p style={card}>You are not on any team yet. Create or join one below (per enrolled section).</p>
      ) : (
        dash.teams.map((t) => (
          <article key={t.teamId} style={card}>
            <h3 style={{ marginTop: 0 }}>
              {t.teamName}{" "}
              <span style={{ fontWeight: "normal", color: "#666" }}>
                · {t.courseCode}-{t.sectionNumber} ({t.season} {t.year})
              </span>
            </h3>
            <p>
              <strong>Company:</strong> {t.companyName || "—"}
            </p>
            <p>
              <strong>Advisors:</strong>{" "}
              {t.advisors.length
                ? t.advisors.map((a) => a.name).join(", ")
                : "—"}
            </p>
            <h4>Teammates</h4>
            <ul>
              {t.teammates.map((m) => (
                <li key={m.studentId}>
                  {m.firstName} {m.lastName} ({m.email})
                </li>
              ))}
            </ul>
            <button type="button" disabled={busy} onClick={() => onLeave(t.teamId, t.teamName)}>
              Leave team
            </button>
          </article>
        ))
      )}

      <section style={{ marginTop: "2rem" }}>
        <h3>Create team</h3>
        <p style={{ color: "#555", fontSize: "0.95rem" }}>
          Only if you are enrolled in the section and not already on a team there.
        </p>
        {creatableSections.length === 0 ? (
          <p>You have no sections where you can create a team (already on a team in each enrollment).</p>
        ) : (
          <form onSubmit={onCreateTeam} style={card}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label>
                Section
                <select
                  value={createSectionId}
                  onChange={(e) => setCreateSectionId(e.target.value)}
                  style={{ display: "block", marginTop: "0.25rem", minWidth: "240px" }}
                  required
                >
                  <option value="">Select section</option>
                  {creatableSections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>
                      {s.courseCode}-{s.sectionNumber} ({s.season} {s.year})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label>
                New team name
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  style={{ display: "block", marginTop: "0.25rem", width: "100%", maxWidth: "320px" }}
                  required
                />
              </label>
            </div>
            <button type="submit" disabled={busy}>
              Create team
            </button>
          </form>
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h3>Join existing team</h3>
        <p style={{ color: "#555", fontSize: "0.95rem" }}>
          Pick a section where you are enrolled and not yet on a team.
        </p>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Section
            <select
              value={joinSectionId || ""}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setJoinSectionId(v);
              }}
              style={{ display: "block", marginTop: "0.25rem", minWidth: "240px" }}
            >
              <option value="">Select section</option>
              {creatableSections.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>
                  {s.courseCode}-{s.sectionNumber} ({s.season} {s.year})
                </option>
              ))}
            </select>
          </label>
        </div>
        {!joinSectionId ? (
          <p>Select a section to see open teams.</p>
        ) : joinTeams.length === 0 ? (
          <p>No joinable teams (full or none listed).</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {joinTeams.map((t) => (
              <li
                key={t.teamId}
                style={{
                  ...card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}
              >
                <span>
                  <strong>{t.teamName}</strong> · {t.memberCount}/{t.maxMembers} members
                  {t.companyName ? ` · ${t.companyName}` : ""}
                </span>
                <button type="button" disabled={busy} onClick={() => onJoin(t.teamId)}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

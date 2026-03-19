// SJSU CMPE 138 SPRING 2026 TEAM2

import React, { useEffect, useState } from "react";
import AdminDashboard from "./Admin";

function App() {
  const [health, setHealth] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [error, setError] = useState(null);
  const [view, setView] = useState("home"); // "home", "admin", etc.

  useEffect(() => {
    async function load() {
      try {
        const healthRes = await fetch("/api/health");
        let healthJson = null;
        try {
          healthJson = await healthRes.json();
        } catch (e) {
          // Backend might return non-JSON (e.g., HTML error page); keep healthJson null.
        }
        if (!healthRes.ok) {
          setError(healthJson?.error || healthJson?.status || "Backend health check failed");
          setHealth(null);
        } else {
          setHealth(healthJson);
          setError(null);
        }

        const advRes = await fetch("/api/advisors");
        let advJson = null;
        try {
          advJson = await advRes.json();
        } catch (e) {
          // Ignore parse errors; we will treat it as empty advisors below.
        }
        if (!advRes.ok) {
          setError(advJson?.error || "Failed to load advisors");
          setAdvisors([]);
        } else {
          setAdvisors(Array.isArray(advJson) ? advJson : []);
        }
      } catch (err) {
        setError(String(err));
      }
    }
    load();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ padding: "1rem", background: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
        <button
          onClick={() => setView("home")}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "0.5rem",
            background: view === "home" ? "#007bff" : "#e0e0e0",
            color: view === "home" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Home
        </button>
        <button
          onClick={() => setView("admin")}
          style={{
            padding: "0.5rem 1rem",
            background: view === "admin" ? "#007bff" : "#e0e0e0",
            color: view === "admin" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Admin
        </button>
      </nav>

      {view === "home" ? (
        <div style={{ padding: "2rem" }}>
          <h1>Senior Capstone Viewer</h1>
          <p>Simple React frontend &gt; Express backend &gt; MySQL demo.</p>

          <section style={{ marginTop: "1.5rem" }}>
            <h2>Backend / DB Health</h2>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {health ? (
              <pre>{JSON.stringify(health, null, 2)}</pre>
            ) : (
              <p>Loading health check...</p>
            )}
          </section>

          <section style={{ marginTop: "1.5rem" }}>
            <h2>Advisors (capacity overview)</h2>
            {advisors.length === 0 ? (
              <p>Loading advisors...</p>
            ) : (
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  maxWidth: "800px"
                }}
              >
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                      Name
                    </th>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                      Email
                    </th>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                      Department
                    </th>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                      Current Teams
                    </th>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                      Max Teams
                    </th>
                    <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {advisors.map((a) => (
                    <tr key={a.advisor_id}>
                      <td style={{ padding: "0.25rem 0.5rem" }}>{a.name}</td>
                      <td style={{ padding: "0.25rem 0.5rem" }}>{a.email}</td>
                      <td style={{ padding: "0.25rem 0.5rem" }}>{a.department}</td>
                      <td
                        style={{ padding: "0.25rem 0.5rem", textAlign: "right" }}
                      >
                        {a.current_teams}
                      </td>
                      <td
                        style={{ padding: "0.25rem 0.5rem", textAlign: "right" }}
                      >
                        {a.max_teams}
                      </td>
                      <td
                        style={{ padding: "0.25rem 0.5rem", textAlign: "right" }}
                      >
                        {a.remaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : (
        <AdminDashboard />
      )}
    </main>
  );
}

export default App;


// SJSU CMPE 138 SPRING 2026 TEAM2

import React, { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const healthRes = await fetch("/api/health");
        const healthJson = await healthRes.json();
        setHealth(healthJson);

        const advRes = await fetch("/api/advisors");
        const advJson = await advRes.json();
        setAdvisors(advJson);
      } catch (err) {
        setError(String(err));
      }
    }
    load();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
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
    </main>
  );
}

export default App;


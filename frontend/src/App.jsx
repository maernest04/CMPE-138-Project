// SJSU CMPE 138 SPRING 2026 TEAM2

import React, { useEffect, useState } from "react";
import { getMe } from "./api";
import { LoginForm } from "./LoginForm";
import { StudentDashboard } from "./StudentDashboard";
import { AdminDashboard } from "./AdminDashboard";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));

    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "error" }));
  }, []);

  if (user === undefined) {
    return (
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "900px" }}>
      <h1 style={{ marginTop: 0 }}>Senior Capstone Viewer</h1>
      <p style={{ color: "#555" }}>Role-based dashboards · Express API + MySQL</p>

      <section style={{ marginBottom: "2rem", fontSize: "0.9rem" }}>
        <strong>API health:</strong>{" "}
        {health ? <code>{JSON.stringify(health)}</code> : "…"}
      </section>

      {user && user.role === "STUDENT" ? (
        <StudentDashboard user={user} onLogout={() => setUser(null)} />
      ) : user && user.role === "ADMIN" ? (
        <AdminDashboard user={user} onLogout={() => setUser(null)} />
      ) : user ? (
        <p>Logged in as {user.role}. This UI currently supports STUDENT and ADMIN.</p>
      ) : (
        <LoginForm
          onLoggedIn={(u) =>
            setUser({
              userId: u.userId,
              role: u.role,
              studentId: u.studentId,
              advisorId: u.advisorId
            })
          }
        />
      )}
    </main>
  );
}

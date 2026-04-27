// SJSU CMPE 138 SPRING 2026 TEAM2

import React, { useEffect, useState } from "react";
import { getMe } from "./api";
import { LoginForm } from "./LoginForm";
import { StudentDashboard } from "./StudentDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { colors } from "./theme";

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

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minHeight: "100vh",
        margin: 0,
        background: "linear-gradient(135deg, #ffffff 0%, #f3f6fb 40%, #e6edf7 100%)"
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "2.5rem 1.75rem 3rem"
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                color: colors.blueDark
              }}
            >
              Senior Capstone Viewer
            </h1>
            <p
              style={{
                margin: "0.35rem 0 0",
                color: colors.grayText,
                fontSize: "0.95rem"
              }}
            >
              Role-based dashboards · Express API + MySQL
            </p>
          </div>

          <div
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "999px",
              backgroundColor: colors.blue,
              color: "#fff",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              boxShadow: "0 0 0 2px rgba(255,179,0,0.5)"
            }}
          >
            <span style={{ fontWeight: 600 }}>API</span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: health && health.status === "ok" ? colors.gold : colors.error
              }}
            />
            <code style={{ fontSize: "0.75rem" }}>
              {health ? JSON.stringify(health) : "checking…"}
            </code>
          </div>
        </header>

        {user === undefined ? (
          <p style={{ color: colors.grayText }}>Loading…</p>
        ) : user && user.role === "STUDENT" ? (
          <StudentDashboard user={user} onLogout={() => setUser(null)} />
        ) : user && user.role === "ADMIN" ? (
          <AdminDashboard user={user} onLogout={() => setUser(null)} />
        ) : user ? (
          <p style={{ color: colors.error }}>
            Logged in as {user.role}. This UI currently supports STUDENT and ADMIN.
          </p>
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
      </div>
    </main>
  );
}

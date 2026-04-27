// SJSU CMPE 138 SPRING 2026 TEAM2
// Student / Admin login with a toggle (same API; role checked after success)

import React, { useState } from "react";
import { login } from "./api";
import { colors } from "./theme";

const field = { marginBottom: "0.75rem" };
const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: "320px",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box"
};

const toggleWrap = {
  display: "flex",
  gap: "0",
  marginBottom: "1rem",
  border: `1px solid ${colors.border}`,
  borderRadius: "999px",
  overflow: "hidden",
  maxWidth: "320px",
  backgroundColor: "#f3f6fb"
};

function toggleBtn(active) {
  return {
    flex: 1,
    padding: "0.6rem 0.75rem",
    border: "none",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    background: active ? colors.blue : "transparent",
    color: active ? "#fff" : colors.blueDark,
    transition: "background-color 0.15s ease, color 0.15s ease"
  };
}

export function LoginForm({ onLoggedIn }) {
  const [loginMode, setLoginMode] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function switchMode(mode) {
    setLoginMode(mode);
    setError(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await login(email, password);
      if (!data.user) {
        setError("Unable to login.");
        return;
      }
      const role = data.user.role;
      if (loginMode === "student" && role !== "STUDENT") {
        setError(
          role === "ADMIN"
            ? "This is an admin account. Switch to Admin login above."
            : `This account is ${role}. Use the matching login mode.`
        );
        return;
      }
      if (loginMode === "admin" && role !== "ADMIN") {
        setError(
          role === "STUDENT"
            ? "This is a student account. Switch to Student login above."
            : `This account is ${role}. Use the matching login mode.`
        );
        return;
      }
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        maxWidth: "520px",
        padding: "1.5rem 1.75rem 1.75rem",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        border: `1px solid ${colors.border}`
      }}
    >
      <h2>{loginMode === "student" ? "Student login" : "Admin login"}</h2>

      <div style={toggleWrap} role="group" aria-label="Login as">
        <button
          type="button"
          style={toggleBtn(loginMode === "student")}
          onClick={() => switchMode("student")}
          aria-pressed={loginMode === "student"}
        >
          Student
        </button>
        <button
          type="button"
          style={toggleBtn(loginMode === "admin")}
          onClick={() => switchMode("admin")}
          aria-pressed={loginMode === "admin"}
        >
          Admin
        </button>
      </div>

      {loginMode === "student" ? (
        <p style={{ color: colors.grayText, fontSize: "0.95rem" }}>
          Sample students: passwords <code>student1</code> … <code>student5</code> — see{" "}
          <code>TASK5_UPDATE.md</code> for emails.
        </p>
      ) : (
        <p style={{ color: colors.grayText, fontSize: "0.95rem" }}>
          Professor / TA: <code>admin@sjsu.edu</code> / <code>admin123</code> (from{" "}
          <code>sample_data.sql</code>).
        </p>
      )}

      <form onSubmit={onSubmit}>
        <div style={field}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={field}>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
        </div>
        {error && <p style={{ color: colors.error }}>{error}</p>}
        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: "0.25rem",
            padding: "0.55rem 1.25rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            background: "#E5A823",
            color: "#333333",
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 3px 8px rgba(0,0,0,0.14)",
            opacity: busy ? 0.7 : 1
          }}
        >
          {busy ? "Signing in…" : loginMode === "student" ? "Sign in as student" : "Sign in as admin"}
        </button>
      </form>
    </section>
  );
}

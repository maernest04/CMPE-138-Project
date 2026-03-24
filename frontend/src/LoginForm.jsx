// Student / Admin login with a toggle (same API; role checked after success)

import React, { useState } from "react";
import { login } from "./api";

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
  border: "1px solid #ccc",
  borderRadius: "8px",
  overflow: "hidden",
  maxWidth: "320px"
};

function toggleBtn(active) {
  return {
    flex: 1,
    padding: "0.6rem 0.75rem",
    border: "none",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    background: active ? "#1a5f2a" : "#f0f0f0",
    color: active ? "#fff" : "#333"
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
    <section style={{ maxWidth: "480px" }}>
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
        <p style={{ color: "#555", fontSize: "0.95rem" }}>
          Sample students: passwords <code>student1</code> … <code>student5</code> — see{" "}
          <code>TASK5_UPDATE.md</code> for emails.
        </p>
      ) : (
        <p style={{ color: "#555", fontSize: "0.95rem" }}>
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
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : loginMode === "student" ? "Sign in as student" : "Sign in as admin"}
        </button>
      </form>
    </section>
  );
}

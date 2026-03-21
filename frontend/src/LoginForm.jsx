// Student login (rejects non-student accounts)

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

export function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await login(email, password);
      if (data.user && data.user.role === "STUDENT") {
        onLoggedIn(data.user);
        return;
      }
      setError("This account is not a student. Use a student email (see README / TASK5_UPDATE.md).");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: "480px" }}>
      <h2>Student login</h2>
      <p style={{ color: "#555", fontSize: "0.95rem" }}>
        Sample students use passwords <code>student1</code> … <code>student5</code> (see{" "}
        <code>TASK5_UPDATE.md</code>).
      </p>
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
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

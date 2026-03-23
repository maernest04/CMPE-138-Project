
const jsonHeaders = { "Content-Type": "application/json" };

async function handle(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "Invalid JSON" };
  }
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function getMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) {
    return { user: null };
  }
  return handle(res);
}

export async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password })
  });
  return handle(res);
}

export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });
  return handle(res);
}

export async function getStudentDashboard() {
  const res = await fetch("/api/student/dashboard", { credentials: "include" });
  return handle(res);
}

export async function getStudentEnrollments() {
  const res = await fetch("/api/student/enrollments", { credentials: "include" });
  return handle(res);
}

export async function getTeamsForJoin(sectionId) {
  const res = await fetch(`/api/student/sections/${sectionId}/teams-for-join`, {
    credentials: "include"
  });
  return handle(res);
}

export async function createTeam(teamName, sectionId) {
  const res = await fetch("/api/student/teams/create", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ teamName, sectionId })
  });
  return handle(res);
}

export async function joinTeam(teamId) {
  const res = await fetch("/api/student/teams/join", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ teamId })
  });
  return handle(res);
}

export async function leaveTeam(teamId) {
  const res = await fetch("/api/student/teams/leave", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ teamId })
  });
  return handle(res);
}

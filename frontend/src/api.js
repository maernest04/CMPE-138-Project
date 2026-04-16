// SJSU CMPE 138 SPRING 2026 TEAM2

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

export async function getConfig() {
  const res = await fetch("/api/config");
  return handle(res);
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

export async function getAdminSections() {
  const res = await fetch("/api/admin/sections", { credentials: "include" });
  return handle(res);
}

export async function getAdminSectionStudents(sectionId) {
  const res = await fetch(`/api/admin/sections/${sectionId}/students`, { credentials: "include" });
  return handle(res);
}

export async function addSectionStudent(sectionId, payload) {
  const res = await fetch(`/api/admin/sections/${sectionId}/students`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function getAdminSectionTeams(sectionId) {
  const res = await fetch(`/api/admin/sections/${sectionId}/teams`, { credentials: "include" });
  return handle(res);
}

export async function createAdminTeam(sectionId, teamName) {
  const res = await fetch(`/api/admin/sections/${sectionId}/teams`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ teamName })
  });
  return handle(res);
}

export async function updateAdminTeam(teamId, payload) {
  const res = await fetch(`/api/admin/teams/${teamId}`, {
    method: "PUT",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  return handle(res);
}

export async function deleteAdminTeam(teamId) {
  const res = await fetch(`/api/admin/teams/${teamId}`, {
    method: "DELETE",
    credentials: "include"
  });
  return handle(res);
}

export async function addTeamMember(teamId, studentId) {
  const res = await fetch(`/api/admin/teams/${teamId}/members`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ studentId })
  });
  return handle(res);
}

export async function removeTeamMember(teamId, studentId) {
  const res = await fetch(`/api/admin/teams/${teamId}/members/${studentId}`, {
    method: "DELETE",
    credentials: "include"
  });
  return handle(res);
}

export async function getAdminAdvisors() {
  const res = await fetch("/api/admin/advisors", { credentials: "include" });
  return handle(res);
}

export async function addAdvisorToTeam(teamId, advisorId) {
  const res = await fetch(`/api/admin/teams/${teamId}/advisors`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ advisorId })
  });
  return handle(res);
}

export async function removeAdvisorFromTeam(teamId, advisorId) {
  const res = await fetch(`/api/admin/teams/${teamId}/advisors/${advisorId}`, {
    method: "DELETE",
    credentials: "include"
  });
  return handle(res);
}

export async function getAdminCompanies() {
  const res = await fetch("/api/admin/companies", { credentials: "include" });
  return handle(res);
}

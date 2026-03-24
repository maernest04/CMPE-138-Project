#!/usr/bin/env node
/**
 * Smoke + edge-case tests for Task 4 admin API.
 * Prereq: MySQL + sample_data.sql, backend running, admin login works.
 *
 *   cd backend && npm run dev
 *   npm run test:admin
 */

const BASE = process.env.BASE_URL || "http://127.0.0.1:4000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sjsu.edu";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const STUDENT_EMAIL = process.env.STUDENT_EMAIL || "nathan.chuop@sjsu.edu";
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || "student1";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function getSetCookieParts(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function extractSessionCookie(res) {
  const parts = getSetCookieParts(res);
  for (const p of parts) {
    const m = p.match(/^scv_session=([^;]+)/);
    if (m) return `scv_session=${m[1]}`;
  }
  return null;
}

async function json(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }
  return { status: res.status, data, ok: res.ok };
}

function expect(cond, msg) {
  if (!cond) fail(msg);
}

async function main() {
  const j = { "Content-Type": "application/json" };

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: j,
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const cookie = extractSessionCookie(loginRes);
  const loginBody = await json(loginRes);
  if (loginRes.status !== 200 || loginBody.data.user?.role !== "ADMIN") {
    fail(
      `Admin login failed (${loginRes.status}): ${JSON.stringify(loginBody.data)}\n` +
        `  → Check MySQL, sample_data.sql, backend/.env`
    );
  }
  if (!cookie) fail("Admin login: missing scv_session cookie");

  const headers = { Cookie: cookie };

  const me = await json(await fetch(`${BASE}/api/auth/me`, { headers }));
  expect(me.status === 200 && me.data.user?.role === "ADMIN", `/api/auth/me failed: ${me.status}`);

  const cfg = await json(await fetch(`${BASE}/api/config`));
  expect(cfg.status === 200 && typeof cfg.data.maxTeamMembers === "number", `GET /api/config: ${cfg.status}`);
  expect(cfg.data.fieldLimits?.teamName > 0, "config.fieldLimits missing");

  const sections = await json(await fetch(`${BASE}/api/admin/sections`, { headers }));
  expect(sections.status === 200 && sections.data.length > 0, "GET /api/admin/sections failed");
  const sectionId = sections.data[0].sectionId;

  const students = await json(await fetch(`${BASE}/api/admin/sections/${sectionId}/students`, { headers }));
  expect(students.status === 200 && students.data.length > 0, "GET students failed");

  const teams = await json(await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, { headers }));
  expect(teams.status === 200 && Array.isArray(teams.data), "GET teams failed");
  for (const t of teams.data) {
    expect(
      typeof t.memberCount === "number" && typeof t.maxMembers === "number",
      `Team ${t.teamId} missing memberCount/maxMembers`
    );
    expect(t.memberCount === t.members.length, "memberCount should match members.length");
  }

  const advisors = await json(await fetch(`${BASE}/api/admin/advisors`, { headers }));
  expect(advisors.status === 200 && advisors.data.length > 0, "GET advisors failed");
  expect(
    advisors.data.every((a) => typeof a.remaining === "number"),
    "advisor list should include remaining (from advisor_capacity_v)"
  );

  const companies = await json(await fetch(`${BASE}/api/admin/companies`, { headers }));
  expect(companies.status === 200, "GET companies failed");

  const noAuth = await json(await fetch(`${BASE}/api/admin/sections`));
  expect(noAuth.status === 401, `Unauthenticated admin should be 401, got ${noAuth.status}`);

  const stLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: j,
    body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD })
  });
  const stCookie = extractSessionCookie(stLogin);
  const stBody = await json(stLogin);
  expect(stLogin.status === 200 && stCookie, `Student login failed: ${JSON.stringify(stBody.data)}`);
  const stAdmin = await json(
    await fetch(`${BASE}/api/admin/sections`, { headers: { Cookie: stCookie } })
  );
  expect(stAdmin.status === 401, `Student on admin API should be 401, got ${stAdmin.status}`);

  const benId = "111111111";

  const syntheticId = `8${String(Date.now()).slice(-8)}`;
  const createSynth = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/students`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({
        studentId: syntheticId,
        firstName: "Edge",
        lastName: "Case",
        email: `edge.case.${Date.now()}@test.invalid`,
        major: "CMPE"
      })
    })
  );
  expect(createSynth.status === 201, `create synthetic student: ${createSynth.status} ${JSON.stringify(createSynth.data)}`);

  const dupTeam = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: `EdgeDup ${Date.now()}` })
    })
  );
  expect(dupTeam.status === 201, `create EdgeDup team: ${dupTeam.status}`);
  const dupTeamId = dupTeam.data.teamId;

  const add1 = await json(
    await fetch(`${BASE}/api/admin/teams/${dupTeamId}/members`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ studentId: syntheticId })
    })
  );
  expect(add1.status === 201, `add member: ${add1.status} ${JSON.stringify(add1.data)}`);

  const addDup = await json(
    await fetch(`${BASE}/api/admin/teams/${dupTeamId}/members`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ studentId: syntheticId })
    })
  );
  expect(addDup.status === 409, `duplicate member should be 409, got ${addDup.status}`);

  const otherTeam = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: `EdgeOther ${Date.now()}` })
    })
  );
  expect(otherTeam.status === 201, `create EdgeOther: ${otherTeam.status}`);
  const otherTeamId = otherTeam.data.teamId;

  const secondSectionTeam = await json(
    await fetch(`${BASE}/api/admin/teams/${otherTeamId}/members`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ studentId: syntheticId })
    })
  );
  expect(
    secondSectionTeam.status === 400,
    `student on two teams same section should be 400, got ${secondSectionTeam.status}`
  );

  await fetch(`${BASE}/api/admin/teams/${otherTeamId}`, { method: "DELETE", headers });
  await fetch(`${BASE}/api/admin/teams/${dupTeamId}`, { method: "DELETE", headers });

  const capBen = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: `CapBen ${Date.now()}` })
    })
  );
  expect(capBen.status === 201, `CapBen create: ${capBen.status}`);
  const capBenId = capBen.data.teamId;
  const assignBen1 = await json(
    await fetch(`${BASE}/api/admin/teams/${capBenId}/advisors`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ advisorId: benId })
    })
  );
  expect(assignBen1.status === 201, `assign Ben once: ${assignBen1.status}`);

  const capBen2 = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: `CapBen2 ${Date.now()}` })
    })
  );
  expect(capBen2.status === 201, `CapBen2 create: ${capBen2.status}`);
  const assignBen2 = await json(
    await fetch(`${BASE}/api/admin/teams/${capBen2.data.teamId}/advisors`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ advisorId: benId })
    })
  );
  expect(
    assignBen2.status === 400,
    `advisor at capacity should be 400, got ${assignBen2.status} ${JSON.stringify(assignBen2.data)}`
  );

  await fetch(`${BASE}/api/admin/teams/${capBen2.data.teamId}`, { method: "DELETE", headers });
  await fetch(`${BASE}/api/admin/teams/${capBenId}`, { method: "DELETE", headers });

  const anyTeamId = teams.data[0].teamId;
  const badCo = await json(
    await fetch(`${BASE}/api/admin/teams/${anyTeamId}`, {
      method: "PUT",
      headers: { ...headers, ...j },
      body: JSON.stringify({ companyId: 999999999 })
    })
  );
  expect(badCo.status === 404, `bad companyId should be 404, got ${badCo.status}`);

  const emptyRename = await json(
    await fetch(`${BASE}/api/admin/teams/${anyTeamId}`, {
      method: "PUT",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: "   " })
    })
  );
  expect(emptyRename.status === 400, `empty rename should be 400, got ${emptyRename.status}`);

  const ghostRm = await json(
    await fetch(`${BASE}/api/admin/teams/${anyTeamId}/members/999999999`, {
      method: "DELETE",
      headers
    })
  );
  expect(ghostRm.status === 404, `remove non-member should be 404, got ${ghostRm.status}`);

  const smokeName = `SmokeTest ${Date.now()}`;
  const createTeam = await json(
    await fetch(`${BASE}/api/admin/sections/${sectionId}/teams`, {
      method: "POST",
      headers: { ...headers, ...j },
      body: JSON.stringify({ teamName: smokeName })
    })
  );
  expect(createTeam.status === 201 && createTeam.data.teamId, "POST create smoke team failed");
  const smokeId = createTeam.data.teamId;
  const del = await json(
    await fetch(`${BASE}/api/admin/teams/${smokeId}`, {
      method: "DELETE",
      headers
    })
  );
  expect(del.status === 200 && del.data.ok, `DELETE smoke team failed: ${del.status}`);

  console.log("All admin API tests passed (smoke + edge cases).");
  console.log(`  Base: ${BASE}`);
  console.log(`  Section: ${sectionId}, maxTeamMembers (config): ${cfg.data.maxTeamMembers}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// SJSU CMPE 138 SPRING 2026 TEAM2
// Admin Features UI Component
// Task 4: Admin dashboard, section management, team management, etc.

import React, { useEffect, useState } from 'react';

// Use relative paths so Vite dev-server proxy can route to the backend.
const API_BASE = '/api';
const ADMIN_ID = '1'; // Development: hardcoded for now. Replace with real auth from Task 3.

export function AdminDashboard() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { 'X-Admin-ID': ADMIN_ID }
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // If backend/proxy returns HTML (e.g., 404), JSON parsing would throw.
        data = null;
      }
      if (!res.ok) {
        setError(data?.error || "Failed to load admin dashboard");
        setSections([]);
      } else {
        setSections(data.sections || []);
        setError(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading admin dashboard...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section>
        <h2>Your Sections ({sections.length})</h2>
        {sections.length === 0 ? (
          <p>No sections assigned.</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Course</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Section</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Semester</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Students</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Teams</th>
                <th style={{ textAlign: 'center', padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec) => (
                <tr key={sec.section_id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '0.5rem' }}>{sec.course_code}</td>
                  <td style={{ padding: '0.5rem' }}>{sec.section_number}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {sec.season} {sec.year}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {sec.student_count}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {sec.team_count}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedSection(sec.section_id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedSection && (
        <SectionManager
          sectionId={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
}

function SectionManager({ sectionId, onClose }) {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectionData();
  }, [sectionId, activeTab]);

  async function loadSectionData() {
    try {
      setLoading(true);
      if (activeTab === 'students') {
        const res = await fetch(
          `${API_BASE}/admin/sections/${sectionId}/students`,
          { headers: { 'X-Admin-ID': ADMIN_ID } }
        );
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        setStudents(data);
      } else if (activeTab === 'teams') {
        const res = await fetch(
          `${API_BASE}/admin/sections/${sectionId}/teams`,
          { headers: { 'X-Admin-ID': ADMIN_ID } }
        );
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        setTeams(data);
      }
    } catch (err) {
      console.error('Error loading section data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#f9f9f9'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Section Manager (ID: {sectionId})</h3>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <div style={{ marginTop: '1rem', borderBottom: '2px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'students' ? '#007bff' : '#e0e0e0',
            color: activeTab === 'students' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'teams' ? '#007bff' : '#e0e0e0',
            color: activeTab === 'teams' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Teams
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <p>Loading...</p>
        ) : activeTab === 'students' ? (
          <StudentsList students={students} />
        ) : (
          <TeamsList teams={teams} />
        )}
      </div>
    </div>
  );
}

function StudentsList({ students }) {
  return (
    <div>
      <h4>Enrolled Students ({students.length})</h4>
      {students.length === 0 ? (
        <p>No students enrolled.</p>
      ) : (
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.9rem'
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Student ID
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Name
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Email
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Team
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.student_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.25rem 0.5rem' }}>{st.student_id}</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  {st.first_name} {st.last_name}
                </td>
                <td style={{ padding: '0.25rem 0.5rem' }}>{st.email}</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  {st.team_name || '(unassigned)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TeamsList({ teams }) {
  return (
    <div>
      <h4>Project Teams ({teams.length})</h4>
      {teams.length === 0 ? (
        <p>No teams created.</p>
      ) : (
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.9rem'
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Team
              </th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>
                Company
              </th>
              <th style={{ textAlign: 'right', padding: '0.25rem 0.5rem' }}>
                Members
              </th>
              <th style={{ textAlign: 'right', padding: '0.25rem 0.5rem' }}>
                Advisors
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.team_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.25rem 0.5rem' }}>{team.team_name}</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  {team.company_name || '(none)'}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right' }}>
                  {team.member_count}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right' }}>
                  {team.advisor_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;

const API_BASE = '/api';

export const fetchTelemetry = async () => {
  const res = await fetch(`${API_BASE}/telemetry`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export const fetchMemories = async () => {
  const res = await fetch(`${API_BASE}/memories`);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
};

export const reportIncident = async (snapshot) => {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
  if (!res.ok) throw new Error('Failed to create incident');
  return res.json();
};

export const approveIncidentAction = async (incidentId) => {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve action');
  return res.json();
};

/**
 * Vision404 API Client
 * All requests go to the FastAPI backend at /api.
 * The frontend no longer uses mock data for real incidents or memories.
 */

const API_BASE = '/api';

function xhrFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      xhr.open(method, url, true);

      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => xhr.setRequestHeader(key, value));
        } else if (typeof options.headers === 'object') {
          Object.entries(options.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        }
      }

      xhr.onload = () => {
        const responseHeaders = new Headers();
        const rawHeaders = xhr.getAllResponseHeaders() || '';
        rawHeaders.trim().split(/[\r\n]+/).forEach(line => {
          const parts = line.split(': ');
          const header = parts.shift();
          const value = parts.join(': ');
          if (header) responseHeaders.set(header, value);
        });

        const res = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: responseHeaders,
          text: async () => xhr.responseText,
          json: async () => JSON.parse(xhr.responseText || '{}'),
        };
        resolve(res);
      };

      xhr.onerror = () => reject(new TypeError('XHR network request failed'));
      xhr.ontimeout = () => reject(new TypeError('XHR network request timed out'));

      xhr.send(options.body || null);
    } catch (e) {
      reject(e);
    }
  });
}

async function resilientFetch(url, options = {}) {
  try {
    return await window.fetch(url, options);
  } catch (err) {
    console.warn('[Vision404] Injected third-party extension or fetch error detected. Retrying with native XHR:', err);
    return await xhrFetch(url, options);
  }
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await resilientFetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Telemetry ─────────────────────────────────────────────────────────────────
export const fetchTelemetry = () => apiFetch('/telemetry');

// ── Memories (Hindsight) ──────────────────────────────────────────────────────
export const fetchMemories = (query = '') =>
  apiFetch(query ? `/memories?query=${encodeURIComponent(query)}` : '/memories');

export const fetchHindsightStats = () => apiFetch('/hindsight/stats');

export const reflectMemories = (context) =>
  apiFetch(`/memories/reflect?context=${encodeURIComponent(context)}`);

// ── Incidents ─────────────────────────────────────────────────────────────────
export const fetchIncidents = (limit = 50) =>
  apiFetch(`/incidents?limit=${limit}`);

export const fetchIncident = (id) => apiFetch(`/incidents/${id}`);

export const reportIncident = (snapshot, isSimulation = false, scenario = null) =>
  apiFetch(
    `/incidents?is_simulation=${isSimulation}${scenario ? `&scenario=${encodeURIComponent(scenario)}` : ''}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    }
  );

export const approveIncidentAction = (incidentId, notes = '') =>
  apiFetch(`/incidents/${incidentId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

export const rejectIncidentAction = (incidentId) =>
  apiFetch(`/incidents/${incidentId}/reject`, { method: 'POST' });

export const fetchAttempts = (incidentId) =>
  apiFetch(`/incidents/${incidentId}/attempts`);

// ── Outbox ────────────────────────────────────────────────────────────────────
export const retryOutbox = () => apiFetch('/outbox/retry', { method: 'POST' });
export const fetchPendingOutbox = () => apiFetch('/outbox/pending');

// ── Health ─────────────────────────────────────────────────────────────────────
export const fetchHealth = () => apiFetch('/health');

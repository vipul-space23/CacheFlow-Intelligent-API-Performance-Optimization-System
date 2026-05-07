const BASE = 'http://localhost:5000';

async function api(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

export const getMetrics       = () => api('/api/analytics/metrics');
export const getTimeSeries    = () => api('/api/analytics/timeseries');
export const getEndpoints     = () => api('/api/analytics/endpoints');
export const getCacheEntries  = () => api('/api/analytics/cache-entries');
export const flushCache       = () => api('/api/analytics/cache', { method: 'DELETE' });
export const resetTelemetry   = () => api('/api/analytics/reset', { method: 'POST' });
export const getSimEndpoints  = () => api('/api/simulator/endpoints');
export const runSimulator     = (body) => api('/api/simulator/run', { method: 'POST', body: JSON.stringify(body) });
export const getStatus        = () => api('/api/status');

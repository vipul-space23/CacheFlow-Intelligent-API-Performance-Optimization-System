import React, { useEffect, useState } from 'react';
import { Play, Zap, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getSimEndpoints, runSimulator } from '../../api';

export default function TrafficSimulator() {
  const [endpoints, setEndpoints] = useState([]);
  const [form, setForm] = useState({ endpoint: '/api/products', count: 20, delayMs: 100 });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSimEndpoints().then(r => {
      setEndpoints(r.data);
      if (r.data.length) setForm(f => ({ ...f, endpoint: r.data[0].path }));
    }).catch(() => {});
  }, []);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runSimulator({
        endpoint: form.endpoint,
        count: parseInt(form.count),
        delayMs: parseInt(form.delayMs),
      });
      setResult(res);
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
  }

  const summaryData = result ? [
    { name: 'L1 Hits (LRU)',  value: result.summary.L1Hits,   color: '#10b981' },
    { name: 'L2 Hits (Redis)',value: result.summary.L2Hits,   color: '#3b82f6' },
    { name: 'DB Fetches',     value: result.summary.dbFetches, color: '#ef4444' },
  ] : [];

  return (
    <div className="main">
      <div className="page-header">
        <h1>Traffic Simulator</h1>
        <p>Fire simulated requests at any endpoint and compare cache vs database performance</p>
      </div>

      {/* Config Form */}
      <div className="card mb-16">
        <div className="card-header"><span className="card-title">Configure Simulation</span></div>
        <div className="sim-form">
          <div className="form-row">
            <div className="form-group">
              <label>Target Endpoint</label>
              <select value={form.endpoint} onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}>
                {endpoints.map(ep => (
                  <option key={ep.path} value={ep.path}>{ep.label} ({ep.path})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Request Count</label>
              <input type="number" min={1} max={500} value={form.count}
                onChange={e => setForm(f => ({ ...f, count: e.target.value }))} />
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Delay Between Requests (ms)</label>
              <input type="number" min={0} max={2000} value={form.delayMs}
                onChange={e => setForm(f => ({ ...f, delayMs: e.target.value }))} />
            </div>
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? <><span className="spinner" /> Running…</> : <><Play size={14} /> Run Simulation</>}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card mb-16" style={{ color: 'var(--red)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary stats */}
          <div className="card mb-16">
            <div className="card-header"><span className="card-title">Simulation Results — {result.summary.endpoint}</span></div>
            <div className="sim-result-grid">
              {[
                { label: 'Total Requests',  val: result.summary.totalRequests },
                { label: 'Cache Hit Rate',  val: `${result.summary.cacheHitRate}%` },
                { label: 'Avg Latency',     val: `${result.summary.avgLatencyMs}ms` },
                { label: 'Min Latency',     val: `${result.summary.minLatencyMs}ms` },
                { label: 'Max Latency',     val: `${result.summary.maxLatencyMs}ms` },
                { label: 'DB Fetches',      val: result.summary.dbFetches },
              ].map(s => (
                <div className="sim-stat" key={s.label}>
                  <div className="sim-stat-val">{s.val}</div>
                  <div className="sim-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summaryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {summaryData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-request log */}
          <div className="card">
            <div className="card-header"><span className="card-title">Request Log</span></div>
            <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Endpoint</th>
                    <th>Source</th>
                    <th>Latency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td className="font-mono">{r.path}</td>
                      <td>
                        <span className={`badge ${r.source === 'L1-LRU' ? 'green' : r.source === 'L2-Redis' ? 'blue' : 'red'}`}>
                          {r.source}
                        </span>
                      </td>
                      <td>{r.latencyMs}ms</td>
                      <td><span className="badge green">{r.statusCode}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

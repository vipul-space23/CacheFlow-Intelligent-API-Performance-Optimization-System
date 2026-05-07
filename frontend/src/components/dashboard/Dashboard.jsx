import React, { useEffect, useState } from 'react';
import { Activity, Zap, Database, Clock, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { getMetrics, getTimeSeries, getEndpoints } from '../../api';

function StatCard({ label, value, sub, iconClass, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon ${iconClass}`}><Icon size={16} /></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics]   = useState(null);
  const [series, setSeries]     = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [error, setError]       = useState(null);

  async function load() {
    try {
      const [m, s, e] = await Promise.all([getMetrics(), getTimeSeries(), getEndpoints()]);
      setMetrics(m.data);
      setSeries(s.data);
      setEndpoints(e.data);
      setError(null);
    } catch (err) {
      setError('Cannot reach backend at localhost:5000. Make sure the server is running.');
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="main">
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="card" style={{ color: 'var(--red)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={18} /> {error}
        </div>
      </div>
    );
  }

  const hitRate   = metrics ? metrics.hitRate : 0;
  const totalReqs = metrics ? metrics.totalRequests : 0;
  const avgMs     = metrics ? metrics.avgLatencyMs : 0;
  const cacheMB   = metrics ? metrics.cacheSizeMB : '0.000';

  return (
    <div className="main">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Live cache performance metrics — refreshes every 4 seconds</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard label="Total Requests"   value={totalReqs.toLocaleString()} sub={`L1: ${metrics?.l1Hits ?? 0}  ·  L2: ${metrics?.l2Hits ?? 0}  ·  Miss: ${metrics?.misses ?? 0}`} iconClass="blue"  icon={Activity} />
        <StatCard label="Cache Hit Rate"   value={`${hitRate}%`}              sub={`Avg cached: ${metrics?.avgCachedLatencyMs ?? 0}ms`}   iconClass="green" icon={Zap}      />
        <StatCard label="Avg Latency"      value={`${avgMs}ms`}               sub={`Uncached: ${metrics?.avgUncachedLatencyMs ?? 0}ms`}   iconClass="amber" icon={Clock}    />
        <StatCard label="Cache Memory"     value={`${cacheMB} MB`}            sub={`${metrics?.cacheSize ?? 0} / ${metrics?.cacheCapacity ?? 200} entries`} iconClass="purple" icon={Database} />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Area chart: hits vs misses over time */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cache Hits vs Misses</span>
            <span className="card-sub">{series.length} data points</span>
          </div>
          {series.length === 0 ? (
            <div className="empty">Make some API requests to generate data…</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMiss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="hits"   stroke="#10b981" fill="url(#gHits)" strokeWidth={2} name="Hits"   />
                <Area type="monotone" dataKey="misses" stroke="#ef4444" fill="url(#gMiss)" strokeWidth={2} name="Misses" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: avg latency */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Avg Latency (ms)</span>
          </div>
          {series.length === 0 ? (
            <div className="empty">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="avgLatency" name="Avg ms" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Endpoints Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Top Endpoints</span>
        </div>
        {endpoints.length === 0 ? (
          <div className="empty">No endpoint traffic yet — hit some APIs to see stats</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Requests</th>
                  <th>Hits</th>
                  <th>Misses</th>
                  <th>Hit Rate</th>
                  <th>Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map(ep => (
                  <tr key={ep.path}>
                    <td className="font-mono">{ep.path}</td>
                    <td>{ep.requests}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{ep.hits}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>{ep.misses}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${ep.hitRate}%`, background: ep.hitRate > 70 ? 'var(--green)' : ep.hitRate > 40 ? 'var(--amber)' : 'var(--red)' }} />
                        </div>
                        {ep.hitRate}%
                      </div>
                    </td>
                    <td>{ep.avgLatencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

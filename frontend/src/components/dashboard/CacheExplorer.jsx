import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { getCacheEntries, flushCache } from '../../api';

export default function CacheExplorer() {
  const [data, setData]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getCacheEntries();
      setData(res.data);
      setStats(res.stats);
    } catch (e) {}
    setLoading(false);
  }

  async function handleFlush() {
    setFlushing(true);
    await flushCache().catch(() => {});
    await load();
    setFlushing(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="main">
      <div className="page-header">
        <h1>Cache Explorer</h1>
        <p>Live view of all entries stored in the LRU in-memory cache</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { label: 'Entries',    value: `${stats.size} / ${stats.capacity}`, iconClass: 'blue' },
            { label: 'Memory',     value: `${stats.totalBytesMB} MB`,          iconClass: 'green' },
            { label: 'Evictions',  value: stats.evictions,                     iconClass: 'red' },
            { label: 'Expirations',value: stats.expirations,                   iconClass: 'amber' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-header">
                <span className="stat-label">{s.label}</span>
                <div className={`stat-icon ${s.iconClass}`}><Database size={14} /></div>
              </div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card mb-16">
        <div className="card-header">
          <span className="card-title">LRU Cache Entries</span>
          <div className="flex gap-8">
            <button className="btn btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <button className="btn btn-danger" onClick={handleFlush} disabled={flushing}>
              <Trash2 size={14} /> {flushing ? 'Flushing…' : 'Flush All'}
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="empty">
            {loading ? <span className="spinner" /> : 'Cache is empty. Make some API requests first.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cache Key (URL)</th>
                  <th>Size</th>
                  <th>TTL Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => (
                  <tr key={entry.key}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="font-mono" style={{ wordBreak: 'break-all' }}>{entry.key}</td>
                    <td>{entry.size} B</td>
                    <td>
                      {entry.ttlRemaining === null
                        ? <span className="text-muted">Never expires</span>
                        : `${entry.ttlRemaining}s`}
                    </td>
                    <td>
                      {entry.expired
                        ? <span className="badge red">Expired</span>
                        : <span className="badge green">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Eviction Algorithm Info */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">LRU Algorithm Details</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '4px 0' }}>
          <div>
            <div className="settings-section-title" style={{ marginBottom: 10 }}>Data Structures</div>
            <ul style={{ fontSize: 14, lineHeight: 2, color: 'var(--text-muted)', paddingLeft: 16 }}>
              <li><strong style={{ color: 'var(--text)' }}>HashMap</strong> — O(1) key lookups</li>
              <li><strong style={{ color: 'var(--text)' }}>Doubly Linked List</strong> — O(1) move-to-front</li>
              <li><strong style={{ color: 'var(--text)' }}>TTL per node</strong> — Lazy expiration on get()</li>
            </ul>
          </div>
          <div>
            <div className="settings-section-title" style={{ marginBottom: 10 }}>Complexity</div>
            <ul style={{ fontSize: 14, lineHeight: 2, color: 'var(--text-muted)', paddingLeft: 16 }}>
              <li><strong style={{ color: 'var(--green)' }}>get()</strong> — O(1)</li>
              <li><strong style={{ color: 'var(--green)' }}>put()</strong> — O(1)</li>
              <li><strong style={{ color: 'var(--green)' }}>delete()</strong> — O(1)</li>
              <li><strong style={{ color: 'var(--blue)' }}>Space</strong> — O(n) where n = capacity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

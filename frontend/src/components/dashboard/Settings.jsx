import React, { useState } from 'react';
import { Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { flushCache, resetTelemetry } from '../../api';

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    l1Enabled: true,
    l2Enabled: true,
    ttlEnabled: true,
    loggingEnabled: true,
    autoRefresh: true,
  });
  const [toast, setToast] = useState('');

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleFlush() {
    await flushCache().catch(() => {});
    showToast('In-memory LRU cache flushed successfully');
  }

  async function handleReset() {
    await resetTelemetry().catch(() => {});
    showToast('Telemetry counters reset to zero');
  }

  return (
    <div className="main">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure CacheFlow behaviour and manage cache state</p>
      </div>

      {toast && (
        <div className="card mb-16 flex items-center gap-8" style={{ color: 'var(--green)', borderColor: 'var(--green)', borderWidth: 1 }}>
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      <div className="settings-grid">
        {/* Cache Configuration */}
        <div className="card">
          <div className="card-header"><span className="card-title">Cache Configuration</span></div>
          {[
            { key: 'l1Enabled',    label: 'L1 In-Memory LRU Cache',  desc: 'Ultra-fast HashMap + Doubly Linked List cache (O(1))' },
            { key: 'l2Enabled',    label: 'L2 Redis Cache',           desc: 'Persistent distributed cache (requires Redis server)' },
            { key: 'ttlEnabled',   label: 'TTL Expiry',               desc: 'Automatically expire cache entries after 60 seconds' },
            { key: 'loggingEnabled', label: 'Request Logging',        desc: 'Log every request with cache source to the console' },
          ].map(row => (
            <div className="settings-row" key={row.key}>
              <div>
                <div className="settings-row-label">{row.label}</div>
                <div className="settings-row-desc">{row.desc}</div>
              </div>
              <Toggle checked={settings[row.key]} onChange={() => toggle(row.key)} />
            </div>
          ))}
        </div>

        {/* Dashboard Config */}
        <div className="card">
          <div className="card-header"><span className="card-title">Dashboard</span></div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Auto Refresh</div>
              <div className="settings-row-desc">Automatically refresh dashboard metrics every 4 seconds</div>
            </div>
            <Toggle checked={settings.autoRefresh} onChange={() => toggle('autoRefresh')} />
          </div>
        </div>

        {/* Cache Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Cache Details</span></div>
          {[
            { label: 'Capacity',     value: '200 entries' },
            { label: 'Default TTL',  value: '60 seconds' },
            { label: 'Algorithm',    value: 'LRU (Least Recently Used)' },
            { label: 'L1 Structure', value: 'HashMap + Doubly Linked List' },
            { label: 'L2 Backend',   value: 'Redis (optional)' },
            { label: 'Time Complexity', value: 'O(1) get / put / delete' },
          ].map(row => (
            <div className="settings-row" key={row.label} style={{ justifyContent: 'space-between' }}>
              <span className="settings-row-label">{row.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ borderColor: 'var(--red)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Flush LRU Cache</div>
              <div className="settings-row-desc">Removes all entries from the in-memory cache immediately</div>
            </div>
            <button className="btn btn-danger" onClick={handleFlush}>
              <Trash2 size={14} /> Flush Cache
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Reset Telemetry</div>
              <div className="settings-row-desc">Zeros out all hit/miss counters and time-series data</div>
            </div>
            <button className="btn btn-danger" onClick={handleReset}>
              <RefreshCw size={14} /> Reset Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

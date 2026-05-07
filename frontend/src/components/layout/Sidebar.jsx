import React from 'react';
import { LayoutDashboard, Database, Activity, Settings, Zap, Package, Users, ShoppingCart } from 'lucide-react';

const NAV_CORE = [
  { id: 'dashboard', label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'explorer',  label: 'Cache Explorer',    icon: Database },
  { id: 'simulator', label: 'Traffic Simulator', icon: Activity },
  { id: 'settings',  label: 'Settings',          icon: Settings },
];

const NAV_DATA = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'orders',   label: 'Orders',   icon: ShoppingCart },
];

const GREEN  = '#22c55e';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';

export default function Sidebar({ page, setPage, status = {} }) {
  const backendColor = status.backend  ? GREEN : RED;
  const mongoColor   = status.mongodb  ? GREEN : AMBER;
  const redisColor   = status.redis    ? GREEN : AMBER;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Zap size={22} />
        CacheFlow
      </div>

      {NAV_CORE.map(({ id, label, icon: Icon }) => (
        <div
          key={id}
          className={`nav-item ${page === id ? 'active' : ''}`}
          onClick={() => setPage(id)}
        >
          <Icon size={17} />
          {label}
        </div>
      ))}

      <div style={{ margin: '10px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-light)' }}>
        Data
      </div>

      {NAV_DATA.map(({ id, label, icon: Icon }) => (
        <div
          key={id}
          className={`nav-item ${page === id ? 'active' : ''}`}
          onClick={() => setPage(id)}
        >
          <Icon size={17} />
          {label}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="status-badge">
          <div className="status-dot" style={{ background: backendColor }} />
          Backend: {status.backend ? 'online' : 'offline'}
        </div>
        <div className="status-badge" style={{ marginTop: 2 }}>
          <div className="status-dot" style={{ background: mongoColor }} />
          MongoDB: {status.mongodb ? 'connected' : 'offline'}
        </div>
        <div className="status-badge" style={{ marginTop: 2 }}>
          <div className="status-dot" style={{ background: redisColor }} />
          Redis: {status.redis ? 'online (L1+L2)' : 'offline (L1 only)'}
        </div>
      </div>
    </div>
  );
}


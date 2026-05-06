import React from 'react';
import { LayoutDashboard, Database, Activity, Settings, Zap } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <Zap className="logo-icon" size={28} />
        <span>CacheFlow</span>
      </div>
      <ul className="nav-links">
        <li className="nav-link active">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </li>
        <li className="nav-link">
          <Database size={20} />
          <span>Cache Explorer</span>
        </li>
        <li className="nav-link">
          <Activity size={20} />
          <span>Traffic Simulator</span>
        </li>
        <li className="nav-link">
          <Settings size={20} />
          <span>Settings</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

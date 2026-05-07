import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import CacheExplorer from './components/dashboard/CacheExplorer';
import TrafficSimulator from './components/dashboard/TrafficSimulator';
import Settings from './components/dashboard/Settings';
import ProductsPage from './components/dashboard/ProductsPage';
import UsersPage from './components/dashboard/UsersPage';
import OrdersPage from './components/dashboard/OrdersPage';
import { getStatus } from './api';

const PAGES = {
  dashboard: Dashboard,
  explorer:  CacheExplorer,
  simulator: TrafficSimulator,
  settings:  Settings,
  products:  ProductsPage,
  users:     UsersPage,
  orders:    OrdersPage,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [status, setStatus] = useState({ backend: false, redis: false, mongodb: false });
  const Page = PAGES[page] || Dashboard;

  useEffect(() => {
    async function checkStatus() {
      try {
        const s = await getStatus();
        setStatus({ backend: true, redis: s.redis, mongodb: s.mongodb });
      } catch {
        setStatus({ backend: false, redis: false, mongodb: false });
      }
    }
    checkStatus();
    const id = setInterval(checkStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage} status={status} />
      <Page />
    </div>
  );
}

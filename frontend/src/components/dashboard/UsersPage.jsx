import React, { useEffect, useState, useCallback } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, ShoppingBag, User } from 'lucide-react';

const BASE = 'http://localhost:5000';

const CACHE_COLORS = {
  'L1-LRU':  { bg: '#ecfdf5', color: '#10b981', label: 'L1 LRU' },
  'L2-Redis':{ bg: '#eff6ff', color: '#3b82f6', label: 'L2 Redis' },
  'DB':      { bg: '#fff7ed', color: '#f59e0b', label: 'DB Fetch' },
};

const ROLE_COLORS = { admin: 'purple', customer: 'blue', seller: 'amber' };

export default function UsersPage() {
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [cacheSource, setCacheSource] = useState(null);
  const [latency, setLatency]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [userOrders, setUserOrders] = useState({});
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/users?page=${page}&limit=${limit}`);
      const src = res.headers.get('X-Cache-Source');
      const lat = res.headers.get('X-Cache-Latency');
      const json = await res.json();
      setUsers(json.data || []);
      setTotal(json.total || 0);
      setCacheSource(src);
      setLatency(lat);
    } catch {
      setError('Cannot reach backend at localhost:5000');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);
  const src = CACHE_COLORS[cacheSource] || null;

  async function toggleUserOrders(userId) {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (userOrders[userId]) return;
    try {
      const res = await fetch(`${BASE}/api/users/${userId}/orders`);
      const json = await res.json();
      setUserOrders(prev => ({ ...prev, [userId]: json.data || [] }));
    } catch { setUserOrders(prev => ({ ...prev, [userId]: [] })); }
  }

  return (
    <div className="main">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Users</h1>
          <p>User registry — click any row to load their order history (demonstrates nested cache hits)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {src && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: src.bg, color: src.color, fontSize: 12, fontWeight: 700 }}>
              {src.label} · {latency}
            </span>
          )}
          <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ padding: '8px 14px', fontSize: 13 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.6s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: 'var(--blue)' }} />
            User Registry
          </span>
          <span className="card-sub">{total.toLocaleString()} total · page {page} of {totalPages || 1}</span>
        </div>

        {loading ? (
          <div className="empty"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <React.Fragment key={u._id}>
                    <tr
                      onClick={() => toggleUserOrders(u._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="font-mono" style={{ color: 'var(--text-muted)' }}>{(page - 1) * limit + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={14} style={{ color: 'var(--blue)' }} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                      <td><span className={`badge ${ROLE_COLORS[u.role] || 'blue'}`}>{u.role}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: u.active ? 'var(--green)' : 'var(--red)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.active ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.orders ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                    {expanded === u._id && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--bg-muted)', padding: '12px 20px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShoppingBag size={13} /> Order History for {u.name}
                          </div>
                          {!userOrders[u._id] ? (
                            <div className="spinner" />
                          ) : userOrders[u._id].length === 0 ? (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No orders found.</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {userOrders[u._id].slice(0, 6).map(o => (
                                <div key={o._id} style={{ padding: '8px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                                  <div style={{ fontWeight: 600 }}>Order #{o._id}</div>
                                  <div style={{ color: 'var(--text-muted)' }}>Qty: {o.quantity} · ${o.total}</div>
                                  <span className={`badge ${o.status === 'delivered' ? 'green' : o.status === 'cancelled' ? 'red' : 'amber'}`} style={{ marginTop: 4 }}>{o.status}</span>
                                </div>
                              ))}
                              {userOrders[u._id].length > 6 && (
                                <div style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>
                                  +{userOrders[u._id].length - 6} more…
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 10px' }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page - 2 + i;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '6px 12px', background: pg === page ? 'var(--blue)' : 'var(--bg-muted)', color: pg === page ? '#fff' : 'var(--text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {pg}
                </button>
              );
            })}
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '6px 10px' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

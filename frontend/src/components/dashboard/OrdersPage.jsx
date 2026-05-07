import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const BASE = 'http://localhost:5000';

const CACHE_COLORS = {
  'L1-LRU':  { bg: '#ecfdf5', color: '#10b981', label: 'L1 LRU' },
  'L2-Redis':{ bg: '#eff6ff', color: '#3b82f6', label: 'L2 Redis' },
  'DB':      { bg: '#fff7ed', color: '#f59e0b', label: 'DB Fetch' },
};

const STATUS_STYLES = {
  pending:    { bg: '#eff6ff', color: '#3b82f6' },
  processing: { bg: '#fff7ed', color: '#f59e0b' },
  shipped:    { bg: '#f5f3ff', color: '#8b5cf6' },
  delivered:  { bg: '#ecfdf5', color: '#10b981' },
  cancelled:  { bg: '#fef2f2', color: '#ef4444' },
};

const ALL_STATUSES = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('All');
  const [cacheSource, setCacheSource] = useState(null);
  const [latency, setLatency]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = status !== 'All' ? `&status=${status}` : '';
      const res = await fetch(`${BASE}/api/orders?page=${page}&limit=${limit}${st}`);
      const src = res.headers.get('X-Cache-Source');
      const lat = res.headers.get('X-Cache-Latency');
      const json = await res.json();
      setOrders(json.data || []);
      setTotal(json.total || 0);
      setCacheSource(src);
      setLatency(lat);
    } catch {
      setError('Cannot reach backend at localhost:5000');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);
  const src = CACHE_COLORS[cacheSource] || null;

  return (
    <div className="main">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Orders</h1>
          <p>Order management — filter by status and observe cache performance per filtered query</p>
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

      {/* Status Filter */}
      <div className="card mb-16" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Status:</span>
          {ALL_STATUSES.map(s => {
            const style = STATUS_STYLES[s];
            const active = status === s;
            return (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                style={{
                  padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.15s',
                  background: active ? (style?.bg || 'var(--blue)') : 'var(--bg-muted)',
                  color: active ? (style?.color || 'var(--blue)') : 'var(--text-muted)',
                  outline: active ? `2px solid ${style?.color || 'var(--blue)'}` : 'none',
                  outlineOffset: 1,
                }}
              >{s}</button>
            );
          })}
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={16} style={{ color: 'var(--blue)' }} />
            Order List
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
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const st = STATUS_STYLES[o.status] || {};
                  // Support both populated (MongoDB) and flat (mock) formats
                  const userName    = o.userId?.name    || `User #${o.userId}`;
                  const productName = o.productId?.name || `Product #${o.productId}`;
                  return (
                    <tr key={o._id}>
                      <td className="font-mono" style={{ color: 'var(--text-muted)' }}>#{o._id}</td>
                      <td style={{ fontWeight: 500 }}>{userName}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 180 }}>{productName}</td>
                      <td style={{ fontWeight: 600, textAlign: 'center' }}>{o.quantity}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>${o.total?.toFixed(2)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: st.bg, color: st.color }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
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

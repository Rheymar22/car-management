import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

const EVENT_META = {
  login_success: { label: 'Login',        color: '#16a34a', bg: '#dcfce7' },
  login_failed:  { label: 'Failed Login', color: '#dc2626', bg: '#fee2e2' },
  logout:        { label: 'Logout',       color: '#2563eb', bg: '#dbeafe' },
  register:      { label: 'Register',     color: '#7c3aed', bg: '#ede9fe' },
}

const getMeta = event => EVENT_META[event] || { label: event, color: '#64748b', bg: '#f1f5f9' }

export default function AdminLogs() {
  const [page, setPage]       = useState(1)
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filter, search],
    queryFn: () => api.get('/admin/logs', { params: { page, event: filter || undefined, search: search || undefined } }).then(r => r.data),
    keepPreviousData: true,
  })

  const logs = data?.data ?? []
  const meta = data?.meta ?? {}

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Activity Logs</h1>
          <p style={s.sub}>Login, logout, and registration events</p>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input
          style={s.searchInput}
          placeholder="Search by email or IP..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select style={s.select} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
          <option value="">All events</option>
          <option value="login_success">Login</option>
          <option value="login_failed">Failed Login</option>
          <option value="logout">Logout</option>
          <option value="register">Register</option>
        </select>
        {(filter || search) && (
          <button style={s.clearBtn} onClick={() => { setFilter(''); setSearch(''); setPage(1) }}>✕ Clear</button>
        )}
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        {isLoading ? (
          <div style={s.empty}>⏳ Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={s.empty}>No activity logs found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Event', 'User / Email', 'IP Address', 'Device', 'Time'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const m = getMeta(log.event)
                return (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: m.bg, color: m.color }}>{m.label}</span>
                    </td>
                    <td style={s.td}>
                      <div style={s.userName}>{log.user?.name || '—'}</div>
                      <div style={s.userEmail}>{log.email || log.user?.email || '—'}</div>
                    </td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px' }}>{log.ip_address}</td>
                    <td style={{ ...s.td, maxWidth: '200px' }}>
                      <div style={s.agent}>{log.user_agent}</div>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                      {new Date(log.created_at).toLocaleString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={s.pageInfo}>Page {meta.current_page} of {meta.last_page}</span>
          <button style={s.pageBtn} disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

const s = {
  page:        { fontFamily: "'DM Sans', sans-serif", color: '#0f172a', paddingBottom: '40px' },
  header:      { marginBottom: '20px' },
  title:       { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  sub:         { fontSize: '13px', color: '#64748b', margin: 0 },
  filters:     { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#0f172a', fontFamily: 'inherit', outline: 'none', minWidth: '220px' },
  select:      { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#0f172a', fontFamily: 'inherit', background: '#fff', cursor: 'pointer' },
  clearBtn:    { background: 'none', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  tableCard:   { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' },
  td:          { padding: '12px 16px', fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  badge:       { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  userName:    { fontWeight: '600', fontSize: '13px' },
  userEmail:   { fontSize: '11px', color: '#94a3b8', marginTop: '1px' },
  agent:       { fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty:       { padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  pagination:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' },
  pageBtn:     { background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  pageInfo:    { fontSize: '13px', color: '#64748b' },
}
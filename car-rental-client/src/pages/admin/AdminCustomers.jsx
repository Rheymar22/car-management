import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

function ScoreBadge({ score }) {
  const color = score >= 150 ? 'ac-score-trusted' : score >= 100 ? 'ac-score-standard' : score >= 50 ? 'ac-score-risk' : 'ac-score-high'
  const label = score >= 150 ? 'Trusted' : score >= 100 ? 'Standard' : score >= 50 ? 'At Risk' : 'High Risk'
  return <span className={'ac-score ' + color}>{score} — {label}</span>
}

function ScoreBar({ score }) {
  const pct = Math.round((score / 200) * 100)
  const color = score >= 150 ? '#16a34a' : score >= 100 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626'
  return (
    <div className="ac-bar-wrap">
      <div className="ac-bar-bg">
        <div className="ac-bar-fill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="ac-bar-pct">{score}/200</span>
    </div>
  )
}

export default function AdminCustomers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => api.get('/admin/customers').then(r => r.data),
  })

  const customers = data?.data ?? []

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="ac-title">Customer profiles</h1>
        <p className="ac-sub">{customers.length} registered customers</p>
      </div>

      {isLoading ? (
        <div className="ac-card ac-center">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="ac-card ac-center">
          <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
          <p>No customers registered yet.</p>
        </div>
      ) : (
        <div className="ac-grid">
          {customers.map(c => (
            <div key={c.id} className="ac-card">
              <div className="ac-card-header">
                <div className="ac-avatar">{(c.first_name || c.user?.name || '?').charAt(0).toUpperCase()}</div>
                <div className="ac-header-info">
                  <div className="ac-name">{c.first_name} {c.last_name || c.user?.name}</div>
                  <div className="ac-email">{c.user?.email}</div>
                </div>
              </div>

              <div className="ac-score-section">
                <div className="ac-score-label">Reliability score</div>
                <ScoreBadge score={c.reliability_score} />
                <ScoreBar score={c.reliability_score} />
              </div>

              <div className="ac-stats-row">
                <div className="ac-stat">
                  <div className="ac-stat-val">{c.total_rentals}</div>
                  <div className="ac-stat-lbl">Rentals</div>
                </div>
                <div className="ac-stat">
                  <div className="ac-stat-val ac-stat-warn">{c.late_returns}</div>
                  <div className="ac-stat-lbl">Late returns</div>
                </div>
                <div className="ac-stat">
                  <div className="ac-stat-val ac-stat-danger">{c.no_shows}</div>
                  <div className="ac-stat-lbl">No-shows</div>
                </div>
                <div className="ac-stat">
                  <div className="ac-stat-val ac-stat-danger">{c.damage_incidents}</div>
                  <div className="ac-stat-lbl">Damage</div>
                </div>
              </div>

              <div className="ac-info-rows">
                {c.phone && <div className="ac-info-row"><span className="ac-info-label">Phone</span><span>{c.phone}</span></div>}
                {c.city && <div className="ac-info-row"><span className="ac-info-label">City</span><span>{c.city}, {c.province}</span></div>}
              </div>

              <div className="ac-deposit">
                <span className="ac-deposit-label">Security deposit multiplier:</span>
                <span className="ac-deposit-val">
                  {c.reliability_score >= 150 ? '1× (Standard)' :
                   c.reliability_score >= 100 ? '1.5× (+50%)' :
                   c.reliability_score >= 50  ? '2× (Double)' :
                   '3× + Admin approval'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .ac-title { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 2px; }
        .ac-sub { font-size:13px; color:#64748b; }
        .ac-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
        .ac-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:18px; }
        .ac-center { text-align:center; padding:40px; color:#64748b; font-size:14px; }
        .ac-card-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .ac-avatar { width:42px; height:42px; border-radius:50%; background:#fee2e2; color:#dc2626; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ac-header-info { min-width:0; }
        .ac-name { font-size:15px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ac-email { font-size:12px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ac-score-section { margin-bottom:12px; }
        .ac-score-label { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; margin-bottom:5px; }
        .ac-score { display:inline-block; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; margin-bottom:8px; }
        .ac-score-trusted  { background:#d1fae5; color:#065f46; }
        .ac-score-standard { background:#dbeafe; color:#1e40af; }
        .ac-score-risk     { background:#fef3c7; color:#92400e; }
        .ac-score-high     { background:#fee2e2; color:#991b1b; }
        .ac-bar-wrap { display:flex; align-items:center; gap:8px; }
        .ac-bar-bg { flex:1; height:6px; background:#f1f5f9; border-radius:3px; overflow:hidden; }
        .ac-bar-fill { height:100%; border-radius:3px; transition:width .6s; }
        .ac-bar-pct { font-size:11px; color:#94a3b8; white-space:nowrap; }
        .ac-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
        .ac-stat { text-align:center; background:#f8fafc; border-radius:8px; padding:8px 4px; }
        .ac-stat-val { font-size:18px; font-weight:700; color:#0f172a; }
        .ac-stat-warn { color:#d97706; }
        .ac-stat-danger { color:#dc2626; }
        .ac-stat-lbl { font-size:10px; color:#94a3b8; margin-top:2px; }
        .ac-info-rows { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
        .ac-info-row { display:flex; justify-content:space-between; font-size:12px; color:#475569; }
        .ac-info-label { color:#94a3b8; }
        .ac-deposit { background:#fefce8; border:1px solid #fef08a; border-radius:8px; padding:8px 12px; font-size:12px; display:flex; justify-content:space-between; gap:8px; }
        .ac-deposit-label { color:#92400e; }
        .ac-deposit-val { font-weight:600; color:#0f172a; text-align:right; }
      `}</style>
    </div>
  )
}
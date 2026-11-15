import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const VERIFY_META = {
  verified:   { label: 'Verified',       cls: 'ac-ver-verified' },
  pending:    { label: 'Pending review', cls: 'ac-ver-pending' },
  rejected:   { label: 'Rejected',       cls: 'ac-ver-rejected' },
  unverified: { label: 'Unverified',     cls: 'ac-ver-unverified' },
}

const ID_LABELS = {
  passport: 'Passport',
  umid: 'UMID',
  philsys: 'PhilSys National ID',
  postal_id: 'Postal ID',
  voters_id: "Voter's ID",
  prc_id: 'PRC ID',
  sss_id: 'SSS ID',
  tin_id: 'TIN ID',
  philhealth_id: 'PhilHealth ID',
}

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

function VerifyBadge({ status }) {
  const meta = VERIFY_META[status] || VERIFY_META.unverified
  return <span className={'ac-ver ' + meta.cls}>{meta.label}</span>
}

// Loads a private document image through the authenticated API
function DocImage({ customerId, type, label }) {
  const [url, setUrl] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    setState('loading')
    setUrl(null)

    api
      .get('/admin/customers/' + customerId + '/documents/' + type, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('missing')
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [customerId, type])

  return (
    <div className="ac-doc">
      <div className="ac-doc-label">{label}</div>
      <div className="ac-doc-box">
        {state === 'loading' && <span className="ac-doc-msg">Loading...</span>}
        {state === 'missing' && <span className="ac-doc-msg">Not uploaded</span>}
        {state === 'ready' && (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} className="ac-doc-img" />
          </a>
        )}
      </div>
    </div>
  )
}

function ReviewModal({ customer, onClose }) {
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: payload => api.patch('/admin/customers/' + customer.id + '/verification', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      onClose()
    },
    onError: err => {
      const d = err.response && err.response.data
      setError((d && d.errors && d.errors.notes && d.errors.notes[0]) || (d && d.message) || 'Something went wrong. Please try again.')
    },
  })

  const docsComplete = customer.has_license_images && customer.has_second_id
  const status = customer.verification_status || 'unverified'
  const fullName = ((customer.first_name || '') + ' ' + (customer.last_name || '')).trim() || (customer.user && customer.user.name) || 'Customer'

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={e => e.stopPropagation()}>
        <div className="ac-modal-head">
          <div>
            <h3 className="ac-modal-title">{fullName}</h3>
            <p className="ac-modal-sub">{customer.user && customer.user.email}</p>
          </div>
          <VerifyBadge status={status} />
        </div>

        <div className="ac-docs">
          <DocImage customerId={customer.id} type="license_front" label="License (front)" />
          <DocImage customerId={customer.id} type="license_back" label="License (back)" />
          <DocImage customerId={customer.id} type="second_id" label={'Second ID: ' + (ID_LABELS[customer.second_id_type] || customer.second_id_type || 'not provided')} />
        </div>

        {customer.verification_submitted_at && (
          <p className="ac-modal-meta">
            Submitted {new Date(customer.verification_submitted_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
        {status === 'rejected' && customer.verification_notes && (
          <p className="ac-modal-meta">Previous rejection reason: {customer.verification_notes}</p>
        )}
        {!docsComplete && <p className="ac-modal-warn">This customer hasn't uploaded all required documents yet.</p>}

        {error && <div className="ac-modal-err">{error}</div>}

        {rejecting ? (
          <div>
            <label className="ac-modal-label">Reason for rejection (the customer will see this)</label>
            <textarea
              className="ac-modal-textarea"
              rows={3}
              placeholder="e.g. License photo is blurry, please upload a clearer picture."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="ac-modal-actions">
              <button className="ac-btn ac-btn-ghost" onClick={() => { setRejecting(false); setError('') }}>Back</button>
              <button
                className="ac-btn ac-btn-red"
                disabled={!notes.trim() || mutation.isPending}
                onClick={() => { setError(''); mutation.mutate({ action: 'reject', notes: notes.trim() }) }}
              >
                {mutation.isPending ? 'Saving...' : 'Confirm rejection'}
              </button>
            </div>
          </div>
        ) : (
          <div className="ac-modal-actions">
            <button className="ac-btn ac-btn-ghost" onClick={onClose}>Close</button>
            <button className="ac-btn ac-btn-red-outline" onClick={() => setRejecting(true)}>Reject...</button>
            <button
              className="ac-btn ac-btn-green"
              disabled={!docsComplete || status === 'verified' || mutation.isPending}
              onClick={() => { setError(''); mutation.mutate({ action: 'verify' }) }}
            >
              {mutation.isPending ? 'Saving...' : status === 'verified' ? 'Already verified' : 'Verify customer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminCustomers() {
  const [filter, setFilter] = useState('all')
  const [reviewing, setReviewing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => api.get('/admin/customers').then(r => r.data),
  })

  // Admin accounts have a profile too, but they are not customers
  const customers = (data?.data ?? []).filter(c => !c.user || c.user.role !== 'admin')

  const counts = customers.reduce((acc, c) => {
    const st = c.verification_status || 'unverified'
    acc[st] = (acc[st] || 0) + 1
    return acc
  }, {})

  const filtered = filter === 'all' ? customers : customers.filter(c => (c.verification_status || 'unverified') === filter)

  const chips = [
    ['all', 'All', customers.length],
    ['pending', 'Pending review', counts.pending || 0],
    ['unverified', 'Unverified', counts.unverified || 0],
    ['verified', 'Verified', counts.verified || 0],
    ['rejected', 'Rejected', counts.rejected || 0],
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="ac-title">Customer profiles</h1>
        <p className="ac-sub">
          {customers.length} registered customers · {counts.pending || 0} awaiting review
        </p>
      </div>

      <div className="ac-chips">
        {chips.map(([key, label, count]) => (
          <button key={key} className={'ac-chip ' + (filter === key ? 'ac-chip-on' : '')} onClick={() => setFilter(key)}>
            {label} <span className="ac-chip-count">{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="ac-card ac-center">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className="ac-card ac-center">
          <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
          <p>No customers found for this filter.</p>
        </div>
      ) : (
        <div className="ac-grid">
          {filtered.map(c => {
            const status = c.verification_status || 'unverified'
            const hasDocs = c.has_second_id || c.has_license_images
            return (
              <div key={c.id} className="ac-card">
                <div className="ac-card-header">
                  <div className="ac-avatar">{(c.first_name || (c.user && c.user.name) || '?').charAt(0).toUpperCase()}</div>
                  <div className="ac-header-info">
                    <div className="ac-name">{c.first_name} {c.last_name || (c.user && c.user.name)}</div>
                    <div className="ac-email">{c.user && c.user.email}</div>
                  </div>
                  <VerifyBadge status={status} />
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

                {hasDocs ? (
                  <button
                    className={'ac-review-btn ' + (status === 'pending' ? 'ac-review-btn-primary' : '')}
                    onClick={() => setReviewing(c)}
                  >
                    {status === 'pending' ? 'Review documents' : 'View documents'}
                  </button>
                ) : (
                  <div className="ac-no-docs">No documents submitted yet</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {reviewing && <ReviewModal customer={reviewing} onClose={() => setReviewing(null)} />}

      <style>{`
        .ac-title { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 2px; }
        .ac-sub { font-size:13px; color:#64748b; }
        .ac-chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
        .ac-chip { background:none; border:1.5px solid #e2e8f0; color:#64748b; padding:6px 14px; border-radius:20px; font-size:12px; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; }
        .ac-chip:hover { border-color:#cbd5e1; }
        .ac-chip-on { background:#0f172a; border-color:#0f172a; color:#fff; }
        .ac-chip-count { background:#f1f5f9; color:#64748b; padding:1px 7px; border-radius:10px; font-size:11px; }
        .ac-chip-on .ac-chip-count { background:rgba(255,255,255,0.25); color:#fff; }
        .ac-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
        .ac-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:18px; }
        .ac-center { text-align:center; padding:40px; color:#64748b; font-size:14px; }
        .ac-card-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .ac-avatar { width:42px; height:42px; border-radius:50%; background:#fee2e2; color:#dc2626; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ac-header-info { min-width:0; flex:1; }
        .ac-name { font-size:15px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ac-email { font-size:12px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ac-ver { font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
        .ac-ver-verified { background:#d1fae5; color:#065f46; }
        .ac-ver-pending { background:#fef3c7; color:#92400e; }
        .ac-ver-rejected { background:#fee2e2; color:#991b1b; }
        .ac-ver-unverified { background:#f1f5f9; color:#64748b; }
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
        .ac-deposit { background:#fefce8; border:1px solid #fef08a; border-radius:8px; padding:8px 12px; font-size:12px; display:flex; justify-content:space-between; gap:8px; margin-bottom:12px; }
        .ac-deposit-label { color:#92400e; }
        .ac-deposit-val { font-weight:600; color:#0f172a; text-align:right; }
        .ac-review-btn { width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; color:#475569; padding:9px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }
        .ac-review-btn:hover { background:#f1f5f9; }
        .ac-review-btn-primary { background:#dc2626; border-color:#dc2626; color:#fff; }
        .ac-review-btn-primary:hover { background:#b91c1c; }
        .ac-no-docs { text-align:center; font-size:12px; color:#94a3b8; padding:8px 0; }
        .ac-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); display:flex; align-items:center; justify-content:center; z-index:100; padding:16px; overflow-y:auto; }
        .ac-modal { background:#fff; border-radius:16px; padding:22px; width:100%; max-width:720px; max-height:92vh; overflow-y:auto; }
        .ac-modal-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px; }
        .ac-modal-title { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 2px; }
        .ac-modal-sub { font-size:13px; color:#64748b; margin:0; }
        .ac-docs { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
        .ac-doc-label { font-size:11px; font-weight:600; color:#475569; margin-bottom:6px; }
        .ac-doc-box { border:1.5px solid #e2e8f0; border-radius:10px; min-height:140px; display:flex; align-items:center; justify-content:center; background:#f8fafc; overflow:hidden; }
        .ac-doc-img { width:100%; height:160px; object-fit:cover; display:block; }
        .ac-doc-msg { font-size:12px; color:#94a3b8; }
        .ac-modal-meta { font-size:12px; color:#64748b; margin:0 0 8px; }
        .ac-modal-warn { background:#fffbeb; border:1px solid #fde68a; color:#92400e; font-size:12px; border-radius:8px; padding:8px 12px; margin:0 0 12px; }
        .ac-modal-err { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:12px; border-radius:8px; padding:8px 12px; margin-bottom:12px; }
        .ac-modal-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:6px; }
        .ac-modal-textarea { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:13px; font-family:inherit; resize:vertical; }
        .ac-modal-textarea:focus { outline:none; border-color:#94a3b8; }
        .ac-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; flex-wrap:wrap; }
        .ac-btn { padding:10px 16px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; border:none; }
        .ac-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .ac-btn-ghost { background:#f1f5f9; color:#475569; }
        .ac-btn-green { background:#16a34a; color:#fff; }
        .ac-btn-green:hover:not(:disabled) { background:#15803d; }
        .ac-btn-red { background:#dc2626; color:#fff; }
        .ac-btn-red:hover:not(:disabled) { background:#b91c1c; }
        .ac-btn-red-outline { background:#fff; color:#dc2626; border:1.5px solid #fca5a5; }
        @media (max-width:640px) { .ac-docs { grid-template-columns:1fr; } }
      `}</style>
    </div>
  )
}
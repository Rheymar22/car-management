import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  no_show:   'bg-orange-100 text-orange-700',
}

export default function AdminBookings() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [completeModal, setCompleteModal] = useState(null)
  const [hasDamage, setHasDamage] = useState(false)
  const [damageNotes, setDamageNotes] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-bookings'],
    queryFn: () => api.get('/admin/bookings').then(r => r.data),
  })

  const confirmMutation = useMutation({
    mutationFn: id => api.patch(`/bookings/${id}/confirm`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-bookings'] }),
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, has_damage, damage_notes }) =>
      api.patch(`/bookings/${id}/complete`, { has_damage, damage_notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-bookings'] })
      closeCompleteModal()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: id => api.patch(`/bookings/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-bookings'] }),
  })

  const openCompleteModal = (booking) => {
    setCompleteModal(booking)
    setHasDamage(false)
    setDamageNotes('')
  }

  const closeCompleteModal = () => {
    setCompleteModal(null)
    setHasDamage(false)
    setDamageNotes('')
  }

  const submitComplete = () => {
    completeMutation.mutate({
      id: completeModal.id,
      has_damage: hasDamage,
      damage_notes: hasDamage ? damageNotes : null,
    })
  }

  const allBookings = data?.data ?? []
  const filtered = filter === 'all' ? allBookings : allBookings.filter(b => b.status === filter)
  const counts = ['pending','confirmed','active','completed','cancelled'].reduce((acc, s) => {
    acc[s] = allBookings.filter(b => b.status === s).length; return acc
  }, {})

  const isLateReturn = completeModal && new Date() > new Date(completeModal.dropoff_datetime)

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="ab-title">All bookings</h1>
        <p className="ab-sub">{allBookings.length} total bookings</p>
      </div>

      <div className="ab-filters">
        {[['all', 'All', allBookings.length], ...Object.entries(counts).map(([k,v]) => [k, k.charAt(0).toUpperCase()+k.slice(1), v])].map(([key, label, count]) => (
          <button key={key} className={'ab-filter ' + (filter === key ? 'ab-filter-on' : '')}
            onClick={() => setFilter(key)}>
            {label} <span className="ab-count">{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="ab-card ab-center">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="ab-card ab-center">
          <div style={{fontSize:40,marginBottom:10}}>📋</div>
          <p>No bookings found for this filter.</p>
        </div>
      ) : (
        <div className="ab-card">
          <div className="ab-table-wrap">
            <table className="ab-table">
              <thead>
                <tr>
                  {['Ref','Customer','Vehicle','Dates','Location','Status','Amount','Actions'].map(h => (
                    <th key={h} className="ab-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="ab-tr">
                    <td className="ab-td"><span className="ab-ref">{b.booking_ref}</span></td>
                    <td className="ab-td">
                      <div className="ab-customer-name">{b.user?.name}</div>
                      <div className="ab-customer-email">{b.user?.email}</div>
                    </td>
                    <td className="ab-td">
                      <div className="ab-vehicle-name">{b.vehicle?.make} {b.vehicle?.model}</div>
                      <div className="ab-vehicle-plate">{b.vehicle?.plate_number}</div>
                    </td>
                    <td className="ab-td">
                      <div className="ab-date">{new Date(b.pickup_datetime).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div>
                      <div className="ab-date-sep">to</div>
                      <div className="ab-date">{new Date(b.dropoff_datetime).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</div>
                    </td>
                    <td className="ab-td">
                      <div className="ab-loc">{b.pickup_location}</div>
                    </td>
                    <td className="ab-td">
                      <span className={'ab-badge ' + (STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-500')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="ab-td ab-amount">₱{Number(b.total_amount).toLocaleString()}</td>
                    <td className="ab-td">
                      <div className="ab-actions">
                        {b.status === 'pending' && (
                          <button className="ab-action-btn ab-action-blue"
                            onClick={() => { if(window.confirm('Confirm this booking? The customer will then be able to pay.')) confirmMutation.mutate(b.id) }}>
                            Confirm
                          </button>
                        )}
                        {b.status === 'active' && (
                          <button className="ab-action-btn ab-action-green"
                            onClick={() => openCompleteModal(b)}>
                            Complete
                          </button>
                        )}
                        {['pending','confirmed'].includes(b.status) && (
                          <button className="ab-action-btn ab-action-red"
                            onClick={() => { if(window.confirm('Cancel this booking?')) cancelMutation.mutate(b.id) }}>
                            Cancel
                          </button>
                        )}
                        <a href={`/api/v1/bookings/${b.id}/invoice`} target="_blank" rel="noreferrer"
                          className="ab-action-btn">PDF</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {completeModal && (
        <div className="ab-modal-overlay" onClick={closeCompleteModal}>
          <div className="ab-modal" onClick={e => e.stopPropagation()}>
            <h3 className="ab-modal-title">Complete booking</h3>
            <p className="ab-modal-sub">
              {completeModal.vehicle?.make} {completeModal.vehicle?.model} — {completeModal.booking_ref}
            </p>

            {isLateReturn && (
              <div className="ab-modal-warning">
                ⚠️ This vehicle is being returned after the scheduled dropoff time
                ({new Date(completeModal.dropoff_datetime).toLocaleString('en-PH', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}).
                This will be automatically recorded as a late return.
              </div>
            )}

            <label className="ab-modal-checkbox">
              <input
                type="checkbox"
                checked={hasDamage}
                onChange={e => setHasDamage(e.target.checked)}
              />
              <span>Vehicle was returned with damage</span>
            </label>

            {hasDamage && (
              <div style={{marginTop:10}}>
                <label className="ab-modal-label">Damage notes</label>
                <textarea
                  className="ab-modal-textarea"
                  rows={3}
                  placeholder="Describe the damage (e.g. scratched rear bumper, cracked windshield)..."
                  value={damageNotes}
                  onChange={e => setDamageNotes(e.target.value)}
                />
              </div>
            )}

            <p className="ab-modal-note">
              {(hasDamage || isLateReturn)
                ? 'This will affect the customer\'s reliability score.'
                : 'No issues reported — this will be a clean completion.'}
            </p>

            <div className="ab-modal-actions">
              <button className="ab-modal-btn ab-modal-btn-cancel" onClick={closeCompleteModal}>
                Cancel
              </button>
              <button
                className="ab-modal-btn ab-modal-btn-confirm"
                onClick={submitComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? 'Saving...' : 'Confirm completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ab-title { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 2px; }
        .ab-sub { font-size:13px; color:#64748b; }
        .ab-filters { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
        .ab-filter { background:none; border:1.5px solid #e2e8f0; color:#64748b; padding:6px 14px; border-radius:20px; font-size:12px; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all .15s; }
        .ab-filter:hover { border-color:#cbd5e1; }
        .ab-filter-on { background:#0f172a; border-color:#0f172a; color:#fff; }
        .ab-count { background:rgba(255,255,255,0.2); padding:1px 6px; border-radius:10px; font-size:11px; }
        .ab-filter-on .ab-count { background:rgba(255,255,255,0.25); }
        .ab-filter:not(.ab-filter-on) .ab-count { background:#f1f5f9; color:#64748b; }
        .ab-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:20px; }
        .ab-center { text-align:center; padding:40px; color:#64748b; font-size:14px; }
        .ab-table-wrap { overflow-x:auto; }
        .ab-table { width:100%; border-collapse:collapse; font-size:13px; }
        .ab-th { text-align:left; padding:8px 10px; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.5px; border-bottom:1.5px solid #e2e8f0; white-space:nowrap; }
        .ab-tr { border-bottom:1px solid #f1f5f9; }
        .ab-tr:hover { background:#fafafa; }
        .ab-td { padding:10px 10px; vertical-align:middle; }
        .ab-ref { font-family:monospace; font-size:12px; color:#64748b; }
        .ab-customer-name { font-weight:600; color:#0f172a; }
        .ab-customer-email { font-size:11px; color:#94a3b8; }
        .ab-vehicle-name { font-weight:600; color:#0f172a; }
        .ab-vehicle-plate { font-size:11px; color:#94a3b8; font-family:monospace; }
        .ab-date { font-size:12px; color:#0f172a; white-space:nowrap; }
        .ab-date-sep { font-size:11px; color:#94a3b8; }
        .ab-loc { font-size:12px; color:#475569; max-width:120px; }
        .ab-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:capitalize; white-space:nowrap; }
        .ab-amount { font-weight:600; color:#0f172a; white-space:nowrap; }
        .ab-actions { display:flex; gap:5px; flex-wrap:wrap; }
        .ab-action-btn { background:none; border:1px solid #e2e8f0; color:#475569; padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-block; transition:all .15s; }
        .ab-action-btn:hover { background:#f1f5f9; }
        .ab-action-green { color:#16a34a; border-color:#bbf7d0; }
        .ab-action-green:hover { background:#f0fdf4; }
        .ab-action-blue { color:#2563eb; border-color:#bfdbfe; }
        .ab-action-blue:hover { background:#eff6ff; }
        .ab-action-red { color:#dc2626; border-color:#fca5a5; }
        .ab-action-red:hover { background:#fee2e2; }
        .ab-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:16px; }
        .ab-modal { background:#fff; border-radius:16px; padding:24px; width:100%; max-width:420px; }
        .ab-modal-title { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 4px; }
        .ab-modal-sub { font-size:13px; color:#64748b; margin:0 0 16px; }
        .ab-modal-warning { background:#fffbeb; border:1px solid #fde68a; color:#92400e; font-size:12px; border-radius:10px; padding:10px 12px; margin-bottom:16px; line-height:1.5; }
        .ab-modal-checkbox { display:flex; align-items:center; gap:8px; font-size:13px; color:#0f172a; cursor:pointer; }
        .ab-modal-checkbox input { width:16px; height:16px; }
        .ab-modal-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:6px; }
        .ab-modal-textarea { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:13px; font-family:inherit; resize:vertical; }
        .ab-modal-textarea:focus { outline:none; border-color:#94a3b8; }
        .ab-modal-note { font-size:12px; color:#64748b; margin:16px 0 0; }
        .ab-modal-actions { display:flex; gap:10px; margin-top:20px; }
        .ab-modal-btn { flex:1; padding:10px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; border:none; }
        .ab-modal-btn-cancel { background:#f1f5f9; color:#475569; }
        .ab-modal-btn-cancel:hover { background:#e2e8f0; }
        .ab-modal-btn-confirm { background:#16a34a; color:#fff; }
        .ab-modal-btn-confirm:hover { background:#15803d; }
        .ab-modal-btn-confirm:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>
    </div>
  )
}
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

const STATUS_COLORS = {
  pending:   '#ca8a04',
  confirmed: '#2563eb',
  active:    '#16a34a',
  completed: '#64748b',
  cancelled: '#dc2626',
  no_show:   '#ea580c',
}

const PERIODS = [
  { key: '7d',  label: 'Last 7 days',   mode: 'day',   count: 7 },
  { key: '30d', label: 'Last 30 days',  mode: 'day',   count: 30 },
  { key: '6m',  label: 'Last 6 months', mode: 'month', count: 6 },
  { key: '12m', label: 'Last 12 months',mode: 'month', count: 12 },
]

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('7d')

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['admin-stats-bookings'],
    queryFn: () => api.get('/admin/bookings').then(r => r.data),
  })

  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['admin-stats-vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ['admin-stats-financial'],
    queryFn: () => api.get('/admin/reports/financial').then(r => r.data),
  })

  const isLoading = loadingBookings || loadingVehicles || loadingFinancial

  const bookings = bookingsData?.data ?? []
  const vehicles = vehiclesData?.data ?? []
  const financialReport = financialData?.report ?? []

  const activePeriod = PERIODS.find(p => p.key === period)

  const revenueSeries = useMemo(() => {
    if (financialReport.length === 0) return []

    if (activePeriod.mode === 'day') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - activePeriod.count)

      return [...financialReport]
        .filter(r => new Date(r.date) >= cutoff)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(r => ({
          key: r.date,
          label: new Date(r.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
          total: Number(r.total || 0),
          fees: Number(r.fees || 0),
          count: Number(r.count || 0),
        }))
    }

    const byMonth = {}
    financialReport.forEach(r => {
      const key = monthKey(r.date)
      if (!byMonth[key]) byMonth[key] = { key, total: 0, fees: 0, count: 0 }
      byMonth[key].total += Number(r.total || 0)
      byMonth[key].fees += Number(r.fees || 0)
      byMonth[key].count += Number(r.count || 0)
    })

    return Object.values(byMonth)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-activePeriod.count)
      .map(m => ({ ...m, label: monthLabel(m.key) }))
  }, [financialReport, activePeriod])

  const periodRevenue = revenueSeries.reduce((sum, r) => sum + r.total, 0)
  const periodFees = revenueSeries.reduce((sum, r) => sum + r.fees, 0)
  const periodPayments = revenueSeries.reduce((sum, r) => sum + r.count, 0)
  const maxSeriesValue = Math.max(1, ...revenueSeries.map(r => r.total))

  const periodBookings = useMemo(() => {
    const cutoffDays = activePeriod.mode === 'day' ? activePeriod.count : activePeriod.count * 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - cutoffDays)
    return bookings.filter(b => new Date(b.pickup_datetime) >= cutoff || new Date(b.created_at || b.pickup_datetime) >= cutoff)
  }, [bookings, activePeriod])

  const statusCounts = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'].reduce((acc, s) => {
    acc[s] = periodBookings.filter(b => b.status === s).length
    return acc
  }, {})
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts))

  const vehicleBookingCounts = {}
  periodBookings.forEach(b => {
    if (!b.vehicle) return
    const key = b.vehicle.id
    if (!vehicleBookingCounts[key]) {
      vehicleBookingCounts[key] = {
        name: `${b.vehicle.make} ${b.vehicle.model}`,
        plate: b.vehicle.plate_number,
        count: 0,
      }
    }
    vehicleBookingCounts[key].count += 1
  })
  const topVehicles = Object.values(vehicleBookingCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxVehicleCount = Math.max(1, ...topVehicles.map(v => v.count))

  const vehicleStatusCounts = ['available', 'rented', 'maintenance'].reduce((acc, s) => {
    acc[s] = vehicles.filter(v => v.status === s).length
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 className="as-title">Analytics</h1>
          <p className="as-sub">Overview of bookings, revenue, and fleet performance</p>
        </div>

        <div className="as-period-tabs">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={'as-period-btn ' + (period === p.key ? 'as-period-btn-on' : '')}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="as-card as-center">Loading statistics...</div>
      ) : (
        <>
          <div className="as-grid as-grid-4">
            <div className="as-card">
              <p className="as-stat-label">Revenue ({activePeriod.label.toLowerCase()})</p>
              <p className="as-stat-value">₱{periodRevenue.toLocaleString()}</p>
            </div>
            <div className="as-card">
              <p className="as-stat-label">Gateway fees</p>
              <p className="as-stat-value">₱{periodFees.toLocaleString()}</p>
            </div>
            <div className="as-card">
              <p className="as-stat-label">Payments</p>
              <p className="as-stat-value">{periodPayments}</p>
            </div>
            <div className="as-card">
              <p className="as-stat-label">Bookings</p>
              <p className="as-stat-value">{periodBookings.length}</p>
            </div>
          </div>

          <div className="as-grid as-grid-2" style={{ marginTop: 20 }}>
            <div className="as-card">
              <h2 className="as-section-title">Revenue — {activePeriod.label}</h2>
              {revenueSeries.length === 0 ? (
                <p className="as-empty">No payment data for this period.</p>
              ) : (
                <div className="as-bars">
                  {revenueSeries.map(row => (
                    <div key={row.key} className="as-bar-row">
                      <span className="as-bar-label">{row.label}</span>
                      <div className="as-bar-track">
                        <div
                          className="as-bar-fill"
                          style={{ width: `${(row.total / maxSeriesValue) * 100}%`, background: '#2563eb' }}
                        />
                      </div>
                      <span className="as-bar-value">₱{row.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="as-card">
              <h2 className="as-section-title">Booking status — {activePeriod.label}</h2>
              <div className="as-bars">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="as-bar-row">
                    <span className="as-bar-label as-bar-label-status">{status.replace('_', ' ')}</span>
                    <div className="as-bar-track">
                      <div
                        className="as-bar-fill"
                        style={{ width: `${(count / maxStatusCount) * 100}%`, background: STATUS_COLORS[status] || '#94a3b8' }}
                      />
                    </div>
                    <span className="as-bar-value">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="as-grid as-grid-2" style={{ marginTop: 20 }}>
            <div className="as-card">
              <h2 className="as-section-title">Most booked — {activePeriod.label}</h2>
              {topVehicles.length === 0 ? (
                <p className="as-empty">No bookings in this period.</p>
              ) : (
                <div className="as-bars">
                  {topVehicles.map(v => (
                    <div key={v.name + v.plate} className="as-bar-row">
                      <span className="as-bar-label" title={v.name}>{v.name}</span>
                      <div className="as-bar-track">
                        <div
                          className="as-bar-fill"
                          style={{ width: `${(v.count / maxVehicleCount) * 100}%`, background: '#16a34a' }}
                        />
                      </div>
                      <span className="as-bar-value">{v.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="as-card">
              <h2 className="as-section-title">Fleet status (current)</h2>
              <div className="as-fleet-grid">
                <div className="as-fleet-item">
                  <p className="as-fleet-count" style={{ color: '#16a34a' }}>{vehicleStatusCounts.available}</p>
                  <p className="as-fleet-label">Available</p>
                </div>
                <div className="as-fleet-item">
                  <p className="as-fleet-count" style={{ color: '#2563eb' }}>{vehicleStatusCounts.rented}</p>
                  <p className="as-fleet-label">Rented</p>
                </div>
                <div className="as-fleet-item">
                  <p className="as-fleet-count" style={{ color: '#ca8a04' }}>{vehicleStatusCounts.maintenance}</p>
                  <p className="as-fleet-label">Maintenance</p>
                </div>
                <div className="as-fleet-item">
                  <p className="as-fleet-count" style={{ color: '#0f172a' }}>{vehicles.length}</p>
                  <p className="as-fleet-label">Total fleet</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .as-title { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 2px; }
        .as-sub { font-size:13px; color:#64748b; }
        .as-period-tabs { display:flex; gap:6px; flex-wrap:wrap; }
        .as-period-btn { background:none; border:1.5px solid #e2e8f0; color:#64748b; padding:6px 14px; border-radius:20px; font-size:12px; cursor:pointer; font-family:inherit; transition:all .15s; }
        .as-period-btn:hover { border-color:#cbd5e1; }
        .as-period-btn-on { background:#0f172a; border-color:#0f172a; color:#fff; }
        .as-grid { display:grid; gap:16px; }
        .as-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .as-grid-2 { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 900px) {
          .as-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .as-grid-2 { grid-template-columns: 1fr; }
        }
        .as-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:20px; }
        .as-center { text-align:center; padding:40px; color:#64748b; font-size:14px; }
        .as-stat-label { font-size:12px; color:#64748b; margin:0 0 6px; }
        .as-stat-value { font-size:24px; font-weight:700; color:#0f172a; margin:0; }
        .as-section-title { font-size:15px; font-weight:600; color:#0f172a; margin:0 0 16px; }
        .as-empty { font-size:13px; color:#94a3b8; text-align:center; padding:20px 0; }
        .as-bars { display:flex; flex-direction:column; gap:10px; max-height:340px; overflow-y:auto; }
        .as-bar-row { display:grid; grid-template-columns: 90px 1fr 70px; align-items:center; gap:10px; }
        .as-bar-label { font-size:12px; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .as-bar-label-status { text-transform:capitalize; }
        .as-bar-track { background:#f1f5f9; border-radius:6px; height:10px; overflow:hidden; }
        .as-bar-fill { height:100%; border-radius:6px; transition: width .3s ease; }
        .as-bar-value { font-size:12px; font-weight:600; color:#0f172a; text-align:right; white-space:nowrap; }
        .as-fleet-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; }
        .as-fleet-item { text-align:center; padding:16px 0; background:#f8fafc; border-radius:10px; }
        .as-fleet-count { font-size:26px; font-weight:700; margin:0 0 4px; }
        .as-fleet-label { font-size:12px; color:#64748b; margin:0; }
      `}</style>
    </div>
  )
}
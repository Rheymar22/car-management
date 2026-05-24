import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LOCATIONS = [
  'Roxas City Airport (Roxas Airport)',
  'Pueblo de Panay Hotel',
  'Capitol Building, Roxas City',
  'Roxas Avenue',
  'Custom address',
]

function PriceSummary({ vehicle, start, end }) {
  if (!vehicle || !start || !end) return null
  const s = new Date(start), e = new Date(end)
  const hours = Math.max(1, Math.round((e - s) / 36e5))
  const days  = Math.max(1, Math.ceil(hours / 24))
  const weeks = Math.floor(days / 7)

  let base = 0
  if (weeks >= 1 && vehicle.weekly_rate) {
    base = (weeks * Number(vehicle.weekly_rate)) + ((days % 7) * Number(vehicle.daily_rate))
  } else {
    base = days * Number(vehicle.daily_rate)
  }
  const discount = days >= 7 ? base * 0.10 : days >= 3 ? base * 0.05 : 0
  const total = base - discount

  return (
    <div className="bn-price-box">
      <div className="bn-price-row"><span>Duration</span><span>{days} day{days !== 1 ? 's' : ''} ({hours} hrs)</span></div>
      <div className="bn-price-row"><span>Daily rate</span><span>₱{Number(vehicle.daily_rate).toLocaleString()}/day</span></div>
      <div className="bn-price-row"><span>Base amount</span><span>₱{base.toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
      {discount > 0 && (
        <div className="bn-price-row bn-discount">
          <span>Discount ({days >= 7 ? '10%' : '5%'} off)</span>
          <span>-₱{discount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
        </div>
      )}
      <div className="bn-price-total">
        <span>Total</span>
        <span>₱{total.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
      </div>
      <p className="bn-price-note">💡 {days >= 7 ? '10% weekly discount applied!' : days >= 3 ? '5% multi-day discount applied!' : 'Rent 3+ days to get 5% off, 7+ days for 10% off'}</p>
    </div>
  )
}

const getEmoji = type => type === 'suv' ? '🚙' : type === 'van' ? '🚐' : type === 'motorcycle' ? '🏍️' : '🚗'
const fmtDatetime = d => d ? new Date(d).toISOString().slice(0, 19).replace('T', ' ') : ''

export default function BookingNew() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const vehicleId = params.get('vehicle')
  const startParam = params.get('start') || ''
  const endParam   = params.get('end') || ''

  const [form, setForm] = useState({
    pickup_location:        LOCATIONS[0],
    dropoff_location:       LOCATIONS[0],
    custom_pickup_address:  '',
    custom_dropoff_address: '',
    rental_terms_accepted:  false,
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: vehicleData, isLoading: vLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => api.get('/vehicles/' + vehicleId).then(r => r.data.vehicle),
    enabled: !!vehicleId,
  })

  const mutation = useMutation({
    mutationFn: data => api.post('/bookings', data),
    onSuccess: ({ data }) => navigate('/payment/' + data.booking.id),
    onError: err => {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Booking failed. Please try again.' })
    },
  })

  const handleSubmit = e => {
    e.preventDefault()
    setErrors({})
    if (!vehicleId) return
    mutation.mutate({
      vehicle_id:             vehicleId,
      pickup_datetime:        fmtDatetime(startParam),
      dropoff_datetime:       fmtDatetime(endParam),
      pickup_location:        form.pickup_location,
      dropoff_location:       form.dropoff_location,
      custom_pickup_address:  form.custom_pickup_address,
      custom_dropoff_address: form.custom_dropoff_address,
      rental_terms_accepted:  form.rental_terms_accepted ? 1 : 0,
      notes:                  form.notes,
    })
  }

  if (!vehicleId) return (
    <div className="bn-empty">
      <div className="bn-empty-icon">🚗</div>
      <p>No vehicle selected.</p>
      <Link to="/vehicles" className="bn-link">Browse available vehicles →</Link>
    </div>
  )

  const vehicle = vehicleData

  return (
    <div className="bn-wrap">
      <div className="bn-breadcrumb">
        <Link to="/vehicles" className="bn-link">Vehicles</Link>
        <span className="bn-sep">›</span>
        <span>Confirm booking</span>
      </div>

      <h1 className="bn-title">Confirm your booking</h1>

      <div className="bn-grid">
        {/* Left — form */}
        <div className="bn-form-col">
          {vLoading ? (
            <div className="bn-card bn-loading">Loading vehicle details...</div>
          ) : vehicle ? (
            <div className="bn-card bn-vehicle-card">
              <div className="bn-vehicle-header">
                {/* Vehicle image */}
                <div className="bn-vehicle-img">
                  {vehicle.image_path ? (
                    <img
                      src={`${API_URL}/storage/${vehicle.image_path}`}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = getEmoji(vehicle.type) }}
                    />
                  ) : (
                    <span style={{ fontSize: '40px' }}>{getEmoji(vehicle.type)}</span>
                  )}
                </div>
                <div>
                  <div className="bn-vehicle-name">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                  <div className="bn-vehicle-meta">{vehicle.plate_number} • {vehicle.color} • {vehicle.type.toUpperCase()}</div>
                  {vehicle.features?.length > 0 && (
                    <div className="bn-tags">
                      {vehicle.features.map(f => <span key={f} className="bn-tag">{f}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="bn-dates-row">
                <div className="bn-date-block">
                  <div className="bn-date-label">📅 Pickup</div>
                  <div className="bn-date-val">{startParam ? new Date(startParam).toLocaleString('en-PH', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '—'}</div>
                </div>
                <div className="bn-date-arrow">→</div>
                <div className="bn-date-block">
                  <div className="bn-date-label">🔄 Return</div>
                  <div className="bn-date-val">{endParam ? new Date(endParam).toLocaleString('en-PH', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '—'}</div>
                </div>
              </div>
            </div>
          ) : null}

          <form className="bn-card" onSubmit={handleSubmit}>
            <h2 className="bn-form-title">Pickup & dropoff</h2>

            {errors.general && (
              <div className="bn-error-box">{errors.general}</div>
            )}

            <div className="bn-field">
              <label className="bn-label">Pickup location</label>
              <select className="bn-select" value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
              {form.pickup_location === 'Custom address' && (
                <textarea className="bn-input bn-mt" rows={2} placeholder="Enter full pickup address in Roxas City..."
                  value={form.custom_pickup_address} onChange={e => set('custom_pickup_address', e.target.value)} />
              )}
              {errors.pickup_location && <p className="bn-field-err">{errors.pickup_location[0]}</p>}
            </div>

            <div className="bn-field">
              <label className="bn-label">Dropoff location</label>
              <select className="bn-select" value={form.dropoff_location} onChange={e => set('dropoff_location', e.target.value)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
              {form.dropoff_location === 'Custom address' && (
                <textarea className="bn-input bn-mt" rows={2} placeholder="Enter full dropoff address in Roxas City..."
                  value={form.custom_dropoff_address} onChange={e => set('custom_dropoff_address', e.target.value)} />
              )}
            </div>

            <div className="bn-field">
              <label className="bn-label">Special notes <span className="bn-optional">(optional)</span></label>
              <textarea className="bn-input" rows={2} placeholder="Any special requests or instructions..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div className="bn-terms">
              <label className="bn-terms-label">
                <input type="checkbox" className="bn-checkbox"
                  checked={form.rental_terms_accepted}
                  onChange={e => set('rental_terms_accepted', e.target.checked)} />
                <span>I have read and agree to the <a href="#" className="bn-link">Rental Agreement Terms and Conditions</a>. I understand the late return policy (₱500/hour after 30-min grace period) and vehicle damage liability.</span>
              </label>
              {errors.rental_terms_accepted && <p className="bn-field-err">{errors.rental_terms_accepted[0]}</p>}
            </div>

            <button type="submit"
              disabled={mutation.isPending || !form.rental_terms_accepted}
              className="bn-submit-btn">
              {mutation.isPending ? '⏳ Confirming...' : '✅ Confirm booking & proceed to payment'}
            </button>

            <p className="bn-secure-note">🔒 Your booking is secured and can be cancelled before the pickup date.</p>
          </form>
        </div>

        {/* Right — summary */}
        <div className="bn-summary-col">
          <div className="bn-card">
            <h2 className="bn-form-title">Price summary</h2>
            {vehicle
              ? <PriceSummary vehicle={vehicle} start={startParam} end={endParam} />
              : <p className="bn-muted">Loading pricing...</p>
            }
          </div>

          <div className="bn-card bn-info-card">
            <div className="bn-info-title">✅ What's included</div>
            <ul className="bn-info-list">
              <li>Comprehensive insurance coverage</li>
              <li>24/7 roadside assistance</li>
              <li>Unlimited mileage within Capiz</li>
              <li>PDF invoice upon completion</li>
            </ul>
          </div>

          <div className="bn-card bn-policy-card">
            <div className="bn-info-title">📋 Cancellation policy</div>
            <ul className="bn-info-list">
              <li>Free cancellation 24h before pickup</li>
              <li>50% refund within 24h of pickup</li>
              <li>No refund for no-shows</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .bn-wrap { max-width: 960px; margin: 0 auto; }
        .bn-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 16px; }
        .bn-sep { color: #cbd5e1; }
        .bn-link { color: #dc2626; text-decoration: none; }
        .bn-link:hover { text-decoration: underline; }
        .bn-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 24px; }
        .bn-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
        .bn-form-col { display: flex; flex-direction: column; gap: 16px; }
        .bn-summary-col { display: flex; flex-direction: column; gap: 16px; }
        .bn-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; }
        .bn-loading { color: #64748b; font-size: 14px; text-align: center; padding: 32px; }
        .bn-vehicle-card { }
        .bn-vehicle-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
        .bn-vehicle-img { width: 80px; height: 64px; border-radius: 10px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bn-vehicle-name { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .bn-vehicle-meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }
        .bn-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .bn-tag { background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
        .bn-dates-row { display: flex; align-items: center; gap: 12px; background: #f8fafc; border-radius: 10px; padding: 12px 14px; }
        .bn-date-block { flex: 1; }
        .bn-date-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 3px; }
        .bn-date-val { font-size: 13px; font-weight: 600; color: #0f172a; }
        .bn-date-arrow { font-size: 18px; color: #cbd5e1; }
        .bn-form-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }
        .bn-field { margin-bottom: 16px; }
        .bn-label { display: block; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .bn-optional { font-weight: 400; text-transform: none; color: #94a3b8; }
        .bn-select, .bn-input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #0f172a; background: #fff; outline: none; transition: border-color .15s; font-family: inherit; resize: none; }
        .bn-select:focus, .bn-input:focus { border-color: #dc2626; }
        .bn-mt { margin-top: 8px; }
        .bn-field-err { font-size: 12px; color: #dc2626; margin-top: 4px; }
        .bn-error-box { background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-size: 13px; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
        .bn-terms { background: #f8fafc; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
        .bn-terms-label { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 13px; color: #475569; line-height: 1.6; }
        .bn-checkbox { margin-top: 2px; accent-color: #dc2626; flex-shrink: 0; }
        .bn-submit-btn { width: 100%; background: #dc2626; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .15s; font-family: inherit; }
        .bn-submit-btn:hover:not(:disabled) { background: #b91c1c; }
        .bn-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .bn-secure-note { text-align: center; font-size: 12px; color: #94a3b8; margin: 10px 0 0; }
        .bn-price-box { }
        .bn-price-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 5px 0; border-bottom: 1px dashed #f1f5f9; }
        .bn-discount { color: #16a34a; }
        .bn-price-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #0f172a; padding: 12px 0 8px; }
        .bn-price-note { font-size: 12px; color: #64748b; background: #f0fdf4; border-radius: 6px; padding: 6px 10px; margin-top: 8px; }
        .bn-info-card { background: #f0fdf4; border-color: #bbf7d0; }
        .bn-policy-card { background: #fefce8; border-color: #fef08a; }
        .bn-info-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        .bn-info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
        .bn-info-list li { font-size: 13px; color: #475569; padding-left: 16px; position: relative; }
        .bn-info-list li::before { content: '•'; position: absolute; left: 0; color: #94a3b8; }
        .bn-muted { font-size: 13px; color: #94a3b8; }
        .bn-empty { text-align: center; padding: 60px 20px; }
        .bn-empty-icon { font-size: 48px; margin-bottom: 12px; }
        @media (max-width: 700px) {
          .bn-grid { grid-template-columns: 1fr; }
          .bn-summary-col { order: -1; }
        }
      `}</style>
    </div>
  )
}
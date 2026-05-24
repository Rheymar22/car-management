import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'

const LOCATIONS = [
  'Roxas City Airport (Roxas Airport)',
  'Pueblo de Panay Hotel',
  'Capitol Building, Roxas City',
  'Roxas Avenue',
  'Custom address',
]

export default function BookingForm({ vehicle, start, end, pricing }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    vehicle_id:            vehicle.id,
    pickup_datetime:       start,
    dropoff_datetime:      end,
    pickup_location:       LOCATIONS[0],
    dropoff_location:      LOCATIONS[0],
    custom_pickup_address: '',
    custom_dropoff_address:'',
    rental_terms_accepted: false,
    notes:                 '',
  })
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: data => api.post('/bookings', data),
    onSuccess: ({ data }) => navigate('/payment/' + data.booking.id),
    onError: (err) => {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Booking failed.' })
    },
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    mutation.mutate({ ...form, rental_terms_accepted: form.rental_terms_accepted ? 1 : 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Pickup location</label>
          <select className="input" value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          {form.pickup_location === 'Custom address' && (
            <textarea className="input mt-2" placeholder="Enter full pickup address..."
              value={form.custom_pickup_address} onChange={e => set('custom_pickup_address', e.target.value)} rows={2} />
          )}
        </div>
        <div>
          <label className="label">Dropoff location</label>
          <select className="input" value={form.dropoff_location} onChange={e => set('dropoff_location', e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          {form.dropoff_location === 'Custom address' && (
            <textarea className="input mt-2" placeholder="Enter full dropoff address..."
              value={form.custom_dropoff_address} onChange={e => set('custom_dropoff_address', e.target.value)} rows={2} />
          )}
        </div>
      </div>

      {pricing && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Base amount</span>
            <span>₱{Number(pricing.base).toLocaleString()}</span>
          </div>
          {pricing.discount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600">Discount</span>
              <span className="text-green-600">-₱{Number(pricing.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t border-blue-200 pt-2 mt-2">
            <span>Total</span>
            <span className="text-blue-700">₱{Number(pricing.total).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label className="label">Special notes (optional)</label>
        <textarea className="input" rows={2} placeholder="Any special requests..."
          value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input type="checkbox" className="mt-0.5 rounded"
          checked={form.rental_terms_accepted}
          onChange={e => set('rental_terms_accepted', e.target.checked)} />
        <span className="text-sm text-gray-700">
          I have read and agree to the <a href="#" className="text-blue-600 underline font-medium">Rental Agreement Terms and Conditions</a>.
          I understand the late return policy and damage liability.
        </span>
      </label>
      {errors.rental_terms_accepted && <p className="error">{errors.rental_terms_accepted[0]}</p>}

      <button type="submit"
        disabled={mutation.isPending || !form.rental_terms_accepted}
        className="btn-primary w-full text-center py-3 text-base">
        {mutation.isPending ? 'Confirming booking...' : 'Confirm booking'}
      </button>
    </form>
  )
}
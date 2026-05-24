import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

const METHODS = [
  { id: 'gcash',   label: 'GCash', img: '/gcash.jpg',   type: 'source' },
  { id: 'paymaya', label: 'Maya',  img: '/paymaya.jpg', type: 'source' },
  { id: 'card',    label: 'Card',  img: '/debit.jpg',   type: 'intent' },
]

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate      = useNavigate()
  const qc            = useQueryClient()
  const [method, setMethod] = useState('gcash')
  const [error,  setError]  = useState('')
  const [success, setSuccess] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get('/bookings/' + bookingId).then(r => r.data.booking),
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/payments/simulate', {
        booking_id: bookingId,
        method: method,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries(['my-bookings'])
      setSuccess(true)
      setTimeout(() => navigate('/bookings'), 2000)
    },
    onError: (err) => setError(err.response?.data?.message || 'Payment failed. Please try again.'),
  })

  if (isLoading) return <p className="text-center text-gray-400 py-16">Loading booking details...</p>

  const booking = data

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment successful!</h2>
      <p className="text-gray-500 text-sm">Redirecting to your bookings...</p>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Complete payment</h1>

      <div className="card mb-4">
        <div className="text-sm text-gray-500 mb-1 font-mono">{booking?.booking_ref}</div>
        <div className="font-medium text-gray-900 mb-1">
          {booking?.vehicle?.make} {booking?.vehicle?.model}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {booking && new Date(booking.pickup_datetime).toLocaleDateString('en-PH', {month:'long',day:'numeric'})}
          {' — '}
          {booking && new Date(booking.dropoff_datetime).toLocaleDateString('en-PH', {month:'long',day:'numeric',year:'numeric'})}
        </div>
        <div className="text-2xl font-bold text-blue-700">
          ₱{booking ? Number(booking.total_amount).toLocaleString() : '—'}
        </div>
      </div>

      <div className="card mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Choose payment method</p>
        <div className="space-y-2">
          {METHODS.map(m => (
            <label key={m.id} className={"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors " +
              (method === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50')}>
              <input type="radio" name="method" value={m.id}
                checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-blue-600" />
              <img src={m.img} alt={m.label} className="w-8 h-8 object-contain rounded" />
              <span className="text-sm font-medium text-gray-800">{m.label}</span>
              <span className="ml-auto text-xs text-gray-400">
                {m.type === 'source' ? 'Redirect to pay' : 'Enter card details'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        className="btn-primary w-full py-3 text-base text-center">
        {mutation.isPending ? 'Processing...' : 'Pay ₱' + (booking ? Number(booking.total_amount).toLocaleString() : '—')}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Secured by PayMongo • Philippine payment gateway
      </p>
    </div>
  )
}
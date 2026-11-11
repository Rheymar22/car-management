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
  const [paymentType, setPaymentType] = useState('full')
  const [method, setMethod] = useState('gcash')
  const [error,  setError]  = useState('')
  const [success, setSuccess] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get('/bookings/' + bookingId).then(r => r.data.booking),
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/simulate', {
        booking_id: bookingId,
        payment_type: paymentType,
        method: method,
      })
      return res.data
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      setSuccess(result)
      setTimeout(() => navigate('/bookings'), 2500)
    },
    onError: (err) => setError(err.response?.data?.message || 'Payment failed. Please try again.'),
  })

  if (isLoading) return <p className="text-center text-gray-400 py-16">Loading booking details...</p>

  const booking = data
  const total = booking ? Number(booking.total_amount) : 0
  const downPaymentAmount = total * 0.5
  const payNowAmount = paymentType === 'down_payment' ? downPaymentAmount : total
  const balanceAfter = total - payNowAmount

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {success.balance_due > 0 ? 'Down payment successful!' : 'Payment successful!'}
      </h2>
      <p className="text-gray-500 text-sm mb-1">
        ₱{Number(success.amount_paid).toLocaleString()} paid
      </p>
      {success.balance_due > 0 && (
        <p className="text-amber-600 text-sm font-medium">
          ₱{Number(success.balance_due).toLocaleString()} balance due at pickup/return
        </p>
      )}
      <p className="text-gray-400 text-xs mt-4">Redirecting to your bookings...</p>
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
          ₱{total.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">Total booking amount</div>
      </div>

      <div className="card mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">How much would you like to pay now?</p>
        <div className="space-y-2">
          <label className={"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors " +
            (paymentType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50')}>
            <input type="radio" name="paymentType" value="full"
              checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="accent-blue-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800">Pay in full</span>
              <p className="text-xs text-gray-400">No balance due later</p>
            </div>
            <span className="text-sm font-bold text-gray-900">₱{total.toLocaleString()}</span>
          </label>

          <label className={"flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors " +
            (paymentType === 'down_payment' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50')}>
            <input type="radio" name="paymentType" value="down_payment"
              checked={paymentType === 'down_payment'} onChange={() => setPaymentType('down_payment')} className="accent-blue-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800">50% down payment</span>
              <p className="text-xs text-gray-400">
                Balance of ₱{downPaymentAmount.toLocaleString()} due at pickup/return
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900">₱{downPaymentAmount.toLocaleString()}</span>
          </label>
        </div>

        {paymentType === 'down_payment' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            You'll pay <strong>₱{downPaymentAmount.toLocaleString()}</strong> now, and the remaining{' '}
            <strong>₱{balanceAfter.toLocaleString()}</strong> will be collected at pickup or return.
          </div>
        )}
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
        {mutation.isPending ? 'Processing...' : 'Pay ₱' + payNowAmount.toLocaleString()}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Secured by PayMongo • Philippine payment gateway
      </p>
    </div>
  )
}
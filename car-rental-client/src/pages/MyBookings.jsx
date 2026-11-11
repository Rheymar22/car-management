import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  no_show:   'bg-orange-100 text-orange-700',
}

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'active']

export default function MyBookings() {
  const queryClient = useQueryClient()
  const [cancellingId, setCancellingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings').then(r => r.data),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),
    onMutate: (bookingId) => {
      setCancellingId(bookingId)
      setErrorMessage(null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel booking. Please try again.')
    },
    onSettled: () => {
      setCancellingId(null)
    },
  })

  const handleCancel = (booking) => {
    const pickupDate = new Date(booking.pickup_datetime)
    const hoursUntilPickup = (pickupDate - new Date()) / (1000 * 60 * 60)
    const isLate = hoursUntilPickup < 24
    const isActive = booking.status === 'active'

    let warning = `Cancel your booking for "${booking.vehicle?.make} ${booking.vehicle?.model}" (${booking.booking_ref})?`
    if (isActive) {
      warning = `This rental is already active and paid. Cancelling now will affect your reliability score, and any refund will need to be handled separately.\n\nCancel "${booking.vehicle?.make} ${booking.vehicle?.model}" (${booking.booking_ref})?`
    } else if (isLate) {
      warning = `This pickup is less than 24 hours away. Cancelling now may affect your reliability score.\n\nCancel "${booking.vehicle?.make} ${booking.vehicle?.model}" (${booking.booking_ref})?`
    }

    if (window.confirm(warning)) {
      cancelMutation.mutate(booking.id)
    }
  }

  if (isLoading) return <p className="text-gray-400 text-sm text-center py-16">Loading your bookings...</p>

  const bookings = data?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My bookings</h1>
        <Link to="/vehicles" className="btn-primary text-sm">+ New booking</Link>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p>No bookings yet.</p>
          <Link to="/vehicles" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Browse available vehicles</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                {booking.vehicle?.image_path ? (
                  <img
                    src={`${API_URL}/storage/${booking.vehicle.image_path}`}
                    alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🚗' }}
                  />
                ) : '🚗'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {booking.vehicle?.make} {booking.vehicle?.model}
                  </span>
                  <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600')}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono">{booking.booking_ref}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(booking.pickup_datetime).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'})}
                  {' → '}
                  {new Date(booking.dropoff_datetime).toLocaleDateString('en-PH', {month:'short',day:'numeric',year:'numeric'})}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  ₱{Number(booking.total_amount).toLocaleString()}
                </span>
                {booking.status === 'confirmed' && (
                  <Link to={'/payment/' + booking.id} className="btn-primary text-xs px-3 py-1.5">
                    Pay now
                  </Link>
                )}
                <a href={'/api/v1/bookings/' + booking.id + '/invoice'}
                  target="_blank" rel="noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5">
                  Invoice
                </a>
                {CANCELLABLE_STATUSES.includes(booking.status) && (
                  <button
                    onClick={() => handleCancel(booking)}
                    disabled={cancellingId === booking.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
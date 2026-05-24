import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

function StatCard({ label, value, color }) {
  return (
    <div className={"rounded-2xl p-5 " + (color || 'bg-white border border-gray-200')}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

export default function AdminDashboard() {
  const { data: bookingsData } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.get('/admin/bookings').then(r => r.data),
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  const bookings = bookingsData?.data ?? []
  const vehicles = vehiclesData?.data ?? []

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  const activeCount    = bookings.filter(b => b.status === 'active').length
  const availableCount = vehicles.filter(v => v.status === 'available').length
  const rentedCount    = vehicles.filter(v => v.status === 'rented').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <span className="text-sm text-gray-400">Roxas City Car Rental</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total revenue" value={'₱' + totalRevenue.toLocaleString()} />
        <StatCard label="Active rentals" value={activeCount} />
        <StatCard label="Available vehicles" value={availableCount} />
        <StatCard label="Rented vehicles" value={rentedCount} />
      </div>

      <div className="card">
        <h2 className="text-base font-medium text-gray-900 mb-4">Recent bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{tableLayout:'fixed'}}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Ref</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Vehicle</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Status</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 15).map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-xs text-gray-600">{b.booking_ref}</td>
                    <td className="py-2 px-3 text-gray-800 truncate">{b.user?.name}</td>
                    <td className="py-2 px-3 text-gray-600 truncate">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </td>
                    <td className="py-2 px-3">
                      <span className={"text-xs px-2 py-0.5 rounded-full " + (STATUS_COLORS[b.status]||'bg-gray-100 text-gray-600')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      ₱{Number(b.total_amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
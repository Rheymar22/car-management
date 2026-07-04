import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VehicleSearch from './pages/VehicleSearch'
import MyBookings from './pages/MyBookings'
import PaymentPage from './pages/PaymentPage'
import BookingNew from './pages/BookingNew'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminVehicles from './pages/Admin/AdminVehicles'
import AdminBookings from './pages/Admin/AdminBookings'
import AdminCustomers from './pages/Admin/AdminCustomers'
import AdminLogs from './pages/Admin/AdminLogs'
import AdminUsers from './pages/Admin/AdminUsers'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/vehicles" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Home />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected app routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/vehicles"           element={<VehicleSearch />} />
        <Route path="/bookings"           element={<MyBookings />} />
        <Route path="/bookings/new"       element={<BookingNew />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />

        {/* Admin routes */}
        <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/vehicles"  element={<AdminRoute><AdminVehicles /></AdminRoute>} />
        <Route path="/admin/bookings"  element={<AdminRoute><AdminBookings /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
        <Route path="/admin/logs"      element={<AdminRoute><AdminLogs /></AdminRoute>} />
        <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
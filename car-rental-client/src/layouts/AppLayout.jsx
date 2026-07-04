import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'

const ADMIN_NAV = [
  { to: '/admin',           label: 'Dashboard',     icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { to: '/admin/bookings',  label: 'Bookings',      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { to: '/admin/vehicles',  label: 'Vehicles',      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10l1.5-4a2 2 0 011.9-1.3h5.2a2 2 0 011.9 1.3L14 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="1" y="10" width="14" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="11.5" cy="12" r="1" fill="currentColor"/></svg> },
  { to: '/admin/customers', label: 'Customers',     icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M12 7c1.1 0 2 .9 2 2s-.9 2-2 2M14 14c0-1.5-1-2.5-2-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { to: '/admin/users',     label: 'Users',         icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 14c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { to: '/admin/logs',      label: 'Activity Logs', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
]

const CUSTOMER_NAV = [
  { to: '/vehicles', label: 'Browse vehicles', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10l1.5-4a2 2 0 011.9-1.3h5.2a2 2 0 011.9 1.3L14 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="1" y="10" width="14" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="11.5" cy="12" r="1" fill="currentColor"/></svg> },
  { to: '/bookings',  label: 'My bookings',    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
]

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const nav = isAdmin() ? ADMIN_NAV : CUSTOMER_NAV

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (to) => {
    if (to === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(to)
  }

  return (
    <div className="al-root">
      {/* Top navigation bar */}
      <nav className="al-nav">
        <div className="al-nav-inner">

          {/* Logo */}
          <Link to={isAdmin() ? '/admin' : '/vehicles'} className="al-logo">
            <img src="/MRPAT pfp.jpg" alt="Roxas Car Rental" className="al-logo-img"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
            <div className="al-logo-fallback" style={{display:'none'}}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M4 18L6.5 11C6.9 9.8 8 9 9.3 9H18.7C20 9 21.1 9.8 21.5 11L24 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <rect x="3" y="18" width="22" height="6" rx="2" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
                <circle cx="8" cy="21" r="2" fill="white"/>
                <circle cx="20" cy="21" r="2" fill="white"/>
              </svg>
            </div>
            <div className="al-logo-text">
              <div className="al-logo-name">MR.PAT</div>
              <div className="al-logo-role">{isAdmin() ? 'Admin panel' : 'Customer portal'}</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="al-nav-links">
            {nav.map(n => (
              <Link key={n.to} to={n.to}
                className={'al-nav-link ' + (isActive(n.to) ? 'al-nav-link-active' : '')}>
                <span className="al-nav-icon">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="al-nav-right">
            <div className="al-user-info">
              <div className="al-avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
              <div className="al-user-text">
                <div className="al-user-name">{user?.name}</div>
                <div className="al-user-role">{user?.role}</div>
              </div>
            </div>
            <button className="al-logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 13H2a1 1 0 01-1-1V2a1 1 0 011-1h3M10 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="al-bottom-nav">
        {nav.map(n => (
          <Link key={n.to} to={n.to}
            className={'al-bottom-link ' + (isActive(n.to) ? 'al-bottom-link-active' : '')}>
            <span className="al-bottom-icon">{n.icon}</span>
            <span className="al-bottom-label">{n.label}</span>
          </Link>
        ))}
        <button className="al-bottom-link" onClick={handleLogout}>
          <span className="al-bottom-icon">
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <path d="M5 13H2a1 1 0 01-1-1V2a1 1 0 011-1h3M10 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="al-bottom-label">Sign out</span>
        </button>
      </nav>

      {/* Main content */}
      <main className="al-main">
        <div className="al-content">
          <Outlet />
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .al-root { min-height:100vh; background:#f8fafc; display:flex; flex-direction:column; font-family:'DM Sans',sans-serif; }
        .al-nav { background:#fff; border-bottom:1.5px solid #e2e8f0; position:sticky; top:0; z-index:50; }
        .al-nav-inner { max-width:1200px; margin:0 auto; padding:0 20px; height:62px; display:flex; align-items:center; gap:16px; }
        .al-logo { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; }
        .al-logo-img { width:38px; height:38px; border-radius:10px; object-fit:cover; }
        .al-logo-fallback { width:38px; height:38px; border-radius:10px; background:#dc2626; align-items:center; justify-content:center; flex-shrink:0; }
        .al-logo-name { font-size:14px; font-weight:700; color:#0f172a; line-height:1.2; }
        .al-logo-role { font-size:10px; color:#64748b; font-weight:500; }
        .al-nav-links { display:flex; gap:2px; flex:1; }
        .al-nav-link { display:flex; align-items:center; gap:7px; text-decoration:none; font-size:13px; font-weight:500; color:#64748b; padding:7px 13px; border-radius:8px; transition:all .15s; white-space:nowrap; }
        .al-nav-link:hover { background:#f1f5f9; color:#0f172a; }
        .al-nav-link-active { background:#fee2e2; color:#dc2626; font-weight:600; }
        .al-nav-icon { display:flex; align-items:center; }
        .al-nav-right { display:flex; align-items:center; gap:12px; margin-left:auto; }
        .al-user-info { display:flex; align-items:center; gap:8px; }
        .al-avatar { width:34px; height:34px; border-radius:50%; background:#fee2e2; color:#dc2626; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .al-user-text { display:none; }
        .al-user-name { font-size:13px; font-weight:600; color:#0f172a; }
        .al-user-role { font-size:10px; color:#64748b; text-transform:capitalize; }
        .al-logout-btn { background:none; border:1.5px solid #e2e8f0; color:#64748b; padding:7px 13px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
        .al-logout-btn:hover { border-color:#fca5a5; color:#dc2626; }
        .al-main { flex:1; padding-bottom:80px; }
        .al-content { max-width:1200px; margin:0 auto; padding:24px 20px; }
        .al-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1.5px solid #e2e8f0; z-index:50; padding:6px 0 max(6px,env(safe-area-inset-bottom)); }
        .al-bottom-link { display:flex; flex-direction:column; align-items:center; gap:2px; flex:1; text-decoration:none; border:none; background:none; cursor:pointer; font-family:'DM Sans',sans-serif; padding:4px 0; }
        .al-bottom-icon { display:flex; align-items:center; justify-content:center; color:#64748b; }
        .al-bottom-label { font-size:10px; color:#64748b; font-weight:500; }
        .al-bottom-link-active .al-bottom-icon { color:#dc2626; }
        .al-bottom-link-active .al-bottom-label { color:#dc2626; font-weight:700; }
        @media (min-width:640px) { .al-user-text { display:block; } }
        @media (max-width:640px) {
          .al-nav-links { display:none; }
          .al-bottom-nav { display:flex; }
          .al-main { padding-bottom:72px; }
        }
      `}</style>
    </div>
  )
}
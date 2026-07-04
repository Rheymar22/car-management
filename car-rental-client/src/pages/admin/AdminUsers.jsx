import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'customer' }

const ROLE_META = {
  admin:    { color: '#7c3aed', bg: '#ede9fe', label: 'Admin' },
  customer: { color: '#2563eb', bg: '#dbeafe', label: 'Customer' },
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [showForm, setShowForm]       = useState(false)
  const [editUser, setEditUser]       = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [errors, setErrors]           = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch]           = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  })

  const resetForm = () => {
    setForm(EMPTY_FORM); setErrors({})
    setEditUser(null); setShowForm(false)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setErrors({}); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); resetForm() },
    onError: err => setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Failed to save.'] }),
  })

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/admin/users/${editUser.id}`, form),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); resetForm() },
    onError: err => setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Failed to update.'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete('/admin/users/' + id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setDeleteConfirm(null) },
    onError: err => alert(err.response?.data?.message || 'Failed to delete.'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const allUsers  = data?.data ?? []
  const users     = allUsers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>User Management</h1>
          <p style={s.sub}>{allUsers.length} registered users</p>
        </div>
        {!showForm && (
          <button style={s.btnPrimary} onClick={() => { resetForm(); setShowForm(true) }}>
            + Add user
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h2 style={s.formTitle}>{editUser ? 'Edit User' : 'Add New User'}</h2>
            <button style={s.closeBtn} onClick={resetForm}>✕</button>
          </div>

          {errors.general && (
            <div style={s.errorBox}>{errors.general[0]}</div>
          )}

          <div style={s.formGrid}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="Juan dela Cruz" value={form.name}
                onChange={e => set('name', e.target.value)} />
              {errors.name && <p style={s.fieldErr}>{errors.name[0]}</p>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" placeholder="juan@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
              {errors.email && <p style={s.fieldErr}>{errors.email[0]}</p>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>
                Password {editUser && <span style={s.optTag}>leave blank to keep current</span>}
              </label>
              <input style={s.input} type="password" placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} />
              {errors.password && <p style={s.fieldErr}>{errors.password[0]}</p>}
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Role</label>
              <select style={s.input} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p style={s.fieldErr}>{errors.role[0]}</p>}
            </div>
          </div>

          <div style={s.formFooter}>
            <button style={s.btnGhost} onClick={resetForm}>Cancel</button>
            <button style={{ ...s.btnPrimary, opacity: isPending ? 0.6 : 1 }}
              onClick={() => { setErrors({}); editUser ? updateMutation.mutate() : createMutation.mutate() }}
              disabled={isPending}>
              {isPending ? 'Saving...' : editUser ? 'Save changes' : 'Add user'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Delete User</h3>
            <p style={s.modalSub}>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div style={s.modalBtns}>
              <button style={s.btnGhost} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...s.btnDanger, opacity: deleteMutation.isPending ? 0.6 : 1 }}
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!showForm && allUsers.length > 0 && (
        <div style={s.searchWrap}>
          <input style={s.searchInput} placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <span style={s.searchCount}>{users.length} result{users.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div style={s.emptyCard}>⏳ Loading users...</div>
      ) : allUsers.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>👤</div>
          <p>No users yet.</p>
        </div>
      ) : (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const meta = ROLE_META[u.role] || ROLE_META.customer
                return (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={s.td}>
                      <div style={s.userCell}>
                        <div style={s.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                        <span style={s.userName}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: '#64748b', fontSize: '13px' }}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </td>
                    <td style={{ ...s.td, fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.btnEdit} onClick={() => openEdit(u)}>Edit</button>
                        <button style={s.btnDelete} onClick={() => setDeleteConfirm(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s = {
  page:       { fontFamily: "'DM Sans', sans-serif", color: '#0f172a', paddingBottom: '40px' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  title:      { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  sub:        { fontSize: '13px', color: '#64748b', margin: 0 },
  btnPrimary: { background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost:   { background: 'none', border: '1.5px solid #e2e8f0', color: '#475569', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:  { background: '#dc2626', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },

  formCard:   { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' },
  formTitle:  { fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 },
  closeBtn:   { background: 'none', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px' },
  errorBox:   { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', margin: '16px 24px 0', fontSize: '13px', color: '#b91c1c' },
  formGrid:   { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '20px 24px' },
  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #f1f5f9' },
  fieldWrap:  { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:      { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  optTag:     { fontWeight: '400', textTransform: 'none', color: '#94a3b8', fontSize: '10px' },
  input:      { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '9px 11px', fontSize: '13px', color: '#0f172a', fontFamily: 'inherit', background: '#fff' },
  fieldErr:   { fontSize: '11px', color: '#dc2626', margin: '2px 0 0' },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal:      { background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' },
  modalSub:   { fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 },
  modalBtns:  { display: 'flex', gap: '10px', justifyContent: 'flex-end' },

  searchWrap:   { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  searchInput:  { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', minWidth: '260px' },
  searchCount:  { fontSize: '13px', color: '#94a3b8' },

  tableCard:  { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' },
  td:         { padding: '12px 16px', fontSize: '13px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  userCell:   { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:     { width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userName:   { fontWeight: '600' },
  badge:      { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  actions:    { display: 'flex', gap: '6px' },
  btnEdit:    { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnDelete:  { background: '#fff5f5', border: '1.5px solid #fecaca', color: '#dc2626', padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  emptyCard:  { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
}
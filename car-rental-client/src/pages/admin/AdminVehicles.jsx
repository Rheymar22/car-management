import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const TYPES = ['sedan', 'suv', 'van', 'sports car', 'truck', 'pickup', 'minivan']

const STATUS_META = {
  available:   { color: '#059669', bg: '#d1fae5', label: 'Available' },
  rented:      { color: '#2563eb', bg: '#dbeafe', label: 'Rented' },
  maintenance: { color: '#d97706', bg: '#fef3c7', label: 'Maintenance' },
  retired:     { color: '#64748b', bg: '#f1f5f9', label: 'Retired' },
}

const EMPTY_FORM = {
  plate_number: '', make: '', model: '',
  year: new Date().getFullYear(), color: '',
  type: 'sedan', daily_rate: '', hourly_rate: '',
  weekly_rate: '', features: '',
}

const TYPE_EMOJI = { suv: '🚙', van: '🚐', truck: '🚛' }
const getEmoji = t => TYPE_EMOJI[t] || '🚗'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminVehicles() {
  const qc = useQueryClient()
  const fileInputRef = useRef(null)

  const [showForm, setShowForm]         = useState(false)
  const [editVehicle, setEditVehicle]   = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors]             = useState({})
  const [statusModal, setStatusModal]   = useState(null)
  const [dragOver, setDragOver]         = useState(false)
  const [filterType, setFilterType]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles-list'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  const resetForm = () => {
    setForm(EMPTY_FORM); setImageFile(null); setImagePreview(null)
    setErrors({}); setEditVehicle(null); setShowForm(false)
  }

  const openEdit = (v) => {
    setEditVehicle(v)
    setForm({
      plate_number: v.plate_number, make: v.make, model: v.model,
      year: v.year, color: v.color, type: v.type,
      daily_rate: v.daily_rate, hourly_rate: v.hourly_rate || '',
      weekly_rate: v.weekly_rate || '', features: (v.features || []).join(', '),
    })
    setImageFile(null)
    setImagePreview(v.image_path ? `${API_URL}/storage/${v.image_path}` : null)
    setErrors({}); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleImageChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(e => ({ ...e, image: ['Please select a valid image file.'] })); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(e => ({ ...e, image: ['Image must be smaller than 2MB.'] })); return
    }
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
    setErrors(e => { const n = { ...e }; delete n.image; return n })
  }

  const buildFormData = () => {
    const fd = new FormData()
    Object.entries({ plate_number: form.plate_number, make: form.make, model: form.model,
      year: form.year, color: form.color, type: form.type, daily_rate: form.daily_rate }).forEach(([k,v]) => fd.append(k, v))
    if (form.hourly_rate) fd.append('hourly_rate', form.hourly_rate)
    if (form.weekly_rate) fd.append('weekly_rate', form.weekly_rate)
    const feats = form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : []
    feats.forEach((f, i) => fd.append(`features[${i}]`, f))
    if (imageFile) fd.append('image', imageFile)
    return fd
  }

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/vehicles', buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles-list']); resetForm() },
    onError: err => setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Failed to save.'] }),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = buildFormData(); fd.append('_method', 'PUT')
      return api.post(`/admin/vehicles/${editVehicle.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles-list']); resetForm() },
    onError: err => setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Failed to update.'] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/vehicles/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles-list']); setStatusModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete('/admin/vehicles/' + id),
    onSuccess: () => qc.invalidateQueries(['admin-vehicles-list']),
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const allVehicles = data?.data ?? []
  const vehicles = allVehicles.filter(v =>
    (!filterType || v.type === filterType) &&
    (!filterStatus || v.status === filterStatus)
  )

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Vehicle Fleet</h1>
          <p style={s.pageSub}>{allVehicles.length} vehicles · {allVehicles.filter(v=>v.status==='available').length} available</p>
        </div>
        {!showForm && (
          <button style={s.btnPrimary} onClick={() => { resetForm(); setShowForm(true) }}>
            <span>+</span> Add vehicle
          </button>
        )}
      </div>

      {/* ── FILTERS ── */}
      {!showForm && allVehicles.length > 0 && (
        <div style={s.filters}>
          <select style={s.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
          <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filterType || filterStatus) && (
            <button style={s.clearFilter} onClick={() => { setFilterType(''); setFilterStatus('') }}>✕ Clear</button>
          )}
          <span style={s.filterCount}>{vehicles.length} result{vehicles.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* ── FORM ── */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <div>
              <h2 style={s.formTitle}>{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              {editVehicle && <p style={s.formSub}>{editVehicle.make} {editVehicle.model} · {editVehicle.plate_number}</p>}
            </div>
            <button style={s.closeBtn} onClick={resetForm}>✕</button>
          </div>

          {errors.general && (
            <div style={s.errorBox}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
                <circle cx="8" cy="8" r="7" stroke="#b91c1c" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 10.5v.5" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {errors.general[0]}
            </div>
          )}

          <div style={s.formBody}>
            {/* LEFT: Image upload */}
            <div style={s.formLeft}>
              <label style={s.fieldLabel}>Vehicle Photo <span style={s.optTag}>max 2MB</span></label>
              <div
                style={{
                  ...s.dropzone,
                  borderColor: dragOver ? '#dc2626' : imagePreview ? '#dc2626' : '#e2e8f0',
                  background: dragOver ? '#fff5f5' : imagePreview ? '#fff' : '#f8fafc',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleImageChange(e.dataTransfer.files[0]) }}
              >
                {imagePreview ? (
                  <div style={s.previewWrap}>
                    <img src={imagePreview} alt="Preview" style={s.previewImg} />
                    <div style={s.previewOverlay}>
                      <span style={s.previewChangeText}>📷 Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div style={s.dzPlaceholder}>
                    <div style={s.dzIconWrap}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect width="32" height="32" rx="8" fill="#fee2e2"/>
                        <path d="M16 10v12M10 16h12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p style={s.dzTitle}>Upload vehicle photo</p>
                    <p style={s.dzSub}>Drag & drop or <span style={{color:'#dc2626',fontWeight:600}}>browse</span></p>
                    <p style={s.dzHint}>PNG, JPG, WebP up to 2MB</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{display:'none'}} onChange={e => handleImageChange(e.target.files[0])} />
              {imagePreview && (
                <button style={s.removePhotoBtn} onClick={e => {
                  e.stopPropagation(); setImageFile(null); setImagePreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}>✕ Remove photo</button>
              )}
              {errors.image && <p style={s.fieldErr}>{errors.image[0]}</p>}
            </div>

            {/* RIGHT: Fields */}
            <div style={s.formRight}>
              <div style={s.formGrid}>
                {[
                  { label: 'Plate Number', key: 'plate_number', ph: 'ABC 1234' },
                  { label: 'Make (Brand)', key: 'make', ph: 'Toyota' },
                  { label: 'Model', key: 'model', ph: 'Vios' },
                  { label: 'Color', key: 'color', ph: 'Pearl White' },
                ].map(({ label, key, ph }) => (
                  <div key={key} style={s.fieldWrap}>
                    <label style={s.fieldLabel}>{label}</label>
                    <input style={s.input} placeholder={ph} value={form[key]}
                      onChange={e => set(key, e.target.value)} />
                    {errors[key] && <p style={s.fieldErr}>{errors[key][0]}</p>}
                  </div>
                ))}

                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Year</label>
                  <input type="number" style={s.input} value={form.year} onChange={e => set('year', e.target.value)} />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Type</label>
                  <select style={s.input} value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Daily Rate (₱)</label>
                  <input type="number" style={s.input} placeholder="1500" value={form.daily_rate}
                    onChange={e => set('daily_rate', e.target.value)} />
                  {errors.daily_rate && <p style={s.fieldErr}>{errors.daily_rate[0]}</p>}
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Hourly Rate (₱) <span style={s.optTag}>optional</span></label>
                  <input type="number" style={s.input} placeholder="200" value={form.hourly_rate}
                    onChange={e => set('hourly_rate', e.target.value)} />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Weekly Rate (₱) <span style={s.optTag}>optional</span></label>
                  <input type="number" style={s.input} placeholder="9000" value={form.weekly_rate}
                    onChange={e => set('weekly_rate', e.target.value)} />
                </div>

                <div style={{ ...s.fieldWrap, gridColumn: '1/-1' }}>
                  <label style={s.fieldLabel}>Features <span style={s.optTag}>comma-separated</span></label>
                  <input style={s.input} placeholder="GPS, AC, Dash Cam, Bluetooth" value={form.features}
                    onChange={e => set('features', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={s.formFooter}>
            <button style={s.btnGhost} onClick={resetForm}>Cancel</button>
            <button style={{ ...s.btnPrimary, opacity: isPending ? 0.6 : 1 }}
              onClick={() => { setErrors({}); editVehicle ? updateMutation.mutate() : createMutation.mutate() }}
              disabled={isPending}>
              {isPending ? 'Saving...' : editVehicle ? 'Save changes' : 'Add vehicle'}
            </button>
          </div>
        </div>
      )}

      {/* ── STATUS MODAL ── */}
      {statusModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>Update Status</h3>
                <p style={s.modalSub}>{statusModal.make} {statusModal.model} · {statusModal.plate_number}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setStatusModal(null)}>✕</button>
            </div>
            <div style={s.modalBtns}>
              {[
                { s: 'available',   label: 'Available',   icon: '✅' },
                { s: 'maintenance', label: 'Maintenance',  icon: '🔧' },
                { s: 'retired',     label: 'Retired',      icon: '🚫' },
              ].map(({ s: status, label, icon }) => {
                const meta = STATUS_META[status]
                return (
                  <button key={status}
                    style={{ ...s.statusBtn, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.bg}` }}
                    onClick={() => statusMutation.mutate({ id: statusModal.id, status })}
                    disabled={statusMutation.isPending}>
                    {icon} {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VEHICLES GRID ── */}
      {isLoading ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>⏳</div>
          <p style={s.emptyText}>Loading vehicles...</p>
        </div>
      ) : allVehicles.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>🚗</div>
          <p style={s.emptyTitle}>No vehicles yet</p>
          <p style={s.emptyText}>Add your first vehicle to get started.</p>
          <button style={{ ...s.btnPrimary, marginTop: '16px' }} onClick={() => { resetForm(); setShowForm(true) }}>
            + Add first vehicle
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>🔍</div>
          <p style={s.emptyTitle}>No results</p>
          <p style={s.emptyText}>No vehicles match the selected filters.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {vehicles.map(v => {
            const meta = STATUS_META[v.status] || STATUS_META.retired
            return (
              <div key={v.id} style={s.vcard}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>

                {/* Image */}
                <div style={s.imgWrap}>
                  {v.image_path ? (
                    <>
                      <img src={`${API_URL}/storage/${v.image_path}`} alt={`${v.make} ${v.model}`}
                        style={s.img}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                      <div style={{ ...s.imgFallback, display: 'none' }}>
                        <span style={{ fontSize: '52px' }}>{getEmoji(v.type)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={s.imgFallback}>
                      <span style={{ fontSize: '52px' }}>{getEmoji(v.type)}</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <span style={{ ...s.statusBadge, background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>

                  {/* Type pill */}
                  <span style={s.typePill}>{v.type.toUpperCase()}</span>
                </div>

                {/* Info */}
                <div style={s.vinfo}>
                  <div style={s.vname}>{v.make} {v.model}</div>
                  <div style={s.vmeta}>{v.year} · {v.color}</div>
                  <div style={s.vplate}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{marginRight:4}}>
                      <rect x="1" y="3" width="10" height="6" rx="1" stroke="#94a3b8" strokeWidth="1.2"/>
                      <path d="M3 5h6M3 7h4" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    {v.plate_number}
                  </div>

                  {v.features?.length > 0 && (
                    <div style={s.features}>
                      {v.features.slice(0, 3).map(f => <span key={f} style={s.ftag}>{f}</span>)}
                      {v.features.length > 3 && <span style={s.ftag}>+{v.features.length - 3}</span>}
                    </div>
                  )}

                  <div style={s.rateRow}>
                    <div>
                      <span style={s.rate}>₱{Number(v.daily_rate).toLocaleString()}</span>
                      <span style={s.rateUnit}>/day</span>
                    </div>
                    {v.hourly_rate && (
                      <div style={s.rateSecondary}>₱{Number(v.hourly_rate).toLocaleString()}/hr</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={s.vactions}>
                  <button style={s.actionEdit} onClick={() => openEdit(v)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                  <button style={s.actionStatus} onClick={() => setStatusModal(v)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Status
                  </button>
                  <button style={s.actionDel}
                    onClick={() => { if (window.confirm(`Delete ${v.make} ${v.model}?`)) deleteMutation.mutate(v.id) }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3.5h9M5 3.5V2.5h3v1M4 3.5l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        input:focus, select:focus { outline: none; border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.08) !important; }
        input::placeholder { color: #cbd5e1; }
        @media (max-width: 700px) {
          .form-body-grid { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}

const s = {
  page: { fontFamily: "'DM Sans', sans-serif", color: '#0f172a', paddingBottom: '40px' },

  // HEADER
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  pageSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  btnPrimary: { background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'background .15s' },
  btnGhost: { background: 'none', border: '1.5px solid #e2e8f0', color: '#475569', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  // FILTERS
  filters: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  filterSelect: { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' },
  clearFilter: { background: 'none', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  filterCount: { fontSize: '13px', color: '#94a3b8', marginLeft: '4px' },

  // FORM CARD
  formCard: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 0', marginBottom: '20px' },
  formTitle: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 3px', letterSpacing: '-0.02em' },
  formSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', lineHeight: 1 },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', margin: '0 24px 16px', fontSize: '13px', color: '#b91c1c' },
  formBody: { display: 'flex', gap: '24px', padding: '0 24px', flexWrap: 'wrap' },
  formLeft: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', flex: '0 0 220px' },
  formRight: { flex: 1, minWidth: '280px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' },
  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid #f1f5f9', marginTop: '20px' },

  // FIELDS
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '5px' },
  fieldLabel: { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  optTag: { fontWeight: '400', textTransform: 'none', color: '#94a3b8', fontSize: '10px' },
  input: { border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '9px 11px', fontSize: '13px', color: '#0f172a', fontFamily: "'DM Sans', sans-serif", width: '100%', background: '#fff', transition: 'border-color .15s' },
  fieldErr: { fontSize: '11px', color: '#dc2626', margin: '2px 0 0' },

  // DROPZONE
  dropzone: { border: '2px dashed', borderRadius: '12px', cursor: 'pointer', transition: 'all .2s', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  previewWrap: { width: '100%', height: '200px', position: 'relative' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  previewOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' },
  previewChangeText: { color: '#fff', fontSize: '13px', fontWeight: '600', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: '20px', opacity: 0 },
  dzPlaceholder: { textAlign: 'center', padding: '16px' },
  dzIconWrap: { marginBottom: '10px' },
  dzTitle: { fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px' },
  dzSub: { fontSize: '13px', color: '#64748b', margin: '0 0 6px' },
  dzHint: { fontSize: '11px', color: '#94a3b8', margin: 0 },
  removePhotoBtn: { background: '#fee2e2', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif', width: '100%', textAlign: 'center" },

  // OVERLAY + MODAL
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  modalTitle: { fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' },
  modalSub: { fontSize: '13px', color: '#64748b', margin: 0 },
  modalBtns: { display: 'flex', flexDirection: 'column', gap: '8px' },
  statusBtn: { border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'opacity .15s' },

  // EMPTY
  emptyCard: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  emptyTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },

  // VEHICLE GRID
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  vcard: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  imgWrap: { position: 'relative', height: '180px', background: '#f8fafc', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
  statusBadge: { position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  typePill: { position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15,23,42,0.7)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px', backdropFilter: 'blur(4px)' },
  vinfo: { padding: '14px 16px 10px' },
  vname: { fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '2px', letterSpacing: '-0.01em' },
  vmeta: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  vplate: { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '8px', display: 'flex', alignItems: 'center' },
  features: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' },
  ftag: { background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' },
  rateRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  rate: { fontSize: '20px', fontWeight: '800', color: '#dc2626', letterSpacing: '-0.02em' },
  rateUnit: { fontSize: '12px', color: '#94a3b8', fontWeight: '400', marginLeft: '2px' },
  rateSecondary: { fontSize: '12px', color: '#64748b' },
  vactions: { padding: '0 16px 14px', display: 'flex', gap: '6px' },
  actionEdit: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' },
  actionStatus: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' },
  actionDel: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff5f5', border: '1.5px solid #fecaca', color: '#dc2626', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .15s' },
}
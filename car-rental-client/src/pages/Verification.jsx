import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

const MAX_MB = 4

const todayStr = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const EMPTY_FILES = { license_front: null, license_back: null, second_id_image: null }

function FileField({ label, file, existing, onSelect, onInvalid, error }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleChange = e => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      onInvalid('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      onInvalid('Image must be smaller than ' + MAX_MB + 'MB.')
      return
    }
    onSelect(f)
  }

  return (
    <div className="vf-field">
      <label className="vf-label">{label}</label>
      <div
        className={'vf-drop ' + (preview ? 'vf-drop-has' : '')}
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt={label} className="vf-drop-img" />
        ) : existing ? (
          <div className="vf-drop-msg">
            <span className="vf-ok">✓ On file</span>
            <span>Click to replace</span>
          </div>
        ) : (
          <div className="vf-drop-msg">
            <span className="vf-drop-plus">+</span>
            <span>Click to choose photo</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {file && (
        <button type="button" className="vf-link-btn" onClick={() => onSelect(null)}>
          Remove
        </button>
      )}
      {error && <p className="vf-err">{error}</p>}
    </div>
  )
}

export default function Verification() {
  const qc = useQueryClient()

  const { data: v, isLoading, isError } = useQuery({
    queryKey: ['verification'],
    queryFn: () => api.get('/verification').then(r => r.data.verification),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    license_number: '',
    license_expiry: '',
    second_id_type: '',
    second_id_number: '',
  })
  const [files, setFiles] = useState(EMPTY_FILES)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const setField = (k, val) => setForm(f => ({ ...f, [k]: val }))
  const setFile = (k, f) => setFiles(prev => ({ ...prev, [k]: f }))
  const invalidFile = (k, msg) => setErrors(e => ({ ...e, [k]: [msg] }))

  const submit = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, val]) => {
        if (val) fd.append(k, val)
      })
      Object.entries(files).forEach(([k, f]) => {
        if (f) fd.append(k, f)
      })
      return api.post('/verification', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: res => {
      setSuccess(res.data.message || 'Documents submitted.')
      setErrors({})
      setShowForm(false)
      setFiles(EMPTY_FILES)
      qc.invalidateQueries({ queryKey: ['verification'] })
    },
    onError: err => {
      const d = err.response && err.response.data
      setSuccess('')
      setErrors(d && d.errors ? d.errors : { general: [(d && d.message) || 'Submission failed. Please try again.'] })
    },
  })

  if (isLoading) return <p className="text-gray-400 text-sm text-center py-16">Loading verification status...</p>

  if (isError || !v) {
    return (
      <div className="vf-wrap">
        <div className="vf-card">We couldn't load your verification status. Please refresh and try again.</div>
      </div>
    )
  }

  if (v.required === false) {
    return (
      <div className="vf-wrap">
        <div className="vf-card">Verification isn't required for admin accounts.</div>
      </div>
    )
  }

  const needLicenseDetails = !v.has_license_details || v.license_expired
  const needLicenseImages = !v.has_license_images
  const formVisible = v.status === 'unverified' || v.status === 'rejected' || showForm

  const canSubmit =
    (!needLicenseDetails || (form.license_number && form.license_expiry)) &&
    (!needLicenseImages || (files.license_front && files.license_back)) &&
    form.second_id_type &&
    files.second_id_image

  const handleSubmit = e => {
    e.preventDefault()
    setErrors({})
    setSuccess('')
    if (!canSubmit) {
      setErrors({ general: ['Please complete all required fields and upload the required photos.'] })
      return
    }
    submit.mutate()
  }

  const firstErr = key => (errors[key] && errors[key][0]) || null

  return (
    <div className="vf-wrap">
      <h1 className="vf-title">Account verification</h1>
      <p className="vf-sub">
        To protect our vehicles, we verify every renter. You need a valid driver's license and one other valid
        government ID.
      </p>

      {success && <div className="vf-banner vf-banner-ok">{success}</div>}

      {v.status === 'verified' && (
        <div className="vf-card vf-status-ok">
          <div className="vf-status-title">✓ Your account is verified</div>
          <p className="vf-status-text">
            Verified on {fmtDate(v.verified_at)}. You can now book vehicles.
          </p>
          <Link to="/vehicles" className="vf-btn">Browse vehicles</Link>
        </div>
      )}

      {v.status === 'pending' && (
        <div className="vf-card vf-status-pending">
          <div className="vf-status-title">Under review</div>
          <p className="vf-status-text">
            Submitted {fmtDate(v.submitted_at)}. Our team is checking your documents. You'll be able to book once
            you're verified.
          </p>
          {!showForm && (
            <button type="button" className="vf-btn vf-btn-ghost" onClick={() => setShowForm(true)}>
              Re-upload documents
            </button>
          )}
        </div>
      )}

      {v.status === 'rejected' && (
        <div className="vf-card vf-status-rejected">
          <div className="vf-status-title">Verification was not approved</div>
          {v.notes && <p className="vf-status-text">Reason: {v.notes}</p>}
          <p className="vf-status-text">Please submit your documents again below.</p>
        </div>
      )}

      {v.status !== 'verified' && (
        <div className="vf-card">
          <div className="vf-checklist">
            <div className={'vf-check ' + (v.has_license_details && v.has_license_images && !v.license_expired ? 'vf-check-ok' : '')}>
              {v.has_license_details && v.has_license_images && !v.license_expired ? '✓' : '○'} Driver's license
              {v.license_expired ? ' (expired, please enter a new one)' : ''}
            </div>
            <div className={'vf-check ' + (v.has_second_id ? 'vf-check-ok' : '')}>
              {v.has_second_id ? '✓' : '○'} One other valid government ID
            </div>
          </div>
        </div>
      )}

      {formVisible && v.status !== 'verified' && (
        <form className="vf-card" onSubmit={handleSubmit}>
          {errors.general && <div className="vf-banner vf-banner-err">{errors.general[0]}</div>}

          <h2 className="vf-section">1. Driver's license</h2>
          <div className="vf-grid">
            <div className="vf-field">
              <label className="vf-label">License number {!needLicenseDetails && <span className="vf-opt">(on file)</span>}</label>
              <input
                className="vf-input"
                placeholder="N01-23-456789"
                value={form.license_number}
                onChange={e => setField('license_number', e.target.value)}
              />
              {firstErr('license_number') && <p className="vf-err">{firstErr('license_number')}</p>}
            </div>
            <div className="vf-field">
              <label className="vf-label">Expiry date {!needLicenseDetails && <span className="vf-opt">(on file)</span>}</label>
              <input
                type="date"
                className="vf-input"
                min={todayStr()}
                value={form.license_expiry}
                onChange={e => setField('license_expiry', e.target.value)}
              />
              {firstErr('license_expiry') && <p className="vf-err">{firstErr('license_expiry')}</p>}
            </div>
          </div>
          <div className="vf-grid">
            <FileField
              label="Front of license"
              file={files.license_front}
              existing={v.has_license_images}
              onSelect={f => setFile('license_front', f)}
              onInvalid={msg => invalidFile('license_front', msg)}
              error={firstErr('license_front')}
            />
            <FileField
              label="Back of license"
              file={files.license_back}
              existing={v.has_license_images}
              onSelect={f => setFile('license_back', f)}
              onInvalid={msg => invalidFile('license_back', msg)}
              error={firstErr('license_back')}
            />
          </div>

          <h2 className="vf-section">2. One other valid government ID</h2>
          <div className="vf-grid">
            <div className="vf-field">
              <label className="vf-label">ID type</label>
              <select
                className="vf-input"
                value={form.second_id_type}
                onChange={e => setField('second_id_type', e.target.value)}
              >
                <option value="">Select an ID...</option>
                {(v.second_id_types || []).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {firstErr('second_id_type') && <p className="vf-err">{firstErr('second_id_type')}</p>}
            </div>
            <div className="vf-field">
              <label className="vf-label">ID number <span className="vf-opt">(optional)</span></label>
              <input
                className="vf-input"
                value={form.second_id_number}
                onChange={e => setField('second_id_number', e.target.value)}
              />
              {firstErr('second_id_number') && <p className="vf-err">{firstErr('second_id_number')}</p>}
            </div>
          </div>
          <FileField
            label="Photo of the ID"
            file={files.second_id_image}
            existing={false}
            onSelect={f => setFile('second_id_image', f)}
            onInvalid={msg => invalidFile('second_id_image', msg)}
            error={firstErr('second_id_image')}
          />

          <p className="vf-note">
            Your documents are stored privately and only reviewed by our admin team. Photos must be clear and under {MAX_MB}MB.
          </p>

          <button type="submit" className="vf-btn" disabled={submit.isPending || !canSubmit}>
            {submit.isPending ? 'Submitting...' : 'Submit for verification'}
          </button>
        </form>
      )}

      <style>{`
        .vf-wrap { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
        .vf-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
        .vf-sub { font-size: 14px; color: #64748b; margin: -8px 0 0; line-height: 1.6; }
        .vf-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; }
        .vf-banner { border-radius: 10px; padding: 11px 14px; font-size: 13px; margin-bottom: 14px; }
        .vf-banner-ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; margin-bottom: 0; }
        .vf-banner-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .vf-status-ok { background: #f0fdf4; border-color: #bbf7d0; }
        .vf-status-pending { background: #fffbeb; border-color: #fde68a; }
        .vf-status-rejected { background: #fef2f2; border-color: #fecaca; }
        .vf-status-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .vf-status-text { font-size: 13px; color: #475569; margin: 0 0 12px; line-height: 1.6; }
        .vf-checklist { display: flex; flex-direction: column; gap: 8px; }
        .vf-check { font-size: 14px; color: #64748b; }
        .vf-check-ok { color: #16a34a; font-weight: 600; }
        .vf-section { font-size: 15px; font-weight: 700; color: #0f172a; margin: 18px 0 12px; }
        .vf-section:first-of-type { margin-top: 0; }
        .vf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .vf-field { display: flex; flex-direction: column; gap: 5px; }
        .vf-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .vf-opt { font-weight: 400; text-transform: none; color: #94a3b8; }
        .vf-input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #0f172a; background: #fff; font-family: inherit; }
        .vf-input:focus { outline: none; border-color: #dc2626; }
        .vf-drop { border: 2px dashed #e2e8f0; border-radius: 12px; min-height: 130px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #f8fafc; overflow: hidden; }
        .vf-drop:hover { border-color: #fca5a5; }
        .vf-drop-has { border-style: solid; border-color: #dc2626; background: #fff; }
        .vf-drop-img { width: 100%; height: 150px; object-fit: cover; display: block; }
        .vf-drop-msg { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; color: #64748b; }
        .vf-drop-plus { font-size: 26px; color: #dc2626; line-height: 1; }
        .vf-ok { color: #16a34a; font-weight: 700; font-size: 13px; }
        .vf-link-btn { background: none; border: none; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0; text-align: left; }
        .vf-err { font-size: 12px; color: #dc2626; margin: 0; }
        .vf-note { font-size: 12px; color: #94a3b8; margin: 14px 0; line-height: 1.6; }
        .vf-btn { display: inline-block; background: #dc2626; color: #fff; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; font-family: inherit; }
        .vf-btn:hover:not(:disabled) { background: #b91c1c; }
        .vf-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .vf-btn-ghost { background: #fff; color: #475569; border: 1.5px solid #e2e8f0; }
        .vf-btn-ghost:hover:not(:disabled) { background: #f1f5f9; }
        @media (max-width: 600px) { .vf-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
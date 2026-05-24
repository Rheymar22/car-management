import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuth";

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    terms_accepted: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register({ ...form, terms_accepted: form.terms_accepted ? 1 : 0 });
      navigate("/vehicles");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: err.response?.data?.message || "Registration failed.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }) =>
    errors[field]?.[0] ? (
      <p style={styles.fieldErr}>{errors[field][0]}</p>
    ) : null;

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.brand}>
            <img
              src="/MRPAT pfp.jpg"
              alt="logo"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                objectFit: "cover",
              }}
            />
            <span style={styles.brandName}>MR.PAT</span>
          </div>

          <div style={styles.heroText}>
            <h1 style={styles.heroHeading}>
              Start your
              <br />
              journey today.
            </h1>
            <p style={styles.heroSub}>
              Join hundreds of customers who trust Roxas City Car Rental for
              their daily commutes and road trips.
            </p>
          </div>

          <div style={styles.features}>
            {[
              { icon: "✦", text: "No hidden fees or surprise charges" },
              { icon: "✦", text: "Cancel or modify bookings anytime" },
              { icon: "✦", text: "Dedicated customer support" },
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.leftFooter}>
          <p style={styles.leftFooterText}>Roxas City, Capiz · Est. 2024</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create account</h2>
            <p style={styles.formSub}>Fill in your details to get started</p>
          </div>

          {errors.general && (
            <div style={styles.errorBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="#b91c1c"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5v3.5M8 10.5v.5"
                  stroke="#b91c1c"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* First & Last name */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>First name</label>
                <input
                  style={styles.input}
                  placeholder="Juan"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  required
                />
                <FieldError field="first_name" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last name</label>
                <input
                  style={styles.input}
                  placeholder="dela Cruz"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  required
                />
                <FieldError field="last_name" />
              </div>
            </div>

            {/* Full name */}
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <div style={styles.inputWrap}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <circle
                    cx="8"
                    cy="5"
                    r="3"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  style={styles.inputWithIcon}
                  placeholder="Juan dela Cruz"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <FieldError field="name" />
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrap}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <rect
                    x="1"
                    y="3"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M1 6l7 4 7-4"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="email"
                  style={styles.inputWithIcon}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>
              <FieldError field="email" />
            </div>

            {/* Phone */}
            <div style={styles.field}>
              <label style={styles.label}>Phone number</label>
              <div style={styles.inputWrap}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <rect
                    x="4"
                    y="1"
                    width="8"
                    height="14"
                    rx="2"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <circle cx="8" cy="12" r="0.75" fill="#94a3b8" />
                </svg>
                <input
                  style={styles.inputWithIcon}
                  placeholder="+63 9XX XXX XXXX"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <FieldError field="phone" />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <rect
                    x="3"
                    y="7"
                    width="10"
                    height="8"
                    rx="1.5"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 7V5a3 3 0 016 0v2"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="11" r="1" fill="#94a3b8" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  style={{ ...styles.inputWithIcon, paddingRight: "40px" }}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <FieldError field="password" />
            </div>

            {/* Confirm Password */}
            <div style={styles.field}>
              <label style={styles.label}>Confirm password</label>
              <div style={styles.inputWrap}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <rect
                    x="3"
                    y="7"
                    width="10"
                    height="8"
                    rx="1.5"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 7V5a3 3 0 016 0v2"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="11" r="1" fill="#94a3b8" />
                </svg>
                <input
                  type={showConfirm ? "text" : "password"}
                  style={{ ...styles.inputWithIcon, paddingRight: "40px" }}
                  placeholder="Re-enter password"
                  value={form.password_confirmation}
                  onChange={(e) => set("password_confirmation", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {/* Terms */}
            <label style={styles.termsRow}>
              <div
                style={{
                  ...styles.checkbox,
                  background: form.terms_accepted ? "#dc2626" : "white",
                  borderColor: form.terms_accepted ? "#dc2626" : "#e2e8f0",
                }}
              >
                <input
                  type="checkbox"
                  style={{ display: "none" }}
                  checked={form.terms_accepted}
                  onChange={(e) => set("terms_accepted", e.target.checked)}
                />
                {form.terms_accepted && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span style={styles.termsText}>
                I agree to the{" "}
                <a href="#" style={styles.termsLink}>
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" style={styles.termsLink}>
                  Privacy Policy
                </a>
              </span>
            </label>
            <FieldError field="terms_accepted" />

            <button
              type="submit"
              disabled={loading || !form.terms_accepted}
              style={{
                ...styles.submitBtn,
                opacity: loading || !form.terms_accepted ? 0.6 : 1,
                cursor:
                  loading || !form.terms_accepted ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.btnInner}>
                  <span style={styles.spinner} />
                  Creating account...
                </span>
              ) : (
                <span style={styles.btnInner}>
                  Create account
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>already have an account?</span>
            <span style={styles.dividerLine} />
          </div>

          <Link to="/login" style={styles.loginBtn}>
            Sign in instead
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #cbd5e1; }
        input:focus { outline: none; border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.08); }
        button[type="submit"]:hover:not(:disabled) { background: #b91c1c !important; transform: translateY(-1px); }
        button[type="submit"] { transition: background 0.15s, transform 0.15s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .reg-left { display: none !important; }
          .reg-right { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="1.5" stroke="#94a3b8" strokeWidth="1.5" />
      <path
        d="M2 2l12 12"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="1.5" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    background: "#f8fafc",
  },
  leftPanel: {
    width: "40%",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px 48px",
    position: "relative",
    overflow: "hidden",
  },
  leftContent: {
    display: "flex",
    flexDirection: "column",
    gap: "52px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    overflow: "hidden",
  },
  brandName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "white",
    letterSpacing: "3px",
  },
  heroText: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  heroHeading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "46px",
    fontWeight: "700",
    color: "white",
    lineHeight: "1.1",
  },
  heroSub: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.7",
    maxWidth: "300px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  featureIcon: {
    color: "#dc2626",
    fontSize: "10px",
    flexShrink: 0,
  },
  featureText: {
    fontSize: "14px",
    color: "#cbd5e1",
  },
  leftFooter: {
    borderTop: "1px solid #1e293b",
    paddingTop: "24px",
  },
  leftFooterText: {
    fontSize: "12px",
    color: "#475569",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    overflowY: "auto",
  },
  formContainer: {
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    paddingTop: "20px",
    paddingBottom: "20px",
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "'Playfair Display', serif",
  },
  formSub: {
    fontSize: "14px",
    color: "#64748b",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#b91c1c",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    letterSpacing: "0.2px",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#0f172a",
    background: "white",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputWithIcon: {
    width: "100%",
    padding: "10px 14px 10px 40px",
    fontSize: "14px",
    color: "#0f172a",
    background: "white",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  fieldErr: {
    fontSize: "12px",
    color: "#dc2626",
    marginTop: "2px",
  },
  termsRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
    marginTop: "4px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "5px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    marginTop: "1px",
  },
  termsText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.5",
  },
  termsLink: {
    color: "#dc2626",
    textDecoration: "none",
    fontWeight: "500",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: "4px",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "15px",
    height: "15px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e2e8f0",
    display: "block",
  },
  dividerText: {
    fontSize: "12px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    color: "#64748b",
    fontFamily: "'DM Sans', sans-serif",
    padding: "0",
    marginBottom: "8px",
  },
  loginBtn: {
    display: "block",
    width: "100%",
    padding: "12px",
    textAlign: "center",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    textDecoration: "none",
    background: "white",
  },
};

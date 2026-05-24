import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuth";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/vehicles");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
              Drive your
              <br />
              adventure.
            </h1>
            <p style={styles.heroSub}>
              Premium vehicles across Roxas City — from economy drives to
              executive rides, available when you need them.
            </p>
          </div>

          <div style={styles.features}>
            {[
              { icon: "✦", text: "Flexible hourly, daily & weekly rates" },
              { icon: "✦", text: "Real-time availability tracking" },
              { icon: "✦", text: "Instant booking confirmation" },
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
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to manage your rentals</p>
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
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
                  style={styles.input}
                  placeholder="Your Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

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
                  style={{ ...styles.input, paddingRight: "40px" }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="8"
                        cy="8"
                        r="1.5"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
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
                      <circle
                        cx="8"
                        cy="8"
                        r="1.5"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.btnInner}>
                  <span style={styles.spinner} />
                  Signing in...
                </span>
              ) : (
                <span style={styles.btnInner}>
                  Sign in
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
            <span style={styles.dividerText}>new to MR.PAT?</span>
            <span style={styles.dividerLine} />
          </div>

          <Link to="/register" style={styles.registerBtn}>
            Create an account
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
          .login-left { display: none !important; }
          .login-right { width: 100% !important; }
        }
      `}</style>
    </div>
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
    width: "45%",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px 48px",
    position: "relative",
    overflow: "hidden",
    className: "login-left",
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
    fontSize: "52px",
    fontWeight: "700",
    color: "white",
    lineHeight: "1.1",
  },
  heroSub: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.7",
    maxWidth: "320px",
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
    className: "login-right",
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
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
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
    padding: "11px 14px 11px 40px",
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
  registerBtn: {
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
    transition: "background 0.15s, border-color 0.15s",
    background: "white",
  },
};

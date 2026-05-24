import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuth";

const DEFAULT_HERO_BG = "/MRPAT%20bg.jpg";

const LOCATIONS = [
  "Roxas City Airport",
  "Pueblo de Panay Hotel",
  "Capitol Building",
  "Roxas Avenue",
  "Custom address",
];

const VEHICLE_TYPES = [
  {
    icon: "🚗",
    label: "Sedan",
    value: "sedan",
    desc: "Comfortable city drives",
  },
  { icon: "🚙", label: "SUV", value: "suv", desc: "Family & adventure" },
  { icon: "🚐", label: "Van", value: "van", desc: "Group travel" },
  {
    icon: "🏍️",
    label: "Motorcycle",
    value: "motorcycle",
    desc: "Quick & easy",
  },
];

const FEATURES = [
  {
    icon: "🛡️",
    title: "Fully Insured",
    desc: "All vehicles are covered with comprehensive insurance for your peace of mind.",
  },
  {
    icon: "📍",
    title: "Roxas City Pickup",
    desc: "Multiple convenient pickup points across Roxas City, including the airport.",
  },
  {
    icon: "💳",
    title: "GCash & Maya",
    desc: "Pay seamlessly via GCash, Maya, or credit/debit card through PayMongo.",
  },
  {
    icon: "⭐",
    title: "Verified Drivers",
    desc: "All renters are verified with valid Philippine driver's licenses.",
  },
  {
    icon: "🕐",
    title: "24/7 Support",
    desc: "Our team is available around the clock for any assistance you need.",
  },
  {
    icon: "📄",
    title: "Instant Invoice",
    desc: "Get your official PDF invoice instantly after every completed rental.",
  },
];

const TESTIMONIALS = [
  {
    name: "Juan dela Cruz",
    location: "Roxas City",
    text: "Super convenient! Booked a sedan for our Capiz road trip and the whole process was seamless. Will definitely rent again!",
    rating: 5,
  },
  {
    name: "Maria Santos",
    location: "Kalibo, Aklan",
    text: "Rented an SUV for a family reunion. Clean vehicle, fair price, and the GCash payment was so easy. Highly recommended!",
    rating: 5,
  },
  {
    name: "Pedro Reyes",
    location: "Iloilo City",
    text: "Best car rental in Capiz! Professional staff and the booking system is very user-friendly. The airport pickup saved us a lot of time.",
    rating: 5,
  },
];

function StarRating({ count }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: "#f59e0b", fontSize: "14px" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroBg, setHeroBg] = useState(DEFAULT_HERO_BG);
  const [showUploader, setShowUploader] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setHeroBg(url);
    setShowUploader(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files[0]);
  };

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const fmt = (d) => d.toISOString().slice(0, 16);

  const [search, setSearch] = useState({
    pickup: LOCATIONS[0],
    start: fmt(now),
    end: fmt(tomorrow),
    type: "",
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      start: search.start,
      end: search.end,
      type: search.type,
      pickup: search.pickup,
    });
    navigate("/vehicles?" + params.toString());
  };

  return (
    <div style={s.page}>
      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>
            <div style={s.logoMark}>
              <img
                src="/MRPAT pfp.jpg"
                alt="logo"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <div style={s.logoName}>MR.PAT</div>
              <div style={s.logoSub}>Roxas City, Capiz</div>
            </div>
          </Link>

          <div style={s.navLinks}>
            <a href="#vehicles" style={s.navLink}>
              Fleet
            </a>
            <a href="#features" style={s.navLink}>
              Why Us
            </a>
            <a href="#contact" style={s.navLink}>
              Contact
            </a>
          </div>

          <div style={s.navActions}>
            {token ? (
              <Link to="/vehicles" style={s.btnPrimary}>
                Browse Vehicles
              </Link>
            ) : (
              <>
                <Link to="/login" style={s.btnGhost}>
                  Sign in
                </Link>
                <Link to="/register" style={s.btnPrimary}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── IMAGE UPLOADER MODAL ── */}
      {showUploader && (
        <div style={s.modalOverlay} onClick={() => setShowUploader(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Change hero background</h3>
              <button
                style={s.modalClose}
                onClick={() => setShowUploader(false)}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                ...s.dropZone,
                borderColor: dragOver ? "#dc2626" : "#e2e8f0",
                background: dragOver ? "#fff5f5" : "#f8fafc",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <div style={s.dropIcon}>🖼️</div>
              <p style={s.dropTitle}>Drop your image here</p>
              <p style={s.dropSub}>or click to browse files</p>
              <p style={s.dropHint}>JPG, PNG, WEBP — recommended 1920×1080px</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleImageUpload(e.target.files[0])}
              />
            </div>
            <button
              style={s.resetBtn}
              onClick={() => {
                setHeroBg(DEFAULT_HERO_BG);
                setShowUploader(false);
              }}
            >
              Reset to default image
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ ...s.hero, backgroundImage: `url(${heroBg})` }}>
        <div style={s.heroOverlay} />
        <div style={s.heroInner}>
          <div style={s.heroBadge}>
            <span style={s.badgeDot} />
            Serving Roxas City, Capiz since 2018
          </div>
          <h1 style={s.heroTitle}>
            Drive anywhere in
            <br />
            <span style={s.heroAccent}>Capiz</span> your way
          </h1>
          <p style={s.heroDesc}>
            Premium vehicles, flexible rates, and seamless booking — all
            localized for Roxas City. Pay with GCash, Maya, or card.
          </p>

          {/* Search card */}
          <form style={s.searchCard} onSubmit={handleSearch}>
            <div style={s.searchGrid}>
              <div style={s.searchField}>
                <label style={s.searchLabel}>📍 Pickup location</label>
                <select
                  style={s.searchInput}
                  value={search.pickup}
                  onChange={(e) =>
                    setSearch({ ...search, pickup: e.target.value })
                  }
                >
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div style={s.searchField}>
                <label style={s.searchLabel}>📅 Pickup date & time</label>
                <input
                  type="datetime-local"
                  style={s.searchInput}
                  value={search.start}
                  onChange={(e) =>
                    setSearch({ ...search, start: e.target.value })
                  }
                />
              </div>
              <div style={s.searchField}>
                <label style={s.searchLabel}>🔄 Return date & time</label>
                <input
                  type="datetime-local"
                  style={s.searchInput}
                  value={search.end}
                  onChange={(e) =>
                    setSearch({ ...search, end: e.target.value })
                  }
                />
              </div>
              <div style={s.searchField}>
                <label style={s.searchLabel}>🚘 Vehicle type</label>
                <select
                  style={s.searchInput}
                  value={search.type}
                  onChange={(e) =>
                    setSearch({ ...search, type: e.target.value })
                  }
                >
                  <option value="">All types</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" style={s.searchBtn}>
              Search available vehicles →
            </button>
          </form>

          <div style={s.trustRow}>
            {[
              "Free cancellation",
              "No hidden fees",
              "Instant confirmation",
              "GCash & Maya accepted",
            ].map((t) => (
              <div key={t} style={s.trustItem}>
                <span style={s.trustCheck}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={s.stats}>
        <div style={s.statsGrid}>
          {[
            { value: 500, suffix: "+", label: "Happy customers" },
            { value: 30, suffix: "+", label: "Vehicles available" },
            { value: 6, suffix: "", label: "Years of service" },
            { value: 98, suffix: "%", label: "Satisfaction rate" },
          ].map((st, i) => (
            <div
              key={i}
              style={{
                ...s.stat,
                borderRight:
                  i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <div style={s.statValue}>
                <AnimatedCounter target={st.value} suffix={st.suffix} />
              </div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VEHICLE TYPES ── */}
      <section style={s.section} id="vehicles">
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTag}>Our fleet</span>
            <h2 style={s.sectionTitle}>Choose your ride</h2>
            <p style={s.sectionDesc}>
              From city sedans to spacious vans — we have the right vehicle for
              every trip in Capiz.
            </p>
          </div>
          <div style={s.typesGrid}>
            {VEHICLE_TYPES.map((v) => (
              <Link
                key={v.value}
                to={token ? `/vehicles?type=${v.value}` : "/register"}
                style={s.typeCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#dc2626";
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 16px 40px rgba(220,38,38,0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={s.typeIconWrap}>{v.icon}</div>
                <div style={s.typeLabel}>{v.label}</div>
                <div style={s.typeDesc}>{v.desc}</div>
                <div style={s.typeLink}>Browse {v.label}s →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={s.howSection}>
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <span
              style={{
                ...s.sectionTag,
                background: "rgba(220,38,38,0.18)",
                color: "#f87171",
              }}
            >
              Simple process
            </span>
            <h2 style={{ ...s.sectionTitle, color: "#fff" }}>
              Rent in 4 easy steps
            </h2>
          </div>
          <div style={s.stepsGrid}>
            {[
              {
                num: "01",
                title: "Create account",
                desc: "Register with your email and upload your Philippine driver's license.",
              },
              {
                num: "02",
                title: "Search & select",
                desc: "Pick your dates, location in Roxas City, and browse available vehicles.",
              },
              {
                num: "03",
                title: "Book & pay",
                desc: "Confirm your booking and pay instantly via GCash, Maya, or card.",
              },
              {
                num: "04",
                title: "Pick up & drive",
                desc: "Show your booking confirmation at the pickup point and hit the road!",
              },
            ].map((step, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link
              to={token ? "/vehicles" : "/register"}
              style={{
                ...s.btnPrimary,
                padding: "14px 32px",
                fontSize: "15px",
                borderRadius: "10px",
              }}
            >
              {token ? "Browse vehicles now" : "Create free account"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ ...s.section, background: "#f8fafc" }} id="features">
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTag}>Why choose us</span>
            <h2 style={s.sectionTitle}>Built for Roxas City</h2>
            <p style={s.sectionDesc}>
              The only car rental fully localized for Capiz — local pickup
              points, Philippine payment methods, and 24/7 support.
            </p>
          </div>
          <div style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={s.featureCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#fca5a5";
                  e.currentTarget.style.boxShadow =
                    "0 6px 24px rgba(220,38,38,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={s.featureIconWrap}>{f.icon}</div>
                <div style={s.featureTitle}>{f.title}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT ── */}
      <section style={{ ...s.section, background: "#fff" }}>
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTag}>Payments</span>
            <h2 style={s.sectionTitle}>Pay the Filipino way</h2>
            <p style={s.sectionDesc}>
              All payments are securely processed through PayMongo, a
              BSP-regulated Philippine payment gateway.
            </p>
          </div>

          <div style={s.payMethods}>
            {[
              {
                icon: "/gcash.jpg",
                name: "GCash",
                desc: "Scan QR to pay instantly",
              },

              {
                icon: "/paymaya.jpg",
                name: "Maya",
                desc: "Fast e-wallet checkout",
              },

              {
                icon: "/debit.jpg",
                name: "Credit / Debit Card",
                desc: "Visa, Mastercard, JCB",
              },
            ].map((m, i) => (
              <div
                key={i}
                style={s.payCard}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e2e8f0")
                }
              >
                <img
                  src={m.icon}
                  alt={m.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "contain",
                    marginBottom: "12px",
                  }}
                />

                <div style={s.payName}>{m.name}</div>

                <div style={s.payDesc}>{m.desc}</div>
              </div>
            ))}
          </div>

          <p style={s.payNote}>
            🔒 256-bit SSL encryption · BSP-regulated · No data stored on our
            servers
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...s.section, background: "#f8fafc" }}>
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTag}>Reviews</span>
            <h2 style={s.sectionTitle}>What our customers say</h2>
          </div>
          <div style={s.reviewsGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={s.reviewCard}>
                <StarRating count={t.rating} />
                <p style={s.reviewText}>"{t.text}"</p>
                <div style={s.reviewAuthor}>
                  <div style={s.reviewAvatar}>{t.name.charAt(0)}</div>
                  <div>
                    <div style={s.reviewName}>{t.name}</div>
                    <div style={s.reviewLoc}>📍 {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={s.cta}>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <h2 style={s.ctaTitle}>Ready to explore Capiz?</h2>
          <p style={s.ctaDesc}>
            Join hundreds of happy customers who trust Roxas Car Rental for
            their Capiz adventures.
          </p>
          <div style={s.ctaActions}>
            <Link to={token ? "/vehicles" : "/register"} style={s.btnWhite}>
              🚗 {token ? "Browse vehicles" : "Start renting today"}
            </Link>
            <a href="tel:+63366210000" style={s.btnOutlineWhite}>
              📞 Call us
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer} id="contact">
        <div style={s.container}>
          <div style={s.footerGrid}>
            <div>
              <Link to="/" style={{ ...s.logo, textDecoration: "none" }}>
                <div style={s.logoMark}>
                  <img
                    src="/MRPAT pfp.jpg"
                    alt="logo"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div>
                  <div style={{ ...s.logoName, color: "#fff" }}>
                    Roxas Car Rental
                  </div>
                  <div style={{ ...s.logoSub, color: "rgba(255,255,255,0.4)" }}>
                    Roxas City, Capiz
                  </div>
                </div>
              </Link>
              <p style={s.footerTagline}>
                Your trusted car rental partner in Capiz since 2018.
              </p>
              <div style={s.footerContact}>
                <div>📍 Rizal Street, Roxas City, Capiz 5800</div>
                <div>📞 +63 36 621-XXXX</div>
                <div>✉️ info@roxascarrental.com</div>
              </div>
            </div>
            <div>
              <div style={s.footerColTitle}>Quick links</div>
              {[
                {
                  label: "Browse vehicles",
                  to: token ? "/vehicles" : "/register",
                },
                { label: "Sign in", to: "/login" },
                { label: "Create account", to: "/register" },
                { label: "My bookings", to: "/bookings" },
              ].map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  style={s.footerLink}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
                  }
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <div style={s.footerColTitle}>Pickup locations</div>
              {LOCATIONS.slice(0, 4).map((l) => (
                <div key={l} style={s.footerLink}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div style={s.footerColTitle}>Payments accepted</div>
              {["💚 GCash", "💙 Maya", "💳 Credit / Debit Card"].map((p) => (
                <div key={p} style={s.footerLink}>
                  {p}
                </div>
              ))}
              <div style={s.footerBadge}>Powered by PayMongo</div>
            </div>
          </div>

          <div style={s.footerBottom}>
            <span>
              © {new Date().getFullYear()} Roxas City Car Rental. All rights
              reserved.
            </span>
            <div style={{ display: "flex", gap: "20px" }}>
              <a href="#" style={s.footerLegal}>
                Privacy Policy
              </a>
              <a href="#" style={s.footerLegal}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        select:focus, input:focus { outline: none; border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.4 } }
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .search-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .cta-actions { flex-direction: column; align-items: center; }
        }
      `}</style>
    </div>
  );
}

const s = {
  // CHANGE BG BUTTON
  changeBgBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    backdropFilter: "blur(8px)",
    color: "rgba(255,255,255,0.9)",
    fontSize: "13px",
    fontWeight: "500",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: "24px",
    transition: "background .15s",
  },

  // MODAL
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  modalBox: {
    background: "#fff",
    borderRadius: "18px",
    padding: "28px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "'Playfair Display', serif",
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "0",
  },
  dropZone: {
    border: "2px dashed #e2e8f0",
    borderRadius: "12px",
    padding: "40px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color .15s, background .15s",
    marginBottom: "14px",
  },
  dropIcon: { fontSize: "40px", marginBottom: "12px" },
  dropTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },
  dropSub: { fontSize: "14px", color: "#64748b", marginBottom: "8px" },
  dropHint: { fontSize: "12px", color: "#94a3b8" },
  resetBtn: {
    width: "100%",
    background: "none",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "13px",
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .15s, color .15s",
  },

  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: "#0f172a",
    overflowX: "hidden",
  },
  container: { maxWidth: "1160px", margin: "0 auto", padding: "0 24px" },

  // NAV
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e2e8f0",
  },
  navInner: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
    gap: "16px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    flexShrink: 0,
  },
  logoMark: {
    width: "40px",
    height: "40px",
    background: "#dc2626",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2",
  },
  logoSub: { fontSize: "11px", color: "#64748b" },
  navLinks: { display: "flex", gap: "28px" },
  navLink: {
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    transition: "color .15s",
  },
  navActions: { display: "flex", alignItems: "center", gap: "10px" },
  btnGhost: {
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "background .15s",
  },
  btnPrimary: {
    background: "#dc2626",
    color: "#fff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "9px 20px",
    borderRadius: "8px",
    display: "inline-block",
    border: "none",
    cursor: "pointer",
    transition: "background .15s",
  },

  // HERO
  hero: {
    position: "relative",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "680px",
    display: "flex",
    alignItems: "center",
    padding: "80px 0 60px",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.4) 100%)",
  },
  heroInner: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "0 24px",
    position: "relative",
    zIndex: 2,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
    fontWeight: "500",
    padding: "6px 16px",
    borderRadius: "20px",
    marginBottom: "28px",
    backdropFilter: "blur(8px)",
  },
  badgeDot: {
    width: "8px",
    height: "8px",
    background: "#4ade80",
    borderRadius: "50%",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(38px, 5.5vw, 64px)",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1.1",
    marginBottom: "20px",
    letterSpacing: "-0.01em",
  },
  heroAccent: { color: "#f87171" },
  heroDesc: {
    fontSize: "17px",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "40px",
    maxWidth: "520px",
    lineHeight: "1.65",
    fontWeight: "400",
  },

  // SEARCH CARD
  searchCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
    maxWidth: "900px",
    marginBottom: "28px",
  },
  searchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "16px",
  },
  searchField: { display: "flex", flexDirection: "column", gap: "5px" },
  searchLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  searchInput: {
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .15s",
  },
  searchBtn: {
    width: "100%",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background .15s",
  },
  trustRow: { display: "flex", flexWrap: "wrap", gap: "20px" },
  trustItem: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  trustCheck: { color: "#4ade80", fontWeight: "700" },

  // STATS
  stats: { background: "#dc2626", padding: "0" },
  statsGrid: {
    maxWidth: "1160px",
    margin: "0 auto",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
  },
  stat: { textAlign: "center", padding: "32px 16px" },
  statValue: {
    fontSize: "38px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: "1",
  },
  statLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    marginTop: "6px",
    fontWeight: "500",
  },

  // SECTIONS
  section: { padding: "88px 0" },
  sectionHeader: { textAlign: "center", marginBottom: "52px" },
  sectionTag: {
    display: "inline-block",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "5px 14px",
    borderRadius: "20px",
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "clamp(26px, 3.5vw, 38px)",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "14px",
    letterSpacing: "-0.02em",
    fontFamily: "'Playfair Display', serif",
  },
  sectionDesc: {
    fontSize: "16px",
    color: "#64748b",
    maxWidth: "520px",
    margin: "0 auto",
    lineHeight: "1.65",
  },

  // VEHICLES
  typesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  typeCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    padding: "32px 20px",
    textDecoration: "none",
    textAlign: "center",
    transition: "border-color .2s, transform .2s, box-shadow .2s",
    display: "block",
  },
  typeIconWrap: { fontSize: "46px", marginBottom: "12px" },
  typeLabel: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },
  typeDesc: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "14px",
    lineHeight: "1.5",
  },
  typeLink: { fontSize: "13px", fontWeight: "700", color: "#dc2626" },

  // HOW IT WORKS
  howSection: { background: "#0f172a", padding: "88px 0" },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "40px",
  },
  step: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "28px 22px",
  },
  stepNum: {
    fontSize: "42px",
    fontWeight: "900",
    color: "#dc2626",
    marginBottom: "12px",
    lineHeight: "1",
    opacity: "0.85",
    fontFamily: "'Playfair Display', serif",
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "10px",
  },
  stepDesc: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.55)",
    lineHeight: "1.65",
  },

  // FEATURES
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  featureCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    padding: "26px",
    transition: "border-color .2s, box-shadow .2s",
  },
  featureIconWrap: { fontSize: "32px", marginBottom: "14px" },
  featureTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  featureDesc: { fontSize: "13px", color: "#64748b", lineHeight: "1.65" },

  // PAYMENTS
  payMethods: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  payCard: {
    background: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    padding: "28px 36px",
    textAlign: "center",
    minWidth: "180px",
    transition: "border-color .2s",
    cursor: "default",
  },
  payName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    marginTop: "8px",
    marginBottom: "4px",
  },
  payDesc: { fontSize: "12px", color: "#64748b" },
  payNote: { textAlign: "center", fontSize: "13px", color: "#94a3b8" },

  // TESTIMONIALS
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  reviewCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    padding: "26px",
  },
  reviewText: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.75",
    margin: "12px 0 18px",
    fontStyle: "italic",
  },
  reviewAuthor: { display: "flex", alignItems: "center", gap: "10px" },
  reviewAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: "800",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reviewName: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  reviewLoc: { fontSize: "12px", color: "#64748b", marginTop: "2px" },

  // CTA
  cta: {
    background: "#dc2626",
    padding: "88px 24px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  ctaTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px, 4vw, 46px)",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "14px",
  },
  ctaDesc: {
    fontSize: "17px",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "36px",
  },
  ctaActions: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnWhite: {
    background: "#fff",
    color: "#dc2626",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 30px",
    borderRadius: "10px",
    display: "inline-block",
    transition: "transform .15s, box-shadow .15s",
  },
  btnOutlineWhite: {
    border: "2px solid rgba(255,255,255,0.5)",
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 30px",
    borderRadius: "10px",
    display: "inline-block",
    transition: "border-color .15s, background .15s",
  },

  // FOOTER
  footer: { background: "#0f172a", padding: "64px 0 0" },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "40px",
    marginBottom: "52px",
  },
  footerTagline: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    margin: "14px 0",
    lineHeight: "1.65",
    maxWidth: "240px",
  },
  footerContact: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
  },
  footerColTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "16px",
  },
  footerLink: {
    display: "block",
    textDecoration: "none",
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    padding: "4px 0",
    transition: "color .15s",
  },
  footerBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.4)",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "6px",
    marginTop: "12px",
  },
  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    flexWrap: "wrap",
    gap: "10px",
  },
  footerLegal: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.3)",
    transition: "color .15s",
  },
};

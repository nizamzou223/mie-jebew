import { useState, useEffect, useCallback } from "react";
import { api, getUser, getToken, setSession, clearSession } from "./api";

// ─── KATEGORI -> EMOJI ───────────────────────────────────────────────────────
// Pengganti referensi konstanta lama untuk menampilkan ikon menu.
const emojiForCategory = (categories, categoryId) => {
  const name = categories.find((c) => c.id === categoryId)?.name;
  if (name === "Mie") return "🍜";
  if (name === "Minuman") return "🥤";
  return "🍟";
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// Hook responsif: pantau lebar layar untuk menyesuaikan tata letak.
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

const FONT_DISPLAY = "'Baloo 2', system-ui, sans-serif";

// Jam real-time yang ter-update tiap detik.
function LiveClock({ variant = "full", style }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  if (variant === "compact") {
    return <span style={style}><i className="ti ti-clock" aria-hidden="true" /> {time}</span>;
  }
  return (
    <div style={style}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{time}</div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{date}</div>
    </div>
  );
}

// Helper pembayaran yang aman terhadap data kosong (mencegah crash di halaman transaksi).
const payBadgeType = (m) => (m === "cash" ? "gray" : m === "qris" ? "info" : m === "card" ? "warning" : "gray");
const payLabel = (p) => (p && p.method ? p.method.toUpperCase() : "—");

// ─── STYLES ──────────────────────────────────────────────────────────────────
// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "var(--mj-font-body, 'Plus Jakarta Sans', system-ui, sans-serif)", minHeight: "100vh", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)" },
  // Login
  loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" },
  loginCard: { background: "white", borderRadius: 24, padding: "2.5rem 2rem", width: "min(380px, 100%)", boxShadow: "0 30px 70px rgba(0,0,0,0.35)" },
  loginTitle: { fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: "var(--mj-red)", margin: "0 0 2px", letterSpacing: "-0.5px" },
  loginSub: { fontSize: 13.5, color: "#a07d6a", margin: "0 0 22px", fontWeight: 500 },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #ecd9c8", borderRadius: 12, fontSize: 14.5, boxSizing: "border-box", outline: "none", marginBottom: 12, background: "#fffdfa" },
  btnPrimary: { width: "100%", padding: "13px", background: "linear-gradient(135deg, var(--mj-red) 0%, var(--mj-red-deep) 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 15.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(200,54,44,0.35)" },
  // Sidebar
  sidebar: { width: 224, background: "linear-gradient(180deg, var(--mj-red) 0%, var(--mj-red-deep) 100%)", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarLogo: { padding: "1.5rem 1rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.14)" },
  sidebarLogoTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.3px" },
  sidebarLogoSub: { fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "2px 0 0", fontWeight: 500 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", borderRadius: 12, margin: "3px 10px", background: active ? "rgba(255,255,255,0.18)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.78)", fontSize: 14, fontWeight: active ? 700 : 500, boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.12)" : "none" }),
  navLabel: { marginLeft: 4 },
  // Layout
  mainLayout: { display: "flex", minHeight: "100vh" },
  contentArea: { flex: 1, overflow: "auto", minWidth: 0 },
  pageHeader: { padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  pageTitle: { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" },
  pageContent: { padding: "1.5rem" },
  // Cards
  card: { background: "var(--color-background-primary)", borderRadius: 16, border: "1px solid var(--color-border-tertiary)", padding: "1.25rem", boxShadow: "var(--mj-shadow-sm)" },
  statCard: { background: "var(--color-background-primary)", borderRadius: 16, border: "1px solid var(--color-border-tertiary)", padding: "1rem 1.25rem", boxShadow: "var(--mj-shadow-sm)" },
  statLabel: { fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 4px", fontWeight: 600 },
  statVal: { fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, margin: 0 },
  // Table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 520 },
  th: { padding: "11px 12px", textAlign: "left", fontWeight: 700, fontSize: 11.5, color: "var(--color-text-secondary)", borderBottom: "2px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" },
  td: { padding: "11px 12px", borderBottom: "1px solid var(--color-border-tertiary)" },
  // Badges
  badge: (type) => {
    const map = { success: { bg: "#dcfce7", color: "#166534" }, danger: { bg: "#fee2e2", color: "#991b1b" }, warning: { bg: "#fef3c7", color: "#92400e" }, info: { bg: "#ffe8d6", color: "#c2410c" }, gray: { bg: "#f1e7dd", color: "#6b5346" } };
    const t = map[type] || map.gray;
    return { background: t.bg, color: t.color, padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" };
  },
  // POS
  posLayout: { display: "flex", height: "100vh", overflow: "hidden" },
  posMenu: { flex: 1, overflow: "auto", padding: "1rem", background: "var(--color-background-tertiary)", minWidth: 0 },
  posCart: { width: 350, background: "var(--color-background-primary)", borderLeft: "1px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column", flexShrink: 0 },
  posCartHeader: { padding: "1rem", borderBottom: "1px solid var(--color-border-tertiary)", fontWeight: 800, fontSize: 16, fontFamily: FONT_DISPLAY },
  posCartItems: { flex: 1, overflow: "auto", padding: "0.75rem" },
  posCartFooter: { padding: "1rem", borderTop: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" },
  menuGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 },
  menuCard: (avail) => ({ position: "relative", background: "var(--color-background-primary)", borderRadius: 16, border: "1.5px solid var(--color-border-tertiary)", padding: "0.85rem", cursor: avail ? "pointer" : "not-allowed", opacity: avail ? 1 : 0.5, boxShadow: "var(--mj-shadow-sm)" }),
  cartItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--color-border-tertiary)" },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mj-red)", fontWeight: 700 },
  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(44,27,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" },
  modal: { background: "var(--color-background-primary)", borderRadius: 20, padding: "1.5rem", width: "min(480px, 100%)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 60px rgba(44,27,20,0.4)" },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 800, margin: "0 0 1rem" },
  // Buttons
  btn: (variant) => {
    const variants = {
      primary: { background: "linear-gradient(135deg, var(--mj-red) 0%, var(--mj-red-deep) 100%)", color: "white", border: "none", boxShadow: "0 6px 16px rgba(200,54,44,0.3)" },
      success: { background: "linear-gradient(135deg, #2E7D52 0%, #1f5e3c 100%)", color: "white", border: "none", boxShadow: "0 6px 16px rgba(46,125,82,0.3)" },
      danger: { background: "linear-gradient(135deg, #b91c1c 0%, #7f1414 100%)", color: "white", border: "none" },
      outline: { background: "transparent", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border-secondary)" },
      ghost: { background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "none" },
    };
    const v = variants[variant] || variants.outline;
    return { ...v, padding: "9px 16px", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 };
  },
  label: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 5, display: "block", fontWeight: 600 },
  formInput: { width: "100%", padding: "10px 13px", border: "1.5px solid var(--color-border-secondary)", borderRadius: 11, fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 12 },
  select: { width: "100%", padding: "10px 13px", border: "1.5px solid var(--color-border-secondary)", borderRadius: 11, fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 12 },
  row: { display: "flex", gap: 12, alignItems: "center" },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, margin: "0 0 12px" },
  tabs: { display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" },
  tab: (active) => ({ padding: "8px 16px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 800 : 600, background: active ? "linear-gradient(135deg, var(--mj-red) 0%, var(--mj-red-deep) 100%)" : "var(--color-background-secondary)", color: active ? "white" : "var(--color-text-secondary)" }),
  tag: { background: "var(--color-background-secondary)", border: "1.5px solid var(--color-border-tertiary)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" },
  activeTag: { background: "linear-gradient(135deg, var(--mj-red) 0%, var(--mj-red-deep) 100%)", color: "white", border: "1.5px solid var(--mj-red)", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(getUser());
  const [page, setPage] = useState(() => (getUser()?.role === "cashier" ? "pos" : "dashboard"));
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [welcoming, setWelcoming] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Muat seluruh data dari API setelah login (atau saat refresh dengan sesi tersimpan).
  const loadData = useCallback(async (user) => {
    setLoading(true);
    setLoadError("");
    try {
      const [branchesD, menuD, catsD, ordersD, expensesD] = await Promise.all([
        api.getBranches(),
        api.getMenu(),
        api.getCategories(),
        api.getOrders(),
        api.getExpenses(),
      ]);
      setBranches(branchesD);
      setMenuItems(menuD);
      setCategories(catsD);
      setOrders(ordersD);
      setExpenses(expensesD);
      setUsers(user.role === "admin" ? await api.getUsers() : [user]);
    } catch (e) {
      if (e.status === 401) { clearSession(); setCurrentUser(null); }
      setLoadError(e.message || "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && getToken()) loadData(currentUser);
  }, [currentUser, loadData]);

  const handleLogin = (token, user) => {
    setSession(token, user);
    setPage(user.role === "cashier" ? "pos" : "dashboard");
    setWelcoming(user);
    // Tampilkan animasi "Selamat datang" sejenak sebelum masuk.
    setTimeout(() => {
      setCurrentUser(user);
      setWelcoming(null);
    }, 1400);
  };

  const onLogout = () => {
    setDrawerOpen(false);
    setLoggingOut(true);
    // Tampilkan animasi "sampai jumpa" sejenak sebelum kembali ke login.
    setTimeout(() => {
      clearSession();
      setCurrentUser(null);
      setPage("dashboard");
      setLoggingOut(false);
    }, 1100);
  };

  if (loggingOut) {
    return (
      <div className="mj-goodbye">
        <div className="mj-bowl-emoji">🍜</div>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, margin: "16px 0 4px" }}>Sampai jumpa!</p>
        <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>Terima kasih sudah bekerja keras hari ini 🌶️</p>
      </div>
    );
  }

  if (welcoming) {
    return (
      <div className="mj-welcome">
        <div className="mj-check">
          <svg viewBox="0 0 52 52" fill="none"><path d="M14 27 l8 8 l16 -18" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, margin: "4px 0 2px" }}>Selamat datang, {welcoming.full_name}!</p>
        <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>{welcoming.role === "cashier" ? "Siap melayani pelanggan 🍜" : "Semoga harimu produktif 🌶️"}</p>
        <div className="mj-bowl-emoji">🍜</div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  if (loadError) {
    return (
      <div style={S.loginWrap} className="mj-login-bg">
        <div style={{ ...S.loginCard, textAlign: "center" }} className="mj-login-card">
          <div style={{ fontSize: 44, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, color: "var(--mj-red)", margin: "0 0 8px" }}>Gagal Memuat Data</h2>
          <p style={{ fontSize: 13, color: "#7a5a47" }}>{loadError}</p>
          <p style={{ fontSize: 12, color: "#a07d6a" }}>Pastikan server backend berjalan di port 4000.</p>
          <button className="mj-btn" style={{ ...S.btnPrimary, marginTop: 8 }} onClick={() => loadData(currentUser)}>Coba Lagi</button>
          <button className="mj-btn" style={{ ...S.btnPrimary, marginTop: 10, background: "#9a8475", boxShadow: "none" }} onClick={onLogout}>Keluar</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={S.loginWrap} className="mj-login-bg">
        <div style={{ textAlign: "center", color: "white" }}>
          <SteamingBowl size={110} />
          <div className="mj-spinner" style={{ margin: "18px auto 12px" }} />
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, margin: 0 }}>Menyiapkan dapur...</p>
        </div>
      </div>
    );
  }

  const userBranch = branches.find(b => b.id === currentUser.branch_id);

  // Filter orders/expenses by role
  const visibleOrders = currentUser.role === "admin" ? orders : orders.filter(o => o.branch_id === currentUser.branch_id);
  const visibleExpenses = currentUser.role === "admin" ? expenses : expenses.filter(e => e.branch_id === currentUser.branch_id);

  const navItems = currentUser.role === "admin"
    ? [
      { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
      { id: "pos", icon: "ti-shopping-cart", label: "Kasir POS" },
      { id: "orders", icon: "ti-receipt", label: "Transaksi" },
      { id: "menu", icon: "ti-tools-kitchen", label: "Menu" },
      { id: "expenses", icon: "ti-cash", label: "Pengeluaran" },
      { id: "branches", icon: "ti-building-store", label: "Cabang" },
      { id: "users", icon: "ti-users", label: "Pengguna" },
      { id: "reports", icon: "ti-chart-bar", label: "Laporan" },
    ]
    : [
      { id: "pos", icon: "ti-shopping-cart", label: "Kasir POS" },
      { id: "orders", icon: "ti-receipt", label: "Riwayat Transaksi" },
      { id: "expenses", icon: "ti-cash", label: "Pengeluaran Harian" },
    ];

  return (
    <div style={S.app}>
      {toast && (
        <div className="mj-row-in" style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.type === "success" ? "linear-gradient(135deg,#2E7D52,#1f5e3c)" : "linear-gradient(135deg,#b91c1c,#7f1414)", color: "white", padding: "12px 22px", borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8, maxWidth: "92vw" }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-alert-triangle"}`} aria-hidden="true" /> {toast.msg}
        </div>
      )}
      {page === "pos"
        ? <POSPage currentUser={currentUser} menuItems={menuItems} categories={categories} branches={branches} orders={orders} setOrders={setOrders} expenses={visibleExpenses} setExpenses={setExpenses} setPage={setPage} showToast={showToast} onLogout={onLogout} isMobile={isMobile} />
        : (
          <div style={{ ...S.mainLayout, flexDirection: isMobile ? "column" : "row" }}>
            {/* Top bar mobile dengan tombol menu */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(135deg, var(--mj-red), var(--mj-red-deep))", color: "white", position: "sticky", top: 0, zIndex: 70 }}>
                <button className="mj-btn" aria-label="Buka menu" style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "none", borderRadius: 10, padding: "8px 11px", cursor: "pointer" }} onClick={() => setDrawerOpen(true)}>
                  <i className="ti ti-menu-2" style={{ fontSize: 20 }} aria-hidden="true" />
                </button>
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18 }}>🍜 Mie Jebew</span>
                <button className="mj-btn" aria-label="Keluar" style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "none", borderRadius: 10, padding: "8px 11px", cursor: "pointer" }} onClick={onLogout}>
                  <i className="ti ti-logout" style={{ fontSize: 18 }} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Sidebar: drawer di mobile, tetap di desktop */}
            {isMobile ? (
              drawerOpen && (
                <>
                  <div className="mj-drawer-overlay" onClick={() => setDrawerOpen(false)} />
                  <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 90, animation: "mj-slide-down .25s ease both" }}>
                    <Sidebar navItems={navItems} page={page} setPage={(p) => { setPage(p); setDrawerOpen(false); }} currentUser={currentUser} userBranch={userBranch} onLogout={onLogout} onClose={() => setDrawerOpen(false)} isDrawer />
                  </div>
                </>
              )
            ) : (
              <Sidebar navItems={navItems} page={page} setPage={setPage} currentUser={currentUser} userBranch={userBranch} onLogout={onLogout} />
            )}

            <div style={S.contentArea} className="mj-page" key={page}>
              {page === "dashboard" && <DashboardPage orders={visibleOrders} expenses={visibleExpenses} branches={branches} menuItems={menuItems} isMobile={isMobile} />}
              {page === "orders" && <OrdersPage orders={visibleOrders} branches={branches} users={users} menuItems={menuItems} currentUser={currentUser} showToast={showToast} />}
              {page === "menu" && <MenuPage menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} showToast={showToast} />}
              {page === "expenses" && <ExpensesPage expenses={visibleExpenses} setExpenses={setExpenses} branches={branches} currentUser={currentUser} showToast={showToast} />}
              {page === "branches" && <BranchesPage branches={branches} setBranches={setBranches} showToast={showToast} />}
              {page === "users" && <UsersPage users={users} setUsers={setUsers} branches={branches} showToast={showToast} />}
              {page === "reports" && <ReportsPage orders={orders} expenses={expenses} branches={branches} menuItems={menuItems} isMobile={isMobile} />}
            </div>
          </div>
        )
      }
    </div>
  );
}

// ─── BOWL HERO (SVG mangkuk mie beruap) ──────────────────────────────────────
function SteamingBowl({ size = 96 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }} className="mj-bowl" aria-hidden="true">
      {/* uap */}
      <div className="mj-steam" style={{ left: "32%", top: "8%", animationDelay: "0s" }} />
      <div className="mj-steam" style={{ left: "48%", top: "2%", animationDelay: "0.6s" }} />
      <div className="mj-steam" style={{ left: "62%", top: "8%", animationDelay: "1.2s" }} />
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {/* mie */}
        <path d="M40 58 Q48 40 60 52 Q72 40 80 58" fill="none" stroke="#F2A03D" strokeWidth="4" strokeLinecap="round" />
        <path d="M44 60 Q54 46 60 58 Q68 46 76 60" fill="none" stroke="#FFC36B" strokeWidth="3" strokeLinecap="round" />
        {/* sumpit */}
        <line x1="70" y1="20" x2="92" y2="54" stroke="#8a5a3c" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="78" y1="16" x2="98" y2="50" stroke="#a06a48" strokeWidth="3.5" strokeLinecap="round" />
        {/* mangkuk */}
        <path d="M28 62 H92 A32 32 0 0 1 28 62 Z" fill="#C8362C" />
        <path d="M24 60 H96 A4 4 0 0 1 96 68 H24 A4 4 0 0 1 24 60 Z" fill="#9E241C" />
        {/* hiasan mangkuk */}
        <circle cx="44" cy="76" r="2.5" fill="#FFD9A0" />
        <circle cx="60" cy="80" r="2.5" fill="#FFD9A0" />
        <circle cx="76" cy="76" r="2.5" fill="#FFD9A0" />
      </svg>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const { token, user } = await api.login(username, password);
      onLogin(token, user);
    } catch (e) {
      setErr(e.message || "Username atau password salah.");
    } finally {
      setBusy(false);
    }
  };

  // Emoji yang melayang di latar
  const floaters = [
    { e: "🍜", left: "8%", top: "18%", delay: "0s", r: "-8deg" },
    { e: "🌶️", left: "84%", top: "22%", delay: "1.1s", r: "10deg" },
    { e: "🥢", left: "14%", top: "70%", delay: "0.5s", r: "6deg" },
    { e: "🍳", left: "80%", top: "68%", delay: "1.6s", r: "-6deg" },
    { e: "🥟", left: "50%", top: "10%", delay: "0.8s", r: "0deg" },
    { e: "🧅", left: "90%", top: "46%", delay: "2.0s", r: "8deg" },
  ];

  return (
    <div style={S.loginWrap} className="mj-login-bg">
      {floaters.map((f, i) => (
        <span key={i} className="mj-float-emoji" style={{ left: f.left, top: f.top, animationDelay: f.delay, "--r": f.r }}>{f.e}</span>
      ))}
      <div style={S.loginCard} className="mj-login-card">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <SteamingBowl size={92} />
          <h1 style={S.loginTitle}>Mie Jebew</h1>
          <p style={S.loginSub}>Pedasnya bikin nagih 🌶️ · Sistem Kasir Multi-Cabang</p>
        </div>
        <label style={{ ...S.label, color: "#7a5a47" }}>Username</label>
        <input className="mj-input" style={S.input} value={username} onChange={e => { setUsername(e.target.value); setErr(""); }} placeholder="Masukkan username" onKeyDown={e => e.key === "Enter" && doLogin()} />
        <label style={{ ...S.label, color: "#7a5a47" }}>Password</label>
        <input type="password" className="mj-input" style={S.input} value={password} onChange={e => { setPassword(e.target.value); setErr(""); }} placeholder="Masukkan password" onKeyDown={e => e.key === "Enter" && doLogin()} />
        {err && <p style={{ color: "#dc2626", fontSize: 13, margin: "-4px 0 10px", fontWeight: 600 }} className="mj-row-in"><i className="ti ti-alert-circle" aria-hidden="true" /> {err}</p>}
        <button className="mj-btn" style={{ ...S.btnPrimary, opacity: busy ? 0.75 : 1 }} onClick={doLogin} disabled={busy}>
          {busy ? "Memproses..." : "Masuk ke Kasir"}
        </button>
        <div style={{ marginTop: 16, padding: "10px 12px", background: "var(--mj-red-soft)", borderRadius: 12, fontSize: 12, color: "#9E241C", lineHeight: 1.6 }}>
          <strong>Akun demo:</strong><br />admin / admin123 · kasir_a / kasir123 · kasir_b / kasir123
        </div>
      </div>
    </div>
  );
}


// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ navItems, page, setPage, currentUser, userBranch, onLogout, isDrawer = false, onClose }) {
  return (
    <div style={{ ...S.sidebar, height: isDrawer ? "100vh" : undefined, boxShadow: isDrawer ? "8px 0 40px rgba(0,0,0,0.3)" : "none" }}>
      <div style={{ ...S.sidebarLogo, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 26 }}>🍜</div>
          <p style={S.sidebarLogoTitle}>Mie Jebew</p>
          <p style={S.sidebarLogoSub}>{userBranch ? userBranch.name : "Admin Pusat"}</p>
        </div>
        {isDrawer && (
          <button aria-label="Tutup menu" onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        )}
      </div>
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {navItems.map(n => (
          <div key={n.id} className="mj-nav-item" style={S.navItem(page === n.id)} onClick={() => setPage(n.id)}>
            <i className={`ti ${n.icon}`} style={{ fontSize: 19 }} aria-hidden="true" />
            <span style={S.navLabel}>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.14)" }}>
        <LiveClock style={{ padding: "6px 10px 10px", color: "white" }} />
        <div style={{ padding: "8px 10px", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "white" }}>{currentUser.full_name}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{currentUser.role === "admin" ? "Administrator" : "Kasir"}</p>
        </div>
        <div className="mj-nav-item" style={{ ...S.navItem(false), color: "#ffd7d2" }} onClick={onLogout}>
          <i className="ti ti-logout" style={{ fontSize: 19 }} aria-hidden="true" />
          <span style={S.navLabel}>Keluar</span>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ orders, expenses, branches, menuItems }) {
  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.final_amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // Sales per branch
  const branchStats = branches.filter(b => b.is_active).map(b => {
    const bOrders = completedOrders.filter(o => o.branch_id === b.id);
    return { name: b.name, revenue: bOrders.reduce((s, o) => s + o.final_amount, 0), count: bOrders.length };
  });

  // Top items
  const itemSales = {};
  completedOrders.forEach(o => o.items.forEach(it => {
    itemSales[it.menu_item_id] = (itemSales[it.menu_item_id] || 0) + it.quantity;
  }));
  const topItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, qty]) => ({
    name: menuItems.find(m => m.id === +id)?.name || "-", qty
  }));

  const recentOrders = [...completedOrders].reverse().slice(0, 5);

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Dashboard</h1>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>
      <div style={S.pageContent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
          {[
            { label: "Total Pendapatan", value: fmt(totalRevenue), icon: "ti-trending-up", color: "#166534" },
            { label: "Total Pengeluaran", value: fmt(totalExpenses), icon: "ti-trending-down", color: "#991b1b" },
            { label: "Laba Bersih", value: fmt(totalProfit), icon: "ti-chart-line", color: totalProfit >= 0 ? "#166534" : "#991b1b" },
            { label: "Total Transaksi", value: completedOrders.length, icon: "ti-receipt", color: "#1e40af" },
          ].map((s, i) => (
            <div key={i} className="mj-stat" style={S.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={S.statLabel}>{s.label}</p>
                  <p style={{ ...S.statVal, color: s.color }}>{s.value}</p>
                </div>
                <i className={`ti ${s.icon}`} style={{ fontSize: 24, color: s.color, opacity: 0.4 }} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
          <div className="mj-card" style={S.card}>
            <p style={S.sectionTitle}>Performa Per Cabang</p>
            {branchStats.map((b, i) => {
              const pct = totalRevenue ? Math.round(b.revenue / totalRevenue * 100) : 0;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{b.name.replace("Mie Jebew ", "")}</span>
                    <span>{fmt(b.revenue)} <span style={{ color: "var(--color-text-secondary)" }}>({b.count} trx)</span></span>
                  </div>
                  <div style={{ background: "var(--color-background-secondary)", borderRadius: 4, height: 8 }}>
                    <div style={{ background: "var(--mj-red)", height: 8, borderRadius: 4, width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mj-card" style={S.card}>
            <p style={S.sectionTitle}>Menu Terlaris</p>
            {topItems.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 24, height: 24, background: "var(--mj-red)", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  <span style={{ fontSize: 14 }}>{it.name}</span>
                </div>
                <span style={{ ...S.badge("info"), fontSize: 12 }}>{it.qty} porsi</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mj-card" style={S.card}>
          <p style={S.sectionTitle}>Transaksi Terbaru</p>
          <div className="mj-table-wrap"><table style={S.table}>
            <thead><tr>
              {["No. Pesanan", "Tanggal", "Cabang", "Total", "Metode", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentOrders.map(o => {
                const branch = branches.find(b => b.id === o.branch_id);
                return (
                  <tr key={o.id}>
                    <td style={S.td}><code style={{ fontSize: 12 }}>{o.order_number}</code></td>
                    <td style={S.td}>{fmtDateTime(o.order_date)}</td>
                    <td style={S.td}>{branch?.name.replace("Mie Jebew ", "")}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{fmt(o.final_amount)}</td>
                    <td style={S.td}>{o.payment ? <span style={S.badge(payBadgeType(o.payment.method))}>{payLabel(o.payment)}</span> : "—"}</td>
                    <td style={S.td}><span style={S.badge("success")}>Selesai</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}

// ─── POS ──────────────────────────────────────────────────────────────────────
function POSPage({ currentUser, menuItems, categories, branches, orders, setOrders, expenses, setExpenses, setPage, showToast, onLogout, isMobile }) {
  const [cart, setCart] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [payModal, setPayModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Kasir -> cabang sendiri. Admin -> bisa memilih cabang (default cabang aktif pertama).
  const isAdmin = currentUser.role === "admin";
  const [posBranchId, setPosBranchId] = useState(
    currentUser.branch_id || branches.find(b => b.is_active)?.id || branches[0]?.id || null
  );
  const activeBranchId = isAdmin ? posBranchId : currentUser.branch_id;

  const branchOrders = orders.filter(o => o.branch_id === activeBranchId);
  const todayStr = new Date().toDateString();
  const todayOrders = branchOrders.filter(o => new Date(o.order_date).toDateString() === todayStr && o.status === "completed");
  const todayRevenue = todayOrders.reduce((s, o) => s + o.final_amount, 0);

  // Pengeluaran hari ini (cabang aktif).
  const todayExpenses = (expenses || []).filter(e => e.branch_id === activeBranchId && new Date(e.expense_date).toDateString() === todayStr);
  const todayExpenseTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const filteredItems = menuItems.filter(m => {
    const catMatch = !activeCategory || m.category_id === activeCategory;
    const searchMatch = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase());
    return catMatch && searchMatch;
  });

  const addToCart = (item) => {
    if (!item.is_available) return;
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id);
      if (existing) return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.price_per_item } : c);
      return [...prev, { id: Date.now(), menu_item_id: item.id, name: item.name, price_per_item: item.price, quantity: 1, subtotal: item.price, notes: "" }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, quantity: c.quantity + delta, subtotal: (c.quantity + delta) * c.price_per_item } : c);
      return updated.filter(c => c.quantity > 0);
    });
  };

  const totalAmount = cart.reduce((s, c) => s + c.subtotal, 0);
  const discountAmt = Math.round(totalAmount * (discount / 100));
  const finalAmount = totalAmount - discountAmt;

  const clearCart = () => { setCart([]); setDiscount(0); };

  const handleOrder = async (paymentData) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        items: cart.map(c => ({ menu_item_id: c.menu_item_id, quantity: c.quantity, notes: c.notes || "" })),
        discount_amount: discountAmt,
        payment: { method: paymentData.method, amount_paid: paymentData.amount_paid },
      };
      if (isAdmin) payload.branch_id = posBranchId;

      const savedOrder = await api.createOrder(payload);
      setOrders(prev => [savedOrder, ...prev]);
      setPayModal(false);
      setReceiptModal(savedOrder);
      clearCart();
      setCartOpen(false);
      showToast("Transaksi berhasil disimpan!");
    } catch (e) {
      showToast(e.message || "Gagal menyimpan transaksi.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const branch = branches.find(b => b.id === activeBranchId);

  // Simpan pengeluaran cepat dari layar kasir (otomatis tanggal hari ini & cabang aktif).
  const saveExpense = async ({ description, amount, category }) => {
    try {
      const created = await api.createExpense({
        branch_id: activeBranchId,
        expense_date: new Date().toISOString().slice(0, 10),
        description,
        amount: +amount,
        category: category || null,
      });
      setExpenses(prev => [created, ...prev]);
      setExpenseModal(false);
      showToast("Pengeluaran berhasil dicatat!");
    } catch (e) {
      showToast(e.message || "Gagal menyimpan pengeluaran.", "danger");
    }
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div style={{ ...S.posLayout, flexDirection: isMobile ? "column" : "row" }}>
      {/* Menu Section */}
      <div style={{ ...S.posMenu, paddingBottom: isMobile ? 96 : "1rem" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: 10, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: "var(--mj-red)" }}>🍜 {branch?.name}</p>
            {isAdmin ? (
              <select
                value={posBranchId || ""}
                onChange={e => setPosBranchId(+e.target.value)}
                style={{ marginTop: 4, padding: "4px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
              >
                {branches.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{currentUser.full_name}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <LiveClock style={{ textAlign: "right", color: "var(--mj-red)", marginRight: 4 }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Masuk Hari Ini</p>
              <p style={{ margin: 0, fontWeight: 800, color: "#166534", fontSize: 15, fontFamily: FONT_DISPLAY }}>{fmt(todayRevenue)}</p>
            </div>
            <div style={{ textAlign: "right", marginRight: 4 }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Keluar Hari Ini</p>
              <p style={{ margin: 0, fontWeight: 800, color: "#991b1b", fontSize: 15, fontFamily: FONT_DISPLAY }}>{fmt(todayExpenseTotal)}</p>
            </div>
            <button className="mj-btn" style={{ ...S.btn("ghost"), color: "#991b1b" }} onClick={() => setExpenseModal(true)} title="Catat pengeluaran"><i className="ti ti-cash" aria-hidden="true" />{!isMobile && " Pengeluaran"}</button>
            <button className="mj-btn" style={S.btn("ghost")} onClick={() => setPage("orders")} title="Riwayat transaksi"><i className="ti ti-receipt" aria-hidden="true" /></button>
            {currentUser.role === "admin" && <button className="mj-btn" style={S.btn("ghost")} onClick={() => setPage("dashboard")} title="Dashboard"><i className="ti ti-layout-dashboard" aria-hidden="true" /></button>}
            <button className="mj-btn" style={{ ...S.btn("ghost"), color: "#991b1b" }} onClick={onLogout} title="Keluar"><i className="ti ti-logout" aria-hidden="true" /></button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "0.75rem" }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)", fontSize: 16 }} aria-hidden="true" />
          <input style={{ ...S.formInput, paddingLeft: 36, marginBottom: 0 }} placeholder="Cari menu..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span style={activeCategory === null ? S.activeTag : S.tag} onClick={() => setActiveCategory(null)}>Semua</span>
          {categories.map(c => <span key={c.id} style={activeCategory === c.id ? S.activeTag : S.tag} onClick={() => setActiveCategory(c.id)}>{c.name}</span>)}
        </div>

        {/* Menu Grid */}
        <div style={S.menuGrid}>
          {filteredItems.map(item => {
            const inCart = cart.find(c => c.menu_item_id === item.id);
            return (
            <div key={item.id} className={item.is_available ? "mj-menu-card" : ""} style={S.menuCard(item.is_available)} onClick={() => addToCart(item)}>
              <div className="mj-menu-emoji" style={{ fontSize: 34, marginBottom: 6, textAlign: "center", display: "inline-block", width: "100%" }}>
                {emojiForCategory(categories, item.category_id)}
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{item.name}</p>
              <p style={{ margin: 0, fontSize: 14, color: "var(--mj-red)", fontWeight: 800, fontFamily: FONT_DISPLAY }}>{fmt(item.price)}</p>
              {!item.is_available && <span style={{ ...S.badge("danger"), fontSize: 10, marginTop: 4 }}>Habis</span>}
              {inCart && (
                <div className="mj-row-in" style={{ position: "absolute", top: 8, right: 8, background: "linear-gradient(135deg,var(--mj-red),var(--mj-red-deep))", color: "white", borderRadius: "50%", width: 24, height: 24, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(200,54,44,0.4)" }}>
                  {inCart.quantity}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Overlay keranjang (mobile) */}
      {isMobile && cartOpen && <div className="mj-overlay" style={{ position: "fixed", inset: 0, background: "rgba(44,27,20,0.5)", zIndex: 1400 }} onClick={() => setCartOpen(false)} />}

      {/* Cart Section */}
      <div style={isMobile
        ? { position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "85vh", zIndex: 1500, background: "var(--color-background-primary)", display: "flex", flexDirection: "column", borderRadius: "22px 22px 0 0", boxShadow: "0 -12px 40px rgba(44,27,20,0.28)", transform: cartOpen ? "translateY(0)" : "translateY(110%)", transition: "transform .3s cubic-bezier(.18,.89,.32,1.1)" }
        : S.posCart}>
        {isMobile && (
          <div style={{ padding: "8px 0 0", display: "flex", justifyContent: "center" }}>
            <div onClick={() => setCartOpen(false)} style={{ width: 44, height: 5, borderRadius: 5, background: "#e0cdbd", cursor: "pointer" }} />
          </div>
        )}
        <div style={S.posCartHeader}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><i className="ti ti-shopping-cart" aria-hidden="true" /> Keranjang ({cartCount})</span>
            {cart.length > 0 && <button className="mj-btn" style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12, color: "#991b1b" }} onClick={clearCart}>Hapus Semua</button>}
          </div>
        </div>

        <div style={S.posCartItems}>
          {cart.length === 0
            ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
              <i className="ti ti-shopping-cart-off" style={{ fontSize: 36, display: "block", marginBottom: 8 }} aria-hidden="true" />
              <p style={{ fontSize: 13, margin: 0 }}>Keranjang kosong</p>
            </div>
            : cart.map(item => (
              <div key={item.id} style={S.cartItem}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{fmt(item.price_per_item)} × {item.quantity}</p>
                  <input placeholder="Catatan..." value={item.notes} onChange={e => setCart(prev => prev.map(c => c.id === item.id ? { ...c, notes: e.target.value } : c))}
                    style={{ marginTop: 4, width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid var(--color-border-tertiary)", borderRadius: 5, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{fmt(item.subtotal)}</p>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={S.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                    <span style={{ width: 20, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                    <button style={S.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div style={S.posCartFooter}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>Subtotal</span><span>{fmt(totalAmount)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>Diskon (%)</span>
              <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Math.min(100, Math.max(0, +e.target.value)))}
                style={{ width: 60, padding: "4px 6px", border: "1px solid var(--color-border-tertiary)", borderRadius: 6, fontSize: 13, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }} />
              <span style={{ fontSize: 13, color: "#991b1b" }}>−{fmt(discountAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, padding: "8px 0", borderTop: "1px solid var(--color-border-tertiary)" }}>
              <span>Total</span><span style={{ color: "var(--mj-red)", fontFamily: FONT_DISPLAY }}>{fmt(finalAmount)}</span>
            </div>
          </div>
          <button className="mj-btn" style={{ ...S.btn("primary"), width: "100%", padding: "13px", fontSize: 15.5, justifyContent: "center", opacity: cart.length === 0 ? 0.5 : 1 }} disabled={cart.length === 0} onClick={() => setPayModal(true)}>
            <i className="ti ti-credit-card" aria-hidden="true" /> Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Bar ringkasan keranjang menempel di bawah (mobile) */}
      {isMobile && !cartOpen && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300, padding: "10px 14px", background: "var(--color-background-primary)", borderTop: "1px solid var(--color-border-tertiary)", boxShadow: "0 -6px 20px rgba(44,27,20,0.12)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{cartCount} item</p>
            <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 800, color: "var(--mj-red)" }}>{fmt(finalAmount)}</p>
          </div>
          <button className="mj-btn" style={{ ...S.btn("primary"), padding: "12px 20px", fontSize: 15, opacity: cart.length === 0 ? 0.5 : 1 }} disabled={cart.length === 0} onClick={() => setCartOpen(true)}>
            <i className="ti ti-shopping-cart" aria-hidden="true" /> Lihat Keranjang
          </button>
        </div>
      )}

      {payModal && <PaymentModal total={finalAmount} onClose={() => setPayModal(false)} onConfirm={handleOrder} />}
      {receiptModal && <ReceiptModal order={receiptModal} branch={branches.find(b => b.id === receiptModal.branch_id)} menuItems={menuItems} onClose={() => setReceiptModal(null)} />}
      {expenseModal && <QuickExpenseModal branchName={branch?.name} todayTotal={todayExpenseTotal} todayExpenses={todayExpenses} onClose={() => setExpenseModal(false)} onSave={saveExpense} />}
    </div>
  );
}

// ─── QUICK EXPENSE MODAL (Pengeluaran dari layar Kasir) ──────────────────────
function QuickExpenseModal({ branchName, todayTotal, todayExpenses, onClose, onSave }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!description || !amount || busy) return;
    setBusy(true);
    await onSave({ description, amount, category });
    setBusy(false);
  };

  return (
    <div className="mj-overlay" style={S.overlay} onClick={onClose}>
      <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={S.modalTitle}>Catat Pengeluaran Harian</h2>
          <button style={S.btn("ghost")} onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--color-text-secondary)" }}>
          {branchName} · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <label style={S.label}>Deskripsi *</label>
        <input style={S.formInput} value={description} onChange={e => setDescription(e.target.value)} placeholder="cth: Beli es batu, gas, dll" onKeyDown={e => e.key === "Enter" && submit()} />

        <label style={S.label}>Kategori</label>
        <select style={S.select} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Pilih kategori...</option>
          {["Bahan Baku", "Listrik", "Air", "Gaji", "Sewa", "Peralatan", "Lainnya"].map(c => <option key={c}>{c}</option>)}
        </select>

        <label style={S.label}>Jumlah (Rp) *</label>
        <input type="number" style={S.formInput} value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" onKeyDown={e => e.key === "Enter" && submit()} />

        {todayExpenses.length > 0 && (
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <span>Pengeluaran hari ini</span><span style={{ color: "#991b1b" }}>{fmt(todayTotal)}</span>
            </div>
            {todayExpenses.slice(0, 4).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0", color: "var(--color-text-secondary)" }}>
                <span>{e.description}</span><span>{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn("outline"), flex: 1 }} onClick={onClose}>Batal</button>
          <button style={{ ...S.btn("danger"), flex: 2, opacity: (!description || !amount || busy) ? 0.5 : 1 }} disabled={!description || !amount || busy} onClick={submit}>
            {busy ? "Menyimpan..." : "Simpan Pengeluaran"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────
function PaymentModal({ total, onClose, onConfirm }) {
  const [method, setMethod] = useState("cash");
  const [paid, setPaid] = useState(total);
  const change = method === "cash" ? Math.max(0, paid - total) : 0;

  return (
    <div className="mj-overlay" style={S.overlay} onClick={onClose}>
      <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
        <h2 style={S.modalTitle}>💳 Proses Pembayaran</h2>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Total yang Harus Dibayar</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "var(--mj-red)" }}>{fmt(total)}</p>
        </div>
        <label style={S.label}>Metode Pembayaran</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ v: "cash", label: "💵 Tunai" }, { v: "card", label: "💳 Kartu" }, { v: "qris", label: "📱 QRIS" }].map(m => (
            <button key={m.v} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${method === m.v ? "var(--mj-red)" : "var(--color-border-tertiary)"}`, background: method === m.v ? "var(--mj-red-soft)" : "var(--color-background-secondary)", cursor: "pointer", fontWeight: method === m.v ? 700 : 400, fontSize: 13 }} onClick={() => setMethod(m.v)}>
              {m.label}
            </button>
          ))}
        </div>
        {method === "cash" && (
          <>
            <label style={S.label}>Jumlah Dibayar</label>
            <input type="number" style={S.formInput} value={paid} onChange={e => setPaid(+e.target.value)} min={total} />
            <div style={{ background: "#dcfce7", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#166534" }}>Kembalian: </span>
              <strong style={{ fontSize: 16, color: "#166534" }}>{fmt(change)}</strong>
            </div>
          </>
        )}
        {method !== "cash" && (
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
              {method === "qris" ? "Scan QR Code untuk pembayaran digital" : "Geser atau masukkan kartu ke mesin EDC"}
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn("outline"), flex: 1 }} onClick={onClose}>Batal</button>
          <button style={{ ...S.btn("success"), flex: 2, opacity: (method === "cash" && paid < total) ? 0.5 : 1 }}
            disabled={method === "cash" && paid < total}
            onClick={() => onConfirm({ method, amount_paid: method === "cash" ? paid : total, change_given: change, status: "success" })}>
            ✓ Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECEIPT MODAL ────────────────────────────────────────────────────────────
function ReceiptModal({ order, branch, menuItems, onClose }) {
  return (
    <div className="mj-overlay" style={S.overlay} onClick={onClose}>
      <div className="mj-modal" style={{ ...S.modal, maxWidth: 340, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>🍜 MIE JEBEW</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0" }}>{branch?.name}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{branch?.address}</p>
          <div style={{ borderTop: "1px dashed var(--color-border-secondary)", margin: "10px 0" }} />
          <p style={{ fontSize: 11, margin: "2px 0" }}>No: <strong>{order.order_number}</strong></p>
          <p style={{ fontSize: 11, margin: 0 }}>{fmtDateTime(order.order_date)}</p>
          <div style={{ borderTop: "1px dashed var(--color-border-secondary)", margin: "10px 0" }} />
        </div>
        {order.items.map((it, i) => {
          const menu = menuItems.find(m => m.id === it.menu_item_id);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <div>
                <span>{menu?.name}</span>
                {it.notes && <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>  *{it.notes}</p>}
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>  {it.quantity} × {fmt(it.price_per_item)}</p>
              </div>
              <span style={{ fontWeight: 600 }}>{fmt(it.subtotal)}</span>
            </div>
          );
        })}
        <div style={{ borderTop: "1px dashed var(--color-border-secondary)", margin: "10px 0" }} />
        <div style={{ fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span>Subtotal</span><span>{fmt(order.total_amount)}</span></div>
          {order.discount_amount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, color: "#991b1b" }}><span>Diskon</span><span>−{fmt(order.discount_amount)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginBottom: 4 }}><span>TOTAL</span><span>{fmt(order.final_amount)}</span></div>
          {order.payment && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Dibayar ({payLabel(order.payment)})</span><span>{fmt(order.payment.amount_paid)}</span></div>}
          {order.payment && order.payment.change_given > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Kembalian</span><span>{fmt(order.payment.change_given)}</span></div>}
        </div>
        <div style={{ borderTop: "1px dashed var(--color-border-secondary)", margin: "10px 0", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>Terima kasih sudah mampir!</p>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Selamat menikmati 🍜</p>
        </div>
        <button style={{ ...S.btn("primary"), width: "100%", marginTop: 8 }} onClick={onClose}>✓ Tutup Struk</button>
      </div>
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersPage({ orders, branches, users, menuItems, currentUser, showToast }) {
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailOrder, setDetailOrder] = useState(null);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchBranch = !filterBranch || o.branch_id === +filterBranch;
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  }).sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Transaksi</h1>
        <span style={{ ...S.badge("info") }}>{filtered.length} transaksi</span>
      </div>
      <div style={S.pageContent}>
        <div style={{ ...S.row, marginBottom: "1rem", flexWrap: "wrap" }}>
          <input placeholder="Cari no. pesanan..." style={{ ...S.formInput, marginBottom: 0, width: 220 }} value={search} onChange={e => setSearch(e.target.value)} />
          {currentUser.role === "admin" && (
            <select style={{ ...S.select, marginBottom: 0, width: 180 }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name.replace("Mie Jebew ", "")}</option>)}
            </select>
          )}
          <select style={{ ...S.select, marginBottom: 0, width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
        <div className="mj-card" style={S.card}>
          <div className="mj-table-wrap"><table style={S.table}>
            <thead><tr>
              {["No. Pesanan", "Tanggal", "Kasir", currentUser.role === "admin" && "Cabang", "Total", "Metode", "Status", "Aksi"].filter(Boolean).map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(o => {
                const cashier = users.find(u => u.id === o.cashier_id);
                const branch = branches.find(b => b.id === o.branch_id);
                return (
                  <tr key={o.id}>
                    <td style={S.td}><code style={{ fontSize: 12 }}>{o.order_number}</code></td>
                    <td style={S.td}>{fmtDateTime(o.order_date)}</td>
                    <td style={S.td}>{cashier?.full_name}</td>
                    {currentUser.role === "admin" && <td style={S.td}>{branch?.name.replace("Mie Jebew ", "")}</td>}
                    <td style={{ ...S.td, fontWeight: 600 }}>{fmt(o.final_amount)}</td>
                    <td style={S.td}>{o.payment ? <span style={S.badge(payBadgeType(o.payment.method))}>{payLabel(o.payment)}</span> : <span style={{ color: "var(--color-text-secondary)" }}>—</span>}</td>
                    <td style={S.td}><span style={S.badge(o.status === "completed" ? "success" : o.status === "cancelled" ? "danger" : "warning")}>{o.status === "completed" ? "Selesai" : o.status === "cancelled" ? "Batal" : "Pending"}</span></td>
                    <td style={S.td}><button style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12 }} onClick={() => setDetailOrder(o)}>Detail</button></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "var(--color-text-secondary)", padding: "2rem" }}>Tidak ada transaksi ditemukan</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
      {detailOrder && <OrderDetailModal order={detailOrder} menuItems={menuItems} branches={branches} users={users} onClose={() => setDetailOrder(null)} />}
    </div>
  );
}

function OrderDetailModal({ order, menuItems, branches, users, onClose }) {
  const branch = branches.find(b => b.id === order.branch_id);
  const cashier = users.find(u => u.id === order.cashier_id);
  return (
    <div className="mj-overlay" style={S.overlay} onClick={onClose}>
      <div className="mj-modal" style={{ ...S.modal, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={S.modalTitle}>Detail Pesanan</h2>
          <button style={S.btn("ghost")} onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13 }}>
          <div><span style={{ color: "var(--color-text-secondary)" }}>No. Pesanan:</span><br /><strong>{order.order_number}</strong></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>Tanggal:</span><br /><strong>{fmtDateTime(order.order_date)}</strong></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>Cabang:</span><br /><strong>{branch?.name}</strong></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>Kasir:</span><br /><strong>{cashier?.full_name}</strong></div>
        </div>
        <div className="mj-table-wrap"><table style={S.table}>
          <thead><tr>
            {["Menu", "Qty", "Harga", "Subtotal"].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {order.items.map((it, i) => {
              const menu = menuItems.find(m => m.id === it.menu_item_id);
              return (
                <tr key={i}>
                  <td style={S.td}>{menu?.name}{it.notes && <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{it.notes}</p>}</td>
                  <td style={S.td}>{it.quantity}</td>
                  <td style={S.td}>{fmt(it.price_per_item)}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmt(it.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <div style={{ padding: "0.75rem 0", fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Subtotal</span><span>{fmt(order.total_amount)}</span></div>
          {order.discount_amount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#991b1b" }}><span>Diskon</span><span>−{fmt(order.discount_amount)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, padding: "8px 0", borderTop: "1px solid var(--color-border-tertiary)" }}><span>Total</span><span>{fmt(order.final_amount)}</span></div>
          {order.payment ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Metode: <span style={S.badge(payBadgeType(order.payment.method))}>{payLabel(order.payment)}</span></span><span>Dibayar: {fmt(order.payment.amount_paid)}</span></div>
              {order.payment.change_given > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span>Kembalian</span><span>{fmt(order.payment.change_given)}</span></div>}
            </>
          ) : (
            <div style={{ color: "var(--color-text-secondary)" }}>Belum ada pembayaran</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MENU MANAGEMENT ─────────────────────────────────────────────────────────
function MenuPage({ menuItems, setMenuItems, categories, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [form, setForm] = useState({ category_id: 1, name: "", description: "", price: "", is_available: true });

  const filtered = activeCategory ? menuItems.filter(m => m.category_id === activeCategory) : menuItems;

  const openAdd = () => { setEditing(null); setForm({ category_id: categories[0]?.id || 1, name: "", description: "", price: "", is_available: true }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setShowModal(true); };

  const save = async () => {
    if (!form.name || form.price === "" || form.price === null) return;
    const payload = {
      category_id: +form.category_id,
      name: form.name,
      description: form.description || null,
      price: +form.price,
      is_available: !!form.is_available,
    };
    try {
      if (editing) {
        const updated = await api.updateMenu(editing.id, payload);
        setMenuItems(prev => prev.map(m => m.id === editing.id ? updated : m));
        showToast("Menu berhasil diperbarui!");
      } else {
        const created = await api.createMenu(payload);
        setMenuItems(prev => [...prev, created]);
        showToast("Menu berhasil ditambahkan!");
      }
      setShowModal(false);
    } catch (e) {
      showToast(e.message || "Gagal menyimpan menu.", "danger");
    }
  };

  const toggleAvail = async (id) => {
    try {
      const updated = await api.toggleMenu(id);
      setMenuItems(prev => prev.map(m => m.id === id ? updated : m));
      showToast("Status menu diperbarui!");
    } catch (e) {
      showToast(e.message || "Gagal memperbarui status.", "danger");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Hapus menu ini?")) return;
    try {
      await api.deleteMenu(id);
      setMenuItems(prev => prev.filter(m => m.id !== id));
      showToast("Menu dihapus!", "danger");
    } catch (e) {
      showToast(e.message || "Gagal menghapus menu.", "danger");
    }
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Manajemen Menu</h1>
        <button style={S.btn("primary")} onClick={openAdd}><i className="ti ti-plus" aria-hidden="true" /> Tambah Menu</button>
      </div>
      <div style={S.pageContent}>
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={activeCategory === null ? S.activeTag : S.tag} onClick={() => setActiveCategory(null)}>Semua ({menuItems.length})</span>
          {categories.map(c => <span key={c.id} style={activeCategory === c.id ? S.activeTag : S.tag} onClick={() => setActiveCategory(c.id)}>{c.name} ({menuItems.filter(m => m.category_id === c.id).length})</span>)}
        </div>
        <div className="mj-card" style={S.card}>
          <div className="mj-table-wrap"><table style={S.table}>
            <thead><tr>
              {["Menu", "Kategori", "Harga", "Status", "Aksi"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={S.td}>
                    <p style={{ margin: "0 0 2px", fontWeight: 600 }}>{item.name}</p>
                    {item.description && <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{item.description}</p>}
                  </td>
                  <td style={S.td}>{categories.find(c => c.id === item.category_id)?.name}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmt(item.price)}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge(item.is_available ? "success" : "danger"), cursor: "pointer" }} onClick={() => toggleAvail(item.id)}>
                      {item.is_available ? "Tersedia" : "Habis"}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12 }} onClick={() => openEdit(item)}>Edit</button>
                      <button style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12, color: "#991b1b" }} onClick={() => deleteItem(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
      {showModal && (
        <div className="mj-overlay" style={S.overlay} onClick={() => setShowModal(false)}>
          <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>{editing ? "Edit Menu" : "Tambah Menu Baru"}</h2>
            <label style={S.label}>Kategori</label>
            <select style={S.select} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: +e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label style={S.label}>Nama Menu *</label>
            <input style={S.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="cth: Mie Ayam Original" />
            <label style={S.label}>Deskripsi</label>
            <textarea style={{ ...S.formInput, height: 70, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat..." />
            <label style={S.label}>Harga (Rp) *</label>
            <input type="number" style={S.formInput} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
              Tersedia / Aktif
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("outline"), flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
              <button style={{ ...S.btn("primary"), flex: 2 }} onClick={save}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
function ExpensesPage({ expenses, setExpenses, branches, currentUser, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [filterBranch, setFilterBranch] = useState("");
  const defaultBranch = currentUser.branch_id || branches.find(b => b.is_active)?.id || branches[0]?.id || 1;
  const [form, setForm] = useState({ branch_id: defaultBranch, expense_date: new Date().toISOString().slice(0, 10), description: "", amount: "", category: "" });

  const filtered = expenses.filter(e => !filterBranch || e.branch_id === +filterBranch).sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const save = async () => {
    if (!form.description || !form.amount) return;
    const payload = {
      branch_id: +form.branch_id,
      expense_date: form.expense_date,
      description: form.description,
      amount: +form.amount,
      category: form.category || null,
    };
    try {
      const created = await api.createExpense(payload);
      setExpenses(prev => [created, ...prev]);
      showToast("Pengeluaran berhasil disimpan!");
      setShowModal(false);
      setForm({ branch_id: defaultBranch, expense_date: new Date().toISOString().slice(0, 10), description: "", amount: "", category: "" });
    } catch (e) {
      showToast(e.message || "Gagal menyimpan pengeluaran.", "danger");
    }
  };

  const deleteExp = async (id) => {
    if (!window.confirm("Hapus pengeluaran ini?")) return;
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast("Pengeluaran dihapus!", "danger");
    } catch (e) {
      showToast(e.message || "Gagal menghapus.", "danger");
    }
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Pengeluaran Operasional</h1>
        <button style={S.btn("primary")} onClick={() => setShowModal(true)}><i className="ti ti-plus" aria-hidden="true" /> Tambah Pengeluaran</button>
      </div>
      <div style={S.pageContent}>
        <div style={{ ...S.row, marginBottom: "1rem" }}>
          {currentUser.role === "admin" && (
            <select style={{ ...S.select, marginBottom: 0, width: 200 }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name.replace("Mie Jebew ", "")}</option>)}
            </select>
          )}
          <div style={{ ...S.statCard, marginLeft: "auto", padding: "8px 16px" }}>
            <p style={S.statLabel}>Total Pengeluaran (Filter)</p>
            <p style={{ ...S.statVal, fontSize: 18, color: "#991b1b" }}>{fmt(totalFiltered)}</p>
          </div>
        </div>
        <div className="mj-card" style={S.card}>
          <div className="mj-table-wrap"><table style={S.table}>
            <thead><tr>
              {["Tanggal", "Cabang", "Deskripsi", "Kategori", "Jumlah", "Aksi"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={S.td}>{fmtDate(e.expense_date)}</td>
                  <td style={S.td}>{branches.find(b => b.id === e.branch_id)?.name.replace("Mie Jebew ", "")}</td>
                  <td style={S.td}>{e.description}</td>
                  <td style={S.td}><span style={S.badge("warning")}>{e.category || "Lainnya"}</span></td>
                  <td style={{ ...S.td, fontWeight: 600, color: "#991b1b" }}>{fmt(e.amount)}</td>
                  <td style={S.td}><button style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12, color: "#991b1b" }} onClick={() => deleteExp(e.id)}>Hapus</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--color-text-secondary)", padding: "2rem" }}>Belum ada pengeluaran</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
      {showModal && (
        <div className="mj-overlay" style={S.overlay} onClick={() => setShowModal(false)}>
          <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>Tambah Pengeluaran</h2>
            {currentUser.role === "admin" && (
              <>
                <label style={S.label}>Cabang</label>
                <select style={S.select} value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: +e.target.value }))}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}
            <label style={S.label}>Tanggal</label>
            <input type="date" style={S.formInput} value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
            <label style={S.label}>Deskripsi *</label>
            <input style={S.formInput} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Keterangan pengeluaran..." />
            <label style={S.label}>Kategori</label>
            <select style={S.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Pilih kategori...</option>
              {["Bahan Baku", "Listrik", "Air", "Gaji", "Sewa", "Peralatan", "Lainnya"].map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={S.label}>Jumlah (Rp) *</label>
            <input type="number" style={S.formInput} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500000" />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("outline"), flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
              <button style={{ ...S.btn("primary"), flex: 2 }} onClick={save}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BRANCHES ─────────────────────────────────────────────────────────────────
function BranchesPage({ branches, setBranches, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone_number: "", is_active: true });

  const openAdd = () => { setEditing(null); setForm({ name: "", address: "", phone_number: "", is_active: true }); setShowModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ ...b }); setShowModal(true); };

  const save = async () => {
    if (!form.name) return;
    const payload = {
      name: form.name,
      address: form.address || null,
      phone_number: form.phone_number || null,
      is_active: !!form.is_active,
    };
    try {
      if (editing) {
        const updated = await api.updateBranch(editing.id, payload);
        setBranches(prev => prev.map(b => b.id === editing.id ? updated : b));
        showToast("Cabang berhasil diperbarui!");
      } else {
        const created = await api.createBranch(payload);
        setBranches(prev => [...prev, created]);
        showToast("Cabang berhasil ditambahkan!");
      }
      setShowModal(false);
    } catch (e) {
      showToast(e.message || "Gagal menyimpan cabang.", "danger");
    }
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Manajemen Cabang</h1>
        <button style={S.btn("primary")} onClick={openAdd}><i className="ti ti-plus" aria-hidden="true" /> Tambah Cabang</button>
      </div>
      <div style={S.pageContent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
          {branches.map(b => (
            <div key={b.id} style={{ ...S.card, borderLeft: `4px solid ${b.is_active ? "var(--mj-red)" : "#d1d5db"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{b.name}</h3>
                <span style={S.badge(b.is_active ? "success" : "gray")}>{b.is_active ? "Aktif" : "Nonaktif"}</span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-secondary)" }}><i className="ti ti-map-pin" aria-hidden="true" /> {b.address}</p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-secondary)" }}><i className="ti ti-phone" aria-hidden="true" /> {b.phone_number}</p>
              <button style={{ ...S.btn("outline"), fontSize: 12, padding: "6px 14px" }} onClick={() => openEdit(b)}>Edit Cabang</button>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className="mj-overlay" style={S.overlay} onClick={() => setShowModal(false)}>
          <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>{editing ? "Edit Cabang" : "Tambah Cabang Baru"}</h2>
            <label style={S.label}>Nama Cabang *</label>
            <input style={S.formInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="cth: Mie Jebew Cabang D" />
            <label style={S.label}>Alamat</label>
            <textarea style={{ ...S.formInput, height: 70, resize: "vertical" }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <label style={S.label}>No. Telepon</label>
            <input style={S.formInput} value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="021-xxxxxxx" />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Cabang Aktif
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("outline"), flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
              <button style={{ ...S.btn("primary"), flex: 2 }} onClick={save}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function UsersPage({ users, setUsers, branches, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", full_name: "", role: "cashier", branch_id: "", is_active: true });

  const openAdd = () => { setEditing(null); setForm({ username: "", password: "", full_name: "", role: "cashier", branch_id: "", is_active: true }); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: "" }); setShowModal(true); };

  const save = async () => {
    if (!form.username || !form.full_name) return;
    if (!editing && !form.password) { showToast("Password wajib diisi untuk pengguna baru.", "danger"); return; }
    if (form.role === "cashier" && !form.branch_id) { showToast("Kasir wajib memiliki cabang.", "danger"); return; }

    const payload = {
      username: form.username,
      full_name: form.full_name,
      role: form.role,
      branch_id: form.branch_id ? +form.branch_id : null,
      is_active: !!form.is_active,
    };
    if (form.password) payload.password = form.password;

    try {
      if (editing) {
        const updated = await api.updateUser(editing.id, payload);
        setUsers(prev => prev.map(u => u.id === editing.id ? updated : u));
        showToast("Pengguna berhasil diperbarui!");
      } else {
        const created = await api.createUser(payload);
        setUsers(prev => [...prev, created]);
        showToast("Pengguna berhasil ditambahkan!");
      }
      setShowModal(false);
    } catch (e) {
      showToast(e.message || "Gagal menyimpan pengguna.", "danger");
    }
  };

  const toggleActive = async (u) => {
    try {
      const updated = await api.updateUser(u.id, {
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        branch_id: u.branch_id || null,
        is_active: !u.is_active,
      });
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      showToast("Status pengguna diperbarui!");
    } catch (e) {
      showToast(e.message || "Gagal memperbarui status.", "danger");
    }
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Manajemen Pengguna</h1>
        <button style={S.btn("primary")} onClick={openAdd}><i className="ti ti-plus" aria-hidden="true" /> Tambah Pengguna</button>
      </div>
      <div style={S.pageContent}>
        <div className="mj-card" style={S.card}>
          <div className="mj-table-wrap"><table style={S.table}>
            <thead><tr>
              {["Nama Lengkap", "Username", "Peran", "Cabang", "Status", "Aksi"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={S.td}><span style={{ fontWeight: 600 }}>{u.full_name}</span></td>
                  <td style={S.td}><code style={{ fontSize: 13 }}>{u.username}</code></td>
                  <td style={S.td}><span style={S.badge(u.role === "admin" ? "info" : "gray")}>{u.role === "admin" ? "Admin" : "Kasir"}</span></td>
                  <td style={S.td}>{u.branch_id ? branches.find(b => b.id === u.branch_id)?.name.replace("Mie Jebew ", "") : <span style={{ color: "var(--color-text-secondary)" }}>Semua Cabang</span>}</td>
                  <td style={S.td}><span style={{ ...S.badge(u.is_active ? "success" : "danger"), cursor: "pointer" }} onClick={() => toggleActive(u)}>{u.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  <td style={S.td}><button style={{ ...S.btn("ghost"), padding: "4px 10px", fontSize: 12 }} onClick={() => openEdit(u)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
      {showModal && (
        <div className="mj-overlay" style={S.overlay} onClick={() => setShowModal(false)}>
          <div className="mj-modal" style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>{editing ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h2>
            <label style={S.label}>Nama Lengkap *</label>
            <input style={S.formInput} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <label style={S.label}>Username *</label>
            <input style={S.formInput} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            <label style={S.label}>Password {editing ? "(kosongkan jika tidak diubah)" : "*"}</label>
            <input type="password" style={S.formInput} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <label style={S.label}>Peran</label>
            <select style={S.select} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="cashier">Kasir</option>
              <option value="admin">Admin</option>
            </select>
            <label style={S.label}>Cabang {form.role === "admin" ? "(opsional)" : "*"}</label>
            <select style={S.select} value={form.branch_id || ""} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value || null }))}>
              <option value="">-- Semua Cabang (Admin) --</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Akun Aktif
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("outline"), flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
              <button style={{ ...S.btn("primary"), flex: 2 }} onClick={save}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsPage({ orders, expenses, branches, menuItems }) {
  const [reportType, setReportType] = useState("sales");
  const [filterBranch, setFilterBranch] = useState("");

  const completedOrders = orders.filter(o => o.status === "completed" && (!filterBranch || o.branch_id === +filterBranch));
  const filteredExpenses = expenses.filter(e => !filterBranch || e.branch_id === +filterBranch);

  const totalRevenue = completedOrders.reduce((s, o) => s + o.final_amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // By branch
  const branchReport = branches.map(b => {
    const bOrders = completedOrders.filter(o => o.branch_id === b.id);
    const bExpenses = filteredExpenses.filter(e => e.branch_id === b.id);
    const rev = bOrders.reduce((s, o) => s + o.final_amount, 0);
    const exp = bExpenses.reduce((s, e) => s + e.amount, 0);
    return { ...b, revenue: rev, expenses: exp, profit: rev - exp, transactions: bOrders.length };
  });

  // Item sales
  const itemSales = {};
  completedOrders.forEach(o => o.items.forEach(it => {
    if (!itemSales[it.menu_item_id]) itemSales[it.menu_item_id] = { qty: 0, revenue: 0 };
    itemSales[it.menu_item_id].qty += it.quantity;
    itemSales[it.menu_item_id].revenue += it.subtotal;
  }));
  const topItems = Object.entries(itemSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10).map(([id, d]) => ({
    name: menuItems.find(m => m.id === +id)?.name || "-", ...d
  }));

  // Expense by category
  const expCat = {};
  filteredExpenses.forEach(e => { expCat[e.category || "Lainnya"] = (expCat[e.category || "Lainnya"] || 0) + e.amount; });

  // Payment method distribution
  const payMethods = {};
  completedOrders.forEach(o => { if (o.payment) payMethods[o.payment.method] = (payMethods[o.payment.method] || 0) + 1; });

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Laporan Keuangan</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...S.select, marginBottom: 0, width: 180 }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name.replace("Mie Jebew ", "")}</option>)}
          </select>
        </div>
      </div>
      <div style={S.pageContent}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
          <div style={S.statCard}><p style={S.statLabel}>Total Pendapatan</p><p style={{ ...S.statVal, color: "#166534" }}>{fmt(totalRevenue)}</p><p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{completedOrders.length} transaksi</p></div>
          <div style={S.statCard}><p style={S.statLabel}>Total Pengeluaran</p><p style={{ ...S.statVal, color: "#991b1b" }}>{fmt(totalExpenses)}</p><p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{filteredExpenses.length} pos pengeluaran</p></div>
          <div style={S.statCard}><p style={S.statLabel}>Laba Bersih</p><p style={{ ...S.statVal, color: totalProfit >= 0 ? "#166534" : "#991b1b" }}>{fmt(totalProfit)}</p><p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>Margin: {totalRevenue ? Math.round(totalProfit / totalRevenue * 100) : 0}%</p></div>
        </div>

        {/* Report Tabs */}
        <div style={S.tabs}>
          {[
            { id: "sales", label: "Penjualan per Cabang" },
            { id: "items", label: "Menu Terlaris" },
            { id: "expenses", label: "Pengeluaran" },
            { id: "payment", label: "Metode Pembayaran" },
          ].map(t => <button key={t.id} style={S.tab(reportType === t.id)} onClick={() => setReportType(t.id)}>{t.label}</button>)}
        </div>

        {reportType === "sales" && (
          <div className="mj-card" style={S.card}>
            <div className="mj-table-wrap"><table style={S.table}>
              <thead><tr>
                {["Cabang", "Total Transaksi", "Pendapatan", "Pengeluaran", "Laba/Rugi", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {branchReport.map(b => (
                  <tr key={b.id}>
                    <td style={S.td}><strong>{b.name.replace("Mie Jebew ", "")}</strong></td>
                    <td style={S.td}>{b.transactions}</td>
                    <td style={{ ...S.td, color: "#166534", fontWeight: 600 }}>{fmt(b.revenue)}</td>
                    <td style={{ ...S.td, color: "#991b1b", fontWeight: 600 }}>{fmt(b.expenses)}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: b.profit >= 0 ? "#166534" : "#991b1b" }}>{fmt(b.profit)}</td>
                    <td style={S.td}><span style={S.badge(b.is_active ? "success" : "gray")}>{b.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  </tr>
                ))}
                <tr style={{ background: "var(--color-background-secondary)" }}>
                  <td style={{ ...S.td, fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{completedOrders.length}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#166534" }}>{fmt(totalRevenue)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#991b1b" }}>{fmt(totalExpenses)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: totalProfit >= 0 ? "#166534" : "#991b1b" }}>{fmt(totalProfit)}</td>
                  <td style={S.td} />
                </tr>
              </tbody>
            </table></div>
          </div>
        )}

        {reportType === "items" && (
          <div className="mj-card" style={S.card}>
            <div className="mj-table-wrap"><table style={S.table}>
              <thead><tr>
                {["#", "Nama Menu", "Qty Terjual", "Total Pendapatan", "Kontribusi"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {topItems.map((it, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: 700, color: i < 3 ? "var(--mj-red)" : "var(--color-text-secondary)" }}>{i + 1}</td>
                    <td style={S.td}><strong>{it.name}</strong></td>
                    <td style={S.td}>{it.qty} porsi</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{fmt(it.revenue)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3 }}>
                          <div style={{ height: 6, background: "var(--mj-red)", borderRadius: 3, width: `${totalRevenue ? Math.round(it.revenue / totalRevenue * 100) : 0}%` }} />
                        </div>
                        <span style={{ fontSize: 12, minWidth: 32 }}>{totalRevenue ? Math.round(it.revenue / totalRevenue * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {reportType === "expenses" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            <div className="mj-card" style={S.card}>
              <p style={S.sectionTitle}>Per Kategori</p>
              {Object.entries(expCat).sort((a, b) => b[1] - a[1]).map(([cat, amt], i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: "#991b1b", fontWeight: 600 }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ background: "var(--color-background-secondary)", borderRadius: 4, height: 6 }}>
                    <div style={{ background: "#991b1b", height: 6, borderRadius: 4, width: `${totalExpenses ? Math.round(amt / totalExpenses * 100) : 0}%` }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{totalExpenses ? Math.round(amt / totalExpenses * 100) : 0}% dari total</span>
                </div>
              ))}
            </div>
            <div className="mj-card" style={S.card}>
              <p style={S.sectionTitle}>Detail Pengeluaran Terbaru</p>
              {filteredExpenses.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date)).slice(0, 8).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--color-border-tertiary)", fontSize: 13 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{e.description}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{fmtDate(e.expense_date)} · {e.category}</p>
                  </div>
                  <span style={{ fontWeight: 600, color: "#991b1b" }}>{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === "payment" && (
          <div className="mj-card" style={S.card}>
            <p style={S.sectionTitle}>Distribusi Metode Pembayaran</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
              {Object.entries(payMethods).map(([method, count]) => (
                <div key={method} style={{ ...S.statCard, textAlign: "center" }}>
                  <p style={{ fontSize: 24, margin: "0 0 4px" }}>{method === "cash" ? "💵" : method === "qris" ? "📱" : "💳"}</p>
                  <p style={S.statLabel}>{method.toUpperCase()}</p>
                  <p style={{ ...S.statVal, fontSize: 20 }}>{count} transaksi</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{completedOrders.length ? Math.round(count / completedOrders.length * 100) : 0}% dari total</p>
                </div>
              ))}
            </div>
            <div className="mj-table-wrap"><table style={S.table}>
              <thead><tr>
                {["Metode", "Jumlah Transaksi", "Total Nilai", "Rata-rata/Transaksi"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.entries(payMethods).map(([method, count]) => {
                  const orders_m = completedOrders.filter(o => o.payment && o.payment.method === method);
                  const total_m = orders_m.reduce((s, o) => s + o.final_amount, 0);
                  return (
                    <tr key={method}>
                      <td style={S.td}><span style={S.badge(method === "cash" ? "gray" : method === "qris" ? "info" : "warning")}>{method.toUpperCase()}</span></td>
                      <td style={S.td}>{count}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmt(total_m)}</td>
                      <td style={S.td}>{fmt(Math.round(total_m / count))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  );
}
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", icon: "dashboard", path: "/" },
  { label: "Kasir", icon: "cashier", path: "/kasir" },
  { label: "Produk & Stok", icon: "box", path: "/produk-stok" },
  { label: "Member", icon: "member", path: "/member" },
  { label: "Piutang / Bon", icon: "debt", path: "/piutang" },
  { label: "Harga Barang", icon: "tag", path: "/harga-barang" },
  { label: "Riwayat Transaksi", icon: "history", path: "/riwayat-transaksi" },
  { label: "Laporan", icon: "report", path: "/laporan" },
  { label: "Pengaturan", icon: "settings", path: "/pengaturan" },
];

function Icon({ name, size = 19 }) {
  const paths = {
    store: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8v6H8z" />
      </>
    ),
    dashboard: (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h6v6h-6z" />
      </>
    ),
    cashier: (
      <>
        <path d="M5 7h14v10H5z" />
        <path d="M8 7V4h8v3" />
        <path d="M8 13h3" />
        <path d="M15 13h1" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </>
    ),
    member: (
      <>
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M17 11a3 3 0 1 0 0-6" />
        <path d="M17 15a5 5 0 0 1 5 5" />
      </>
    ),
    debt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
    tag: (
      <>
        <path d="M3 11V4h7l11 11-7 7z" />
        <path d="M7.5 7.5h.01" />
      </>
    ),
    history: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M16 16h.01" />
      </>
    ),
    report: (
      <>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
      </>
    ),
    user: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
  } = useAuth();

  const handleLogout =
    async () => {
      await logout();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">
          <Icon name="store" size={16} />
        </span>
        <span>Toko Sembako</span>
      </div>

      <nav className="nav-list" aria-label="Menu utama">
        {navItems.map(({ label, icon, path }) => (
          <Link className={`nav-item${pathname === path ? " active" : ""}`} to={path} key={label}>
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="avatar">
            <Icon name="user" size={20} />
          </div>
          <div>
            <strong>
              {user?.name || "Admin"}
            </strong>
            <span>
              {user?.role === "admin"
                ? "Pemilik Toko"
                : "Kasir"}
            </span>
          </div>
        </div>

        <button
          className="sidebar-logout"
          type="button"
          onClick={handleLogout}
        >
          <Icon name="logout" size={17} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

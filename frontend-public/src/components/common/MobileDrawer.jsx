import { createPortal } from "react-dom";
import { NavLink, Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logowhite.png";
import "./MobileDrawer.css";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/trip-planner", label: "Trip Planner" },
  { to: "/tourist-spots", label: "Tourist Spots" },
  { to: "/hotels", label: "Hotels" },
  { to: "/guides", label: "Guides" },
  { to: "/transport", label: "Transport" },
  { to: "/local-products", label: "Local Products" },
  { to: "/about", label: "About" },
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 6h15l-1.5 8.5H8.2L6.5 6Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6 5.7 3.5H3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
      <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  );
}

export default function MobileDrawer({ open, onClose, q, setQ, onSearchSubmit, cartCount = 0 }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!open) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose?.();
      navigate("/");
    }
  };

  const initials = (() => {
    const t = String(user?.name || user?.email || "U").trim();
    return t ? t[0].toUpperCase() : "U";
  })();

  return createPortal(
    <>
      <div className="mdOverlay" onClick={onClose} />

      <aside className="mdDrawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mdTop">
          <Link to="/" className="mdBrand" onClick={onClose}>
            <img src={logo} alt="North Way Guide" className="mdLogo" />
            <div className="mdTitle">NORTH WAY GUIDE</div>
          </Link>

          <button className="mdClose" onClick={onClose} aria-label="Close menu" type="button">
            ×
          </button>
        </div>

        <form className="mdSearch" onSubmit={onSearchSubmit}>
          <span className="mdSearchIcon" aria-hidden="true">
            <SearchIcon />
          </span>

          <input
            className="mdSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search places, hotels, guides..."
          />

          <button className="mdSearchBtn" type="submit">
            Go
          </button>
        </form>

        <nav className="mdNav" aria-label="Primary">
          <Link to="/cart" className="mdRow" onClick={onClose} aria-label={`Cart (${cartCount})`}>
            <span className="mdRowLeft">
              <span className="mdRowIcon" aria-hidden="true">
                <CartIcon />
              </span>
              <span>Cart</span>
            </span>
            <span className="mdCount">{cartCount}</span>
          </Link>

          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `mdRow ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="mdRowLeft">
                <span>{n.label}</span>
              </span>
              <span className="mdChevron" aria-hidden="true">›</span>
            </NavLink>
          ))}
        </nav>

        <div className="mdSection">
          <div className="mdSectionTitle">Account</div>

          {user ? (
            <>
              <div className="mdMe">
                <div className="mdAvatar">{initials}</div>
                <div className="mdMeText">
                  <div className="mdMeName">{user?.name || "Profile"}</div>
                  <div className="mdMeSub">{user?.email || ""}</div>
                </div>
              </div>

              <div className="mdAccountList">
                <Link to="/profile" className="mdRow" onClick={onClose}>
                  <span className="mdRowLeft">Profile</span>
                  <span className="mdChevron" aria-hidden="true">›</span>
                </Link>
                <Link to="/register-service" className="mdRow" onClick={onClose}>
                  <span className="mdRowLeft">Register a Service</span>
                  <span className="mdChevron" aria-hidden="true">›</span>
                </Link>
                <Link to="/orders" className="mdRow" onClick={onClose}>
                  <span className="mdRowLeft">Order History</span>
                  <span className="mdChevron" aria-hidden="true">›</span>
                </Link>
                <Link to="/support" className="mdRow" onClick={onClose}>
                  <span className="mdRowLeft">Support</span>
                  <span className="mdChevron" aria-hidden="true">›</span>
                </Link>
                <button type="button" className="mdRow mdDanger" onClick={handleLogout}>
                  <span className="mdRowLeft">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="mdAuth">
              <Link className="btn ghost mdFull" to="/login" onClick={onClose}>
                Login
              </Link>
              <Link className="btn primary mdFull" to="/register" onClick={onClose}>
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
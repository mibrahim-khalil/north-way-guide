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

  return createPortal(
    <>
      <div className="mdOverlay" onClick={onClose} />
      <aside className="mdDrawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mdTop">
          <div className="mdBrand">
            <img src={logo} alt="North Way Guide" className="mdLogo" />
            <div className="mdTitle">NORTH WAY GUIDE</div>
          </div>

          <button className="mdClose" onClick={onClose} aria-label="Close menu" type="button">
            ×
          </button>
        </div>

        <form className="mdSearch" onSubmit={onSearchSubmit}>
          <span className="mdSearchIcon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
          </span>

          <input
            className="mdSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: Hunza, Skardu, hotels..."
          />

          <button className="mdSearchBtn" type="submit">
            Go
          </button>
        </form>

        <Link to="/cart" className="mdCartLink" onClick={onClose}>
          <span>Cart</span>
          <span className="mdCartCount">{cartCount}</span>
        </Link>

        <nav className="mdNav" aria-label="Primary">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `mdLink ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mdUserBlock">
          <div className="mdUserTitle">Account</div>

          {user ? (
            <div className="mdUserLinks">
              <Link to="/profile" className="mdUserLink" onClick={onClose}>
                Profile
              </Link>
              <Link to="/register-service" className="mdUserLink" onClick={onClose}>
                Register a Service
              </Link>
              <Link to="/orders" className="mdUserLink" onClick={onClose}>
                Order History
              </Link>
              <Link to="/support" className="mdUserLink" onClick={onClose}>
                Support
              </Link>
              <button type="button" className="mdUserLink danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="mdActions">
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
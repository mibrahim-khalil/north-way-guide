import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Header.css";
import MobileDrawer from "./MobileDrawer";
import SearchModal from "./SearchModal";
import logo from "../../assets/images/logowhite.png";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import HeaderWeatherPopover from "./HeaderWeatherPopover";

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

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const navigate = useNavigate();
  const { totals } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.style.overflow = open || searchOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open, searchOpen]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <header className="nwHeader">
      <div className="nwHeaderInner">
        <Link to="/" className="brand">
          <img src={logo} alt="North Way Guide Logo" className="brandLogo" />
          <div className="brandTextCol">
            <div className="brandText">NORTH WAY GUIDE</div>
          </div>
        </Link>

        <div className="rightGroup">
          <nav className="nav">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="actions">
            {/* ✅ Weather icon only (popover on click) */}
            <HeaderWeatherPopover />

            <button
              type="button"
              className="headerIconBtn"
              aria-label="Open search"
              title="Search"
              onClick={() => setSearchOpen(true)}
            >
              <svg className="headerIconSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <Link
              to="/events"
              className="headerIconBtn"
              aria-label="Events"
              title="Events"
            >
              {/* calendar icon */}
              <svg className="headerIconSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 3v3M17 3v3M4 9h16"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M6.5 6h11A3.5 3.5 0 0 1 21 9.5v9A3.5 3.5 0 0 1 17.5 22h-11A3.5 3.5 0 0 1 3 18.5v-9A3.5 3.5 0 0 1 6.5 6Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <Link className="cartBtn" to="/cart">
              Cart <span className="cartCount">{totals.count}</span>
            </Link>

            {user ? (
              <>
                <Link className="btn ghost" to="/profile">Profile</Link>
                <button className="btn primary" type="button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn ghost" to="/login">Login</Link>
                <Link className="btn primary" to="/register">Register</Link>
              </>
            )}
          </div>

          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
            <div className="hamburgerInner">
              <span />
              <span />
              <span />
            </div>
          </button>
        </div>
      </div>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        q={q}
        setQ={setQ}
        onSearchSubmit={onSearchSubmit}
        cartCount={totals.count}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} initialQuery={q} />
    </header>
  );
}
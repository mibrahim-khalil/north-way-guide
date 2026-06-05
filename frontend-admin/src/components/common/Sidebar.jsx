import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminNav } from "../../utils/adminConstants";
import logo from "../../assets/images/logowhite.png";
import { api } from "../../utils/api";

const iconByLabel = (label) => {
  const map = {
    Dashboard: "▦",
    Applications: "📋",
    "Manage Hotels": "🏨",
    "Manage Spots": "📍",
    "Manage Transport": "🚌",
    "Manage Guides": "🧭",
    "Manage Vendors": "🛍",
    "Manage Orders": "🧾",
    "Manage Hotel Bookings": "🛎",
    "Manage Reviews": "⭐",
    "Manage Reports": "📝",
    "Weather Updates": "⛅", // for weather
    "Events": "📅", // for events
    Settings: "⚙",
  };
  return map[label] || "•";
};

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api
      .get("/admin/applications/summary")
      .then((res) => setPendingCount(res.data.totalPending || 0))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <aside className="adminSidebar">
      <div className="adminBrand">
        <img className="adminLogoImg" src={logo} alt="North Way Guide Logo" />
        <div>
          <div className="adminBrandTitle">North Way Guide</div>
          <div className="adminBrandSub">Admin Panel</div>
        </div>
      </div>

      <div className="adminNavTitle">Navigation</div>

      <nav className="adminNav">
        {adminNav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `adminNavLink ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon" aria-hidden>
              {iconByLabel(n.label)}
            </span>

            <span className="adminNavText">{n.label}</span>

            {n.label === "Applications" && pendingCount > 0 ? (
              <span
                style={{
                  marginLeft: "auto",
                  background: "crimson",
                  color: "white",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {pendingCount}
              </span>
            ) : (
              <span className="adminNavDot" aria-hidden />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="adminSidebarFooter">
        <div className="adminHint">Copyright @ North Way Guide</div>
      </div>
    </aside>
  );
}
import { useLocation, useNavigate } from "react-router-dom";
import { adminAuth } from "../../utils/adminAuth";

const titleFromPath = (pathname) => {
  if (pathname.includes("/admin/dashboard")) return "Dashboard";
  if (pathname.includes("/admin/manage-hotels")) return "Manage Hotels";
  if (pathname.includes("/admin/manage-spots")) return "Manage Spots";
  if (pathname.includes("/admin/manage-transport")) return "Manage Transport";
  if (pathname.includes("/admin/manage-guides")) return "Manage Guides";
  if (pathname.includes("/admin/manage-vendors")) return "Manage Vendors";
  if (pathname.includes("/admin/manage-reviews")) return "Manage Reviews";
  if (pathname.includes("/admin/settings")) return "Settings";
  return "Admin Panel";
};

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    adminAuth.logout();
    navigate("/admin/login");
  };

  return (
    <header className="adminTopbar">
      <div className="adminTopLeft">
        <div className="adminTopTitle">{titleFromPath(pathname)}</div>
        <div className="adminTopSub">{pathname}</div>
      </div>

      <div className="adminTopRight">
        
        <button className="aBtn primary" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
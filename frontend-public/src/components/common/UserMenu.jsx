import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserMenu.css";
import { useAuth } from "../../context/AuthContext";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  const { user, logout } = useAuth();
  if (!user) return null;

  const isSeller = String(user?.accountType || "AVAILER").toUpperCase() === "SELLER";

  const initials =
    user?.name?.split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "U";

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="umWrap" ref={ref}>
      <button className="umBtn" onClick={() => setOpen((p) => !p)} aria-label="User menu">
        <span className="umAvatar">{initials}</span>
        <span className="umName">{user?.name || "User"}</span>
        <span className="umCaret">▾</span>
      </button>

      {open && (
        <div className="umDropdown">
          <Link className="umItem" to="/profile" onClick={() => setOpen(false)}>
            Profile
          </Link>

          {isSeller && (
            <Link className="umItem" to="/register-service" onClick={() => setOpen(false)}>
              Register a Service
            </Link>
          )}

          <Link className="umItem" to="/orders" onClick={() => setOpen(false)}>
            Order History
          </Link>

          <Link className="umItem" to="/support" onClick={() => setOpen(false)}>
            Support
          </Link>

          <button className="umItem danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
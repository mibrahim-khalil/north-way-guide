import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireSeller() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  const isSeller = String(user.accountType || "AVAILER").toUpperCase() === "SELLER";
  if (!isSeller) return <Navigate to="/profile" replace />;
  return <Outlet />;
}
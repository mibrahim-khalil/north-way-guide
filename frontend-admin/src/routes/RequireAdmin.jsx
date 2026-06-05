import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAdminAuth();

  if (loading) return null; 

  if (!user) return <Navigate to="/admin/login" replace />;

  if (user.role !== "ADMIN") return <Navigate to="/admin/login" replace />;

  return children;
}
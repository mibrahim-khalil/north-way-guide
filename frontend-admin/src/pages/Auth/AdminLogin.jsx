import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(email, password);

      if (user.role !== "ADMIN") {
        await logout();
        setError("You are not an admin.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adminAuth">
      <div className="adminAuthCard">
        <h2 style={{ margin: 0, color: "var(--ink)", fontWeight: 1000 }}>Admin Login</h2>
        <p className="adminMuted" style={{ marginTop: 6 }}>
          Sign in to manage applications, listings, and orders.
        </p>

        {error ? <div className="adminError">{error}</div> : null}

        <form onSubmit={submit} className="adminAuthForm">
          <div>
            <label htmlFor="adminEmail">Email</label>
            <input
              id="adminEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="adminPassword">Password</label>
            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="aBtn primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
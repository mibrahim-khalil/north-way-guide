import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import logo from "../../assets/images/logowhite.png";
import bg from "../../assets/images/admin-login-bg.jpg";

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
        setError("You are not an admin.");0
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
    <div
      className="adminAuth"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="adminAuthCard">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <img
            src={logo}
            alt="North Way Guide"
            style={{ width: 170, height: "auto", display: "block", margin: "0 auto 16px" }}
          />

          <h2 style={{ margin: 0, textAlign: "center" }}>Admin Login</h2>

          <p
            style={{
              margin: "6px 0 0",
              textAlign: "center",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            Sign in to manage applications, listings, and orders.
          </p>
        </div>

        {error ? <div className="adminError">{error}</div> : null}

        <form onSubmit={submit} className="adminAuthForm" style={{ textAlign: "left" }}>
          <div>
            <label htmlFor="adminEmail">Email</label>
            <input
              id="adminEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
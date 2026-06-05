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
        setSubmitting(false);
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
        <h2 style={{ margin: 0 }}>Admin Login</h2>
        <p className="adminMuted">Login using real backend (MongoDB Atlas).</p>

        {error && <div className="adminError">{error}</div>}

        <form onSubmit={submit} className="adminAuthForm">
          <div>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>

          <button
            className="aBtn primary"
            style={{ width: "100%", padding: "12px 14px" }}
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
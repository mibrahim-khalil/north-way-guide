import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./AuthForms.css";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  // ✅ supports:
  // 1) /login?next=/support?report=1
  // 2) navigate("/login", { state: { from: "/..." } })
  const sp = new URLSearchParams(location.search);
  const nextFromQuery = sp.get("next");
  const fromState = location.state?.from;
  const redirectTo = nextFromQuery || fromState || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast("Please enter email and password", 2000);

    setSubmitting(true);
    try {
      await login(email, password);
      toast("Logged in successfully", 2000);

      // ✅ go back to intended page (support report form)
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed";
      toast(msg, 2500);

      // ✅ keep next when redirecting to verify-email
      if (err?.response?.status === 403 && email) {
        const qs = new URLSearchParams();
        qs.set("email", email);
        if (redirectTo) qs.set("next", redirectTo);

        navigate(`/verify-email?${qs.toString()}`, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authLeft">
        <h2 className="authTitle">Welcome back</h2>
        <p className="authHint">
          Login to save itineraries, review services, and access personalized trip planning.
        </p>

        <form className="authForm" onSubmit={onSubmit}>
          <div>
            <label>Email</label>
            <input
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div style={{ marginTop: 8, textAlign: "right" }}>
              <Link
                className="smallLink"
                to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button className="btn primary" type="submit" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="p" style={{ fontSize: 13 }}>
            Don’t have an account?{" "}
            <Link className="smallLink" to="/register">
              Create one
            </Link>
          </p>
        </form>
      </div>

      <div className="authRight">
        <div className="authRightInner">
          <span className="badge">North Way Guide</span>
          <h3 style={{ margin: "12px 0 6px" }}>Travel smarter in Gilgit-Baltistan</h3>
          <p className="p">
            Verified listings, transparent reviews, and a unified tourism experience — designed for your FYP.
          </p>

          <div className="featureList">
            <div className="featureItem">
              <strong>Trip Planner</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Day-by-day itinerary generation (AI later)
              </div>
            </div>
            <div className="featureItem">
              <strong>Hotels & Guides</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Credibility via ratings and reviews
              </div>
            </div>
            <div className="featureItem">
              <strong>Transport</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Compare local vs private fares
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
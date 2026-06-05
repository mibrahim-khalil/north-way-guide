import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./AuthForms.css";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function onlyDigits(v) {
  return String(v || "").replace(/\D/g, "");
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

export default function RegistrationForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const [accountType, setAccountType] = useState("AVAILER"); // AVAILER | SELLER
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const digitsPhone = onlyDigits(phone);

    if (!name || !cleanEmail || !digitsPhone || !pw || !pw2) return toast("Please fill all fields", 2000);
    if (!isValidEmail(cleanEmail)) return toast("Please enter a valid email", 2000);

    if (digitsPhone.length !== 11) return toast("Phone must be exactly 11 digits", 2000);

    if (pw !== pw2) return toast("Passwords do not match", 2000);
    if (pw.length < 6) return toast("Password must be at least 6 characters", 2000);

    if (!["AVAILER", "SELLER"].includes(String(accountType))) {
      return toast("Please select account type", 2000);
    }

    setSubmitting(true);
    try {
      const data = await register(name, cleanEmail, pw, digitsPhone, accountType);

      toast("Code sent to your email. Please verify.", 2200);

      navigate(`/verify-email?email=${encodeURIComponent(data.email || cleanEmail)}`, {
        replace: true,
      });
    } catch (err) {
      toast(err?.response?.data?.message || "Registration failed", 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authLeft">
        <h2 className="authTitle">Create your account</h2>
        <p className="authHint">Choose buyer/seller and continue registration.</p>

        <form className="authForm" onSubmit={onSubmit}>
          <div>
            <label>Signup as *</label>
            <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="AVAILER">Buyer (Avail services)</option>
              <option value="SELLER">Seller (Sell services)</option>
            </select>
            <p className="p" style={{ fontSize: 12, marginTop: 6 }}>
              Buyer profile shows bookings & orders. Seller profile shows services & applications.
            </p>
          </div>

          <div className="grid cols-2">
            <div>
              <label>Full Name *</label>
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label>Email *</label>
              <input
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid cols-2">
            <div>
              <label>Phone (11 digits) *</label>
              <input
                className="input"
                placeholder="03xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <label>Phone format</label>
              <input className="input" value={onlyDigits(phone)} disabled />
            </div>
          </div>

          <div className="grid cols-2">
            <div>
              <label>Password *</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label>Confirm Password *</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button className="btn primary" type="submit" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Creating..." : "Register"}
          </button>

          <p className="p" style={{ fontSize: 13 }}>
            Already have an account?{" "}
            <Link className="smallLink" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>

      <div className="authRight">
        <div className="authRightInner">
          <span className="badge">Secure Access</span>
          <h3 style={{ margin: "12px 0 6px" }}>Account & onboarding</h3>

          <p className="p">
            Buyers can book services. Sellers can apply to register services and admin will approve.
          </p>

          <div className="featureList">
            <div className="featureItem">
              <strong>Buyer</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Profile shows bookings & orders only.
              </div>
            </div>
            <div className="featureItem">
              <strong>Seller</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Profile shows services, applications, and received bookings.
              </div>
            </div>
            <div className="featureItem">
              <strong>Verified Services</strong>
              <div className="p" style={{ fontSize: 13 }}>
                Admin approval improves trust and quality.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
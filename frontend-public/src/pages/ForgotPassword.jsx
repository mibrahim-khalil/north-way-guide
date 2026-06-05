import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast("If the email exists, a reset link has been sent.", 3500);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to request reset", 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="cardBody">
        <h2 style={{ margin: "0 0 6px" }}>Forgot Password</h2>
        <p className="p">Enter your email to receive a password reset link.</p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div>
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button className="btn primary" disabled={busy}>
            {busy ? "Sending..." : "Send reset link"}
          </button>

          <Link className="btn" to="/login">Back to Login</Link>
        </form>
      </div>
    </div>
  );
}
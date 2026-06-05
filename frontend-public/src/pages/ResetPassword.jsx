import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function ResetPassword() {
  const { toast } = useToast();
  const nav = useNavigate();
  const { search } = useLocation();

  const q = useMemo(() => new URLSearchParams(search), [search]);
  const token = q.get("token") || "";
  const email = q.get("email") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token || !email) return toast("Invalid reset link.", 3000);
    if (pw.length < 6) return toast("Password must be at least 6 characters.", 3000);
    if (pw !== pw2) return toast("Passwords do not match.", 3000);

    setBusy(true);
    try {
      await api.post("/auth/reset-password", { email, token, newPassword: pw });
      toast("Password reset successful. Please login.", 3000);
      nav("/login");
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to reset password", 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="cardBody">
        <h2 style={{ margin: "0 0 6px" }}>Reset Password</h2>
        <p className="p">Set a new password for: <b>{email || "—"}</b></p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div>
            <label>New Password</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>

          <div>
            <label>Confirm Password</label>
            <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>

          <button className="btn primary" disabled={busy}>
            {busy ? "Resetting..." : "Reset Password"}
          </button>

          <Link className="btn" to="/login">Back to Login</Link>
        </form>
      </div>
    </div>
  );
}
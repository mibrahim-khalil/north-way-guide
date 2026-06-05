import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const nav = useNavigate();
  const loc = useLocation();
  const { toast } = useToast();
  const { verifyEmail, resendOtp } = useAuth();

  const email = useMemo(
    () => new URLSearchParams(loc.search).get("email") || "",
    [loc.search]
  );

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onVerify = async (e) => {
    e.preventDefault();
    if (!email) return toast("Missing email", 2000);
    if (!code) return toast("Enter the code", 2000);

    setBusy(true);
    try {
      await verifyEmail(email, code);
      toast("Email verified successfully", 2000);
      nav("/profile", { replace: true });
    } catch (err) {
      toast(err?.response?.data?.message || "Verification failed", 2500);
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (!email) return toast("Missing email", 2000);

    setBusy(true);
    try {
      await resendOtp(email);
      toast("Code sent again", 2000);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to resend", 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="cardBody">
        <h2 style={{ margin: "0 0 6px" }}>Verify your email</h2>
        <p className="p">
          We sent a 6-digit code to: <b>{email || "—"}</b>
        </p>

        <form onSubmit={onVerify} style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div>
            <label>Verification Code</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </div>

          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Please wait..." : "Verify"}
          </button>

          <button className="btn" type="button" onClick={onResend} disabled={busy}>
            Resend Code
          </button>

          <p className="p" style={{ fontSize: 13 }}>
            Already verified? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
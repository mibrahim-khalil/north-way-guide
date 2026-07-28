import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const METHODS = [
  { code: "BANK_TRANSFER", label: "Bank Transfer" },
  { code: "EASYPAISA", label: "Easypaisa" },
  { code: "JAZZCASH", label: "JazzCash" },
  { code: "NAYAPAY", label: "NayaPay" },
];

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SubmitPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const q = useQuery();

  const targetType = q.get("type") || "";
  const targetId = q.get("id") || "";
  const defaultMethod = q.get("method") || "BANK_TRANSFER";

  const [methodCode, setMethodCode] = useState(defaultMethod);
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const targetLabel =
    targetType === "HOTEL_BOOKING"
      ? "Hotel Booking"
      : targetType === "PRODUCT_ORDER"
      ? "Product Order"
      : targetType === "GUIDE_BOOKING"
      ? "Guide Booking"
      : "Payment";

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast("Please login first.", 2500);
      navigate("/login");
      return;
    }

    if (!["HOTEL_BOOKING", "PRODUCT_ORDER", "GUIDE_BOOKING"].includes(targetType)) {
      toast("Invalid payment target type.", 3000);
      return;
    }

    if (!targetId) {
      toast("Missing target id.", 3000);
      return;
    }

    if (!file) {
      toast("Please upload payment proof image.", 2500);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("targetType", targetType);
      fd.append("targetId", targetId);
      fd.append("methodCode", methodCode);
      fd.append("transactionId", transactionId);
      fd.append("proof", file);

      await api.post("/payments/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast("Payment proof submitted. Waiting for verification.", 3000);
      navigate("/profile");
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to submit payment proof", 3500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="cardBody">
        <style>{`
          .spFileRow{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
          .spFileBtn{
            padding: 10px 14px; border-radius: 999px;
            border: 1px solid rgba(15,23,42,0.12);
            background: rgba(15,23,42,0.06);
            cursor: pointer; font-weight: 900;
          }
          .spFileBtn:hover{ background: rgba(15,23,42,0.10); }
          .spFileName{ font-size: 12px; font-weight: 800; color: rgba(100,116,139,0.95); }
        `}</style>

        <h2 style={{ margin: "0 0 6px" }}>Submit Payment Proof</h2>
        <p className="p">
          For: <b>{targetLabel}</b>
        </p>

        <hr className="sep" />

        <div className="card" style={{ boxShadow: "none", marginBottom: 12 }}>
          <div className="cardBody">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Payment Instructions</div>
            <div className="p" style={{ fontSize: 13, margin: 0 }}>
              Easypasia - 03000000000
            </div>
            <div className="p" style={{ fontSize: 13, marginTop: 8 }}>
              After sending payment, upload screenshot and enter transaction/reference id.
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label>Payment Method *</label>
            <select className="input" value={methodCode} onChange={(e) => setMethodCode(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Transaction / Reference ID (recommended)</label>
            <input
              className="input"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 1234567890"
            />
          </div>

          <div>
            <label>Upload Payment Proof (image) *</label>

            <input
              id="payProof"
              className="input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={busy}
            />

            <div className="spFileRow">
              <label className="spFileBtn" htmlFor="payProof">
                Choose Image
              </label>
              <span className="spFileName">{file ? file.name : "No file chosen"}</span>
            </div>

            <p className="p" style={{ fontSize: 12, marginTop: 6 }}>
              Max 5MB. JPG/PNG recommended.
            </p>
          </div>

          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Submit Proof"}
          </button>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" to="/profile">
              Back to Profile
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
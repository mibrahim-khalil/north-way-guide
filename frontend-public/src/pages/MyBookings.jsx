import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function payChipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" };
}

export default function MyBookings() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const res = await api.get("/my/bookings/hotel");
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load bookings", 2500);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
  }, [user, loading]);

  if (!loading && !user) {
    return (
      <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="cardBody">
          <h2 style={{ margin: "0 0 6px" }}>My Bookings</h2>
          <p className="p">Please login to view your bookings.</p>
          <Link className="btn primary" to="/login">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="cardBody">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 6px" }}>My Bookings</h2>
            <p className="p">{busy ? "Loading..." : `Total: ${items.length}`}</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={load} disabled={busy}>
              Refresh
            </button>
            <Link className="btn" to="/hotels">
              Browse Hotels
            </Link>
          </div>
        </div>

        <hr className="sep" />

        {items.length === 0 && !busy ? (
          <div className="p">No bookings yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((b) => {
              const payStatus = String(b?.payment?.status || "UNPAID").toUpperCase();
              const needsProof = payStatus === "UNPAID" || payStatus === "REJECTED";
              const waiting = payStatus === "SUBMITTED";
              const paid = payStatus === "PAID";

              const defaultMethod = b?.payment?.methodCode || "BANK_TRANSFER";

              return (
                <div key={b._id} className="card" style={{ boxShadow: "none" }}>
                  <div
                    className="cardBody"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 1000 }}>
                        Booking #{String(b._id).slice(-6).toUpperCase()}
                      </div>

                      <div className="p" style={{ fontSize: 13 }}>
                        Status: <b>{b.status}</b> • Total: <b>{money(b.total)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        {fmt(b.checkInDate)} → {fmt(b.checkOutDate)} • {b.nights} nights • Guests: {b.guests}
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                        Payment:{" "}
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontWeight: 900,
                            ...payChipStyle(payStatus),
                          }}
                        >
                          {payStatus}
                        </span>
                        {b?.payment?.methodLabel ? (
                          <>
                            {" "}
                            • Method: <b>{b.payment.methodLabel}</b>
                          </>
                        ) : null}
                      </div>

                      {waiting ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Proof submitted. Waiting for admin verification.
                        </div>
                      ) : null}

                      {payStatus === "REJECTED" && (b?.payment?.adminNote || b?.adminNote) ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          <b>Admin note:</b> {b.payment?.adminNote || b.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 260, display: "grid", gap: 8, justifyItems: "end" }}>
                      <div style={{ textAlign: "right" }}>
                        <div className="p" style={{ fontSize: 12 }}>
                          <b>Room:</b> {b.room?.roomName || "—"}
                        </div>
                        <div className="p" style={{ fontSize: 12 }}>
                          <b>Contact:</b> {b.contact?.fullName || "—"} • {b.contact?.phone || "—"}
                        </div>
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Placed: {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                        </div>
                      </div>

                      {needsProof ? (
                        <Link
                          className="btn primary"
                          to={`/submit-payment?type=HOTEL_BOOKING&id=${b._id}&method=${defaultMethod}`}
                        >
                          Submit Payment Proof
                        </Link>
                      ) : null}

                      {paid ? (
                        <div className="p" style={{ fontSize: 12, textAlign: "right" }}>
                          Payment verified. Booking will be confirmed by admin.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {b.note ? (
                    <div className="cardBody" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
                      <div className="p" style={{ fontSize: 12 }}>
                        <b>Note:</b> {b.note}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
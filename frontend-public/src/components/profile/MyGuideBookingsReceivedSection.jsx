import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}
function chip(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(245,158,11,0.15)", color: "rgb(146,64,14)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
}

export default function MyGuideBookingsReceivedSection() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const res = await api.get("/my/guide-bookings");
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load received guide bookings", 2500);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
  }, [user, loading]);

  const setStatus = async (b, nextStatus) => {
    const ok = confirm(`Set booking #${String(b._id).slice(-6).toUpperCase()} to ${nextStatus}?`);
    if (!ok) return;

    try {
      await api.patch(`/my/guide-bookings/${b._id}/status`, { status: nextStatus });
      toast("Booking updated", 1800);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to update booking", 2500);
    }
  };

  const verifyPayment = async (b, decision) => {
    const label = decision === "PAID" ? "PAID (Confirm)" : "REJECT (Cancel)";
    const ok = confirm(`Mark payment as ${label} for booking #${String(b._id).slice(-6).toUpperCase()}?`);
    if (!ok) return;

    try {
      await api.patch(`/my/guide-bookings/${b._id}/payment/verify`, {
        decision,
        note: "",
      });
      toast("Payment verification updated", 2000);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to verify payment", 2500);
    }
  };

  return (
    <div className="card" style={{ boxShadow: "none", marginTop: 12 }}>
      <div className="cardBody">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h4 style={{ margin: "0 0 6px" }}>Bookings Received (My Guides)</h4>
            <p className="p">{busy ? "Loading..." : `Total: ${items.length}`}</p>
          </div>
          <button className="btn" type="button" onClick={load} disabled={busy}>
            {busy ? "Loading..." : "Refresh"}
          </button>
        </div>

        <hr className="sep" />

        {items.length === 0 && !busy ? (
          <div className="p">No guide bookings received yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((b) => {
              const payStatus = String(b.payment?.status || "UNPAID").toUpperCase();
              const proofs = b.payment?.proofs || [];
              const canConfirmFulfill = payStatus === "PAID" && b.status !== "CANCELLED" && b.status !== "FULFILLED";

              return (
                <div key={b._id} className="card" style={{ boxShadow: "none" }}>
                  <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 320 }}>
                      <div style={{ fontWeight: 1000, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <span>
                          Booking #{String(b._id).slice(-6).toUpperCase()} • <b>{b.status}</b>
                        </span>
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...chip(payStatus) }}>
                          {payStatus}
                        </span>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        {fmt(b.startDate)} → {fmt(b.endDate)} • {b.days} days • travelers: {b.travelers}
                      </div>

                      <div className="p" style={{ fontSize: 12 }}>
                        Meeting: <b>{b.meetingCity || "—"}</b> • Total: <b>{money(b.total)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12 }}>
                        Customer: <b>{b.contact?.fullName || "—"}</b> • {b.contact?.phone || "—"}
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                        <b>Proofs:</b>{" "}
                        {proofs.length === 0 ? (
                          "—"
                        ) : (
                          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                            {proofs.map((p) => (
                              <a
                                key={p._id}
                                className="btn"
                                style={{ padding: "6px 10px" }}
                                href={`${api.defaults.baseURL}/my/guide-bookings/${b._id}/proofs/${p._id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            ))}
                          </span>
                        )}
                      </div>

                      {payStatus === "SUBMITTED" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <button className="btn primary" type="button" onClick={() => verifyPayment(b, "PAID")}>
                            Verify Paid (Confirm)
                          </button>
                          <button
                            className="btn"
                            type="button"
                            style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                            onClick={() => verifyPayment(b, "REJECTED")}
                          >
                            Reject (Cancel)
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button className="btn primary" type="button" disabled={!canConfirmFulfill} onClick={() => setStatus(b, "CONFIRMED")}>
                        Confirm
                      </button>
                      <button className="btn" type="button" disabled={!canConfirmFulfill} onClick={() => setStatus(b, "FULFILLED")}>
                        Fulfill
                      </button>
                      <button
                        className="btn"
                        type="button"
                        style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                        disabled={b.status === "CANCELLED" || b.status === "FULFILLED"}
                        onClick={() => setStatus(b, "CANCELLED")}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {b.note ? (
                    <div className="cardBody" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
                      <div className="p" style={{ fontSize: 12 }}><b>Note:</b> {b.note}</div>
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
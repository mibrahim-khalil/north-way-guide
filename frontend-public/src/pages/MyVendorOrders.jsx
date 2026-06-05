import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function chipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "FULFILLED") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "CONFIRMED") return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
  if (s === "CANCELLED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" };
}

function payChipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(245,158,11,0.15)", color: "rgb(146,64,14)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" };
}

export default function MyVendorOrders() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const load = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await api.get(`/my/vendor/orders${qs}`);
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load vendor orders", 3000);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
  }, [user, loading, status]);

  const totalVendorEarnings = useMemo(() => {
    return (items || []).reduce((sum, o) => sum + Number(o.vendorSubtotal || 0), 0);
  }, [items]);

  const verifyPayment = async (o, decision) => {
    const shortId = String(o._id).slice(-6).toUpperCase();
    const label = decision === "PAID" ? "PAID (Confirm)" : "REJECT (Cancel)";
    const ok = confirm(`Mark payment as ${label} for order #${shortId}?`);
    if (!ok) return;

    try {
      await api.patch(`/my/vendor/orders/${o._id}/payment/verify`, { decision, note: "" });
      toast("Payment updated", 2000);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || "Payment verify failed", 3000);
    }
  };

  const setOrderStatus = async (o, nextStatus) => {
    const shortId = String(o._id).slice(-6).toUpperCase();
    const ok = confirm(`Set order #${shortId} to ${nextStatus}?`);
    if (!ok) return;

    try {
      await api.patch(`/my/vendor/orders/${o._id}/status`, { status: nextStatus });
      toast("Order updated", 2000);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || "Status update failed", 3000);
    }
  };

  if (!loading && !user) {
    return (
      <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="cardBody">
          <h2 style={{ margin: "0 0 6px" }}>My Vendor Orders</h2>
          <p className="p">Please login to view vendor orders.</p>
          <Link className="btn primary" to="/login">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="cardBody">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>My Vendor Orders</h2>
            <p className="p">
              {busy ? "Loading..." : `Total: ${items.length}`}
              {!busy && items.length > 0 ? (
                <>
                  {" "}• Vendor subtotal: <b>{money(totalVendorEarnings)}</b>
                </>
              ) : null}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PLACED">PLACED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="FULFILLED">FULFILLED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <button className="btn" type="button" onClick={load} disabled={busy}>
              Refresh
            </button>

            <Link className="btn" to="/profile">Back to Profile</Link>
          </div>
        </div>

        <hr className="sep" />

        {!busy && items.length === 0 ? (
          <div className="p">No vendor orders found.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((o) => {
              const payStatus = String(o.payment?.status || "UNPAID").toUpperCase();
              const proofs = o.payment?.proofs || [];
              const canProcess = payStatus === "PAID" && o.status !== "CANCELLED" && o.status !== "FULFILLED";

              return (
                <div key={o._id} className="card" style={{ boxShadow: "none" }}>
                  <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 320 }}>
                      <div style={{ fontWeight: 1000 }}>
                        Order #{String(o._id).slice(-6).toUpperCase()}
                      </div>

                      <div className="p" style={{ fontSize: 13, marginTop: 6 }}>
                        Status:{" "}
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...chipStyle(o.status) }}>
                          {o.status}
                        </span>{" "}
                        • Your subtotal: <b>{money(o.vendorSubtotal)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        Payment:{" "}
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...payChipStyle(payStatus) }}>
                          {payStatus}
                        </span>{" "}
                        {o.payment?.methodLabel ? `• ${o.payment.methodLabel}` : ""}
                        {o.payment?.transactionId ? ` • TX: ${o.payment.transactionId}` : ""}
                      </div>

                      {proofs.length > 0 ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                          <b>Proofs:</b>{" "}
                          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                            {proofs.map((p) => (
                              <a
                                key={p._id}
                                className="btn"
                                style={{ padding: "6px 10px" }}
                                href={`${api.defaults.baseURL}/my/vendor/orders/${o._id}/proofs/${p._id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            ))}
                          </span>
                        </div>
                      ) : null}

                      {payStatus === "SUBMITTED" ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <button className="btn primary" type="button" onClick={() => verifyPayment(o, "PAID")}>
                            Verify Paid (Confirm)
                          </button>
                          <button
                            className="btn"
                            type="button"
                            style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                            onClick={() => verifyPayment(o, "REJECTED")}
                          >
                            Reject (Cancel)
                          </button>
                        </div>
                      ) : null}

                      {o.payment?.adminNote ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                          <b>Note:</b> {o.payment.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 280 }}>
                      <div className="p" style={{ fontSize: 12 }}>
                        <b>Customer:</b> {o.shipping?.fullName || "—"} • {o.shipping?.phone || "—"}
                      </div>
                      <div className="p" style={{ fontSize: 12 }}>
                        <b>Address:</b> {o.shipping?.address || "—"}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <button className="btn primary" type="button" disabled={!canProcess} onClick={() => setOrderStatus(o, "CONFIRMED")}>
                          Confirm
                        </button>
                        <button className="btn" type="button" disabled={!canProcess} onClick={() => setOrderStatus(o, "FULFILLED")}>
                          Fulfill
                        </button>
                        <button
                          className="btn"
                          type="button"
                          style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                          disabled={o.status === "CANCELLED" || o.status === "FULFILLED"}
                          onClick={() => setOrderStatus(o, "CANCELLED")}
                        >
                          Cancel
                        </button>
                      </div>

                      {payStatus !== "PAID" ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                          Confirm/Fulfill allowed only after payment is PAID.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="cardBody" style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {(o.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div className="p" style={{ fontSize: 13 }}>
                            {it.name} × {it.quantity}
                          </div>
                          <div style={{ fontWeight: 1000, color: "var(--heading)" }}>
                            {money(it.lineTotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
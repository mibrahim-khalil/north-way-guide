import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function payChipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" }; // UNPAID/others
}

export default function Orders() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const res = await api.get("/my/orders");
      setItems(res.data.items || []);
    } catch (e) {
      setItems([]);
      toast(e?.response?.data?.message || "Failed to load orders", 2500);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
  }, [user, loading]);

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
            <h2 style={{ margin: "0 0 6px" }}>Order History</h2>
            <p className="p">{busy ? "Loading..." : `Total: ${items.length}`}</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={load} disabled={busy}>
              Refresh
            </button>
            <Link className="btn" to="/local-products">
              Continue Shopping
            </Link>
          </div>
        </div>

        <hr className="sep" />

        {items.length === 0 && !busy ? (
          <div className="p">No orders yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((o) => {
              const payStatus = String(o?.payment?.status || "UNPAID").toUpperCase();
              const needsProof = payStatus === "UNPAID" || payStatus === "REJECTED";
              const waiting = payStatus === "SUBMITTED";
              const paid = payStatus === "PAID";

              const defaultMethod = o?.payment?.methodCode || "BANK_TRANSFER";

              return (
                <div key={o._id} className="card" style={{ boxShadow: "none" }}>
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
                        Order #{String(o._id).slice(-6).toUpperCase()}
                      </div>

                      <div className="p" style={{ fontSize: 13 }}>
                        Status: <b>{o.status}</b> • Total: <b>{money(o.total)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        Items: {(o.items || []).length} • Placed:{" "}
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
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
                        {o?.payment?.methodLabel ? (
                          <>
                            {" "}
                            • Method: <b>{o.payment.methodLabel}</b>
                          </>
                        ) : null}
                      </div>

                      {waiting ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Proof submitted. Waiting for admin verification.
                        </div>
                      ) : null}

                      {payStatus === "REJECTED" && (o?.payment?.adminNote || o?.adminNote) ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          <b>Admin note:</b> {o.payment?.adminNote || o.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 240, display: "grid", gap: 8, justifyItems: "end" }}>
                      <div style={{ textAlign: "right" }}>
                        <div className="p" style={{ fontSize: 12 }}>
                          <b>Ship to:</b> {o.shipping?.fullName || "—"} • {o.shipping?.phone || "—"}
                        </div>
                        <div className="p" style={{ fontSize: 12 }}>{o.shipping?.address || "—"}</div>
                      </div>

                      {needsProof ? (
                        <Link
                          className="btn primary"
                          to={`/submit-payment?type=PRODUCT_ORDER&id=${o._id}&method=${defaultMethod}`}
                        >
                          Submit Payment Proof
                        </Link>
                      ) : null}

                      {paid ? (
                        <div className="p" style={{ fontSize: 12, textAlign: "right" }}>
                          Payment verified. Order will be confirmed/processed by admin.
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
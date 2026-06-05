import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function payChipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" };
}

/**
 * Props:
 * - limit?: number
 * - hideHeader?: boolean
 * - compact?: boolean
 * - headerLabel?: string
 * - onViewAll?: () => void
 */
export default function MyOrdersSection({
  limit,
  hideHeader = false,
  compact = false,
  headerLabel = "My Orders",
  onViewAll,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const smallBtnStyle = { padding: "8px 12px", fontSize: 13, borderRadius: 999, whiteSpace: "nowrap" };

  const load = async () => {
    if (!user) return;
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const shown = useMemo(() => {
    if (!limit) return items;
    return items.slice(0, limit);
  }, [items, limit]);

  const showViewAll = Boolean(limit && items.length > limit);

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardBody">
        {!hideHeader ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 1000 }}>{headerLabel}</div>
                <div className="p" style={{ fontSize: 12, margin: "6px 0 0" }}>
                  {busy ? "Loading..." : `Total: ${items.length}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn" type="button" onClick={load} disabled={busy}>
                  Refresh
                </button>
                <Link className="btn" to="/orders">
                  View All
                </Link>
              </div>
            </div>

            <hr className="sep" />
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 1000 }}>{headerLabel}</div>
              <div className="p" style={{ fontSize: 12, marginTop: 4 }}>
                {busy ? "Loading..." : `Total: ${items.length}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={load} disabled={busy}>
                Refresh
              </button>
              {showViewAll ? (
                <button className="btn primary" type="button" onClick={onViewAll}>
                  View All
                </button>
              ) : (
                <Link className="btn" to="/orders">
                  Orders Page
                </Link>
              )}
            </div>
          </div>
        )}

        {!busy && items.length === 0 ? (
          <div className="p">No orders yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {shown.map((o) => {
              const payStatus = String(o?.payment?.status || "UNPAID").toUpperCase();
              const needsProof = payStatus === "UNPAID" || payStatus === "REJECTED";
              const defaultMethod = o?.payment?.methodCode || "BANK_TRANSFER";
              const proofs = o?.payment?.proofs || [];

              if (compact) {
                return (
                  <div key={o._id} className="card" style={{ boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 1000 }}>#{String(o._id).slice(-6).toUpperCase()}</div>
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Total: <b>{money(o.total)}</b> • Status: <b>{o.status}</b>
                        </div>
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Payment:{" "}
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12, ...payChipStyle(payStatus) }}>
                            {payStatus}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {proofs.length > 0 ? (
                          <a
                            className="btn"
                            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 999 }}
                            href={`${api.defaults.baseURL}/my/orders/${o._id}/proofs/${proofs[0]._id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Proof
                          </a>
                        ) : null}

                        {needsProof ? (
                          <Link
                            className="btn primary"
                            style={{ padding: "6px 10px", fontSize: 12, borderRadius: 999 }}
                            to={`/submit-payment?type=PRODUCT_ORDER&id=${o._id}&method=${defaultMethod}`}
                          >
                            Submit Proof
                          </Link>
                        ) : (
                          <Link className="btn" style={{ padding: "6px 10px", fontSize: 12, borderRadius: 999 }} to="/orders">
                            Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={o._id} className="card" style={{ boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>#{String(o._id).slice(-6).toUpperCase()}</div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        Status: <b>{o.status}</b> • Total: <b>{money(o.total)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        Payment:{" "}
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...payChipStyle(payStatus) }}>
                          {payStatus}
                        </span>
                      </div>

                      {proofs.length > 0 ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 8 }}>
                          <b>Proofs:</b>{" "}
                          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                            {proofs.map((p) => (
                              <a
                                key={p._id}
                                className="btn"
                                style={{ padding: "6px 10px", fontSize: 13, borderRadius: 999 }}
                                href={`${api.defaults.baseURL}/my/orders/${o._id}/proofs/${p._id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            ))}
                          </span>
                        </div>
                      ) : null}

                      {payStatus === "REJECTED" && o?.payment?.adminNote ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          <b>Note:</b> {o.payment.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {needsProof ? (
                        <Link className="btn primary" style={smallBtnStyle} to={`/submit-payment?type=PRODUCT_ORDER&id=${o._id}&method=${defaultMethod}`}>
                          Submit Proof
                        </Link>
                      ) : (
                        <Link className="btn" style={smallBtnStyle} to="/orders">
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hideHeader && showViewAll ? (
          <div style={{ marginTop: 12 }}>
            <button className="btn primary" type="button" onClick={onViewAll}>
              View All
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function chip(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "SUBMITTED") return { background: "rgba(245,158,11,0.15)", color: "rgb(146,64,14)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
}

/**
 * Props:
 * - limit?: number
 * - hideHeader?: boolean
 * - compact?: boolean
 * - headerLabel?: string
 * - onViewAll?: () => void
 */
export default function MyHotelBookingsSection({
  limit,
  hideHeader = false,
  compact = false,
  headerLabel = "My Hotel Bookings",
  onViewAll,
}) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const shown = useMemo(() => {
    if (!limit) return items;
    return items.slice(0, limit);
  }, [items, limit]);

  const showViewAll = Boolean(limit && items.length > limit);

  if (!user) return null;

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardBody">
        {!hideHeader ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>My Bookings</h3>
                <p className="p">{busy ? "Loading..." : `Total: ${items.length}`}</p>
              </div>

              <button className="btn" onClick={load} disabled={busy}>
                {busy ? "Loading..." : "Refresh"}
              </button>
            </div>
            <hr className="sep" />
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 1000 }}>{headerLabel}</div>
              <div className="p" style={{ fontSize: 12, marginTop: 4 }}>{busy ? "Loading..." : `Total: ${items.length}`}</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={load} disabled={busy}>
                Refresh
              </button>
              {showViewAll ? (
                <button className="btn primary" type="button" onClick={onViewAll}>
                  View All
                </button>
              ) : null}
            </div>
          </div>
        )}

        {items.length === 0 && !busy ? (
          <div className="p">No bookings yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {shown.map((b) => {
              const payStatus = String(b.payment?.status || "UNPAID").toUpperCase();
              const proofs = b.payment?.proofs || [];

              if (compact) {
                return (
                  <div key={b._id} className="card" style={{ boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 1000, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <span>#{String(b._id).slice(-6).toUpperCase()}</span>
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12, ...chip(payStatus) }}>
                            {payStatus}
                          </span>
                        </div>
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          {fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)} • {b.nights} nights • Guests: {b.guests}
                        </div>
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          Total: <b>{money(b.total)}</b> • Status: <b>{b.status}</b>
                        </div>
                      </div>

                      {proofs.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {proofs.slice(0, 2).map((p) => (
                            <a
                              key={p._id}
                              className="btn"
                              style={{ padding: "6px 10px", fontSize: 12, borderRadius: 999 }}
                              href={`${api.defaults.baseURL}/my/bookings/hotel/${b._id}/proofs/${p._id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Proof
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="p" style={{ fontSize: 12, margin: 0, color: "#64748b" }}>—</span>
                      )}
                    </div>
                  </div>
                );
              }

              // full (original style)
              return (
                <div key={b._id} className="card" style={{ boxShadow: "none" }}>
                  <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 320 }}>
                      <div style={{ fontWeight: 1000, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <span>Booking #{String(b._id).slice(-6).toUpperCase()}</span>
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...chip(payStatus) }}>{payStatus}</span>
                      </div>

                      <div className="p" style={{ fontSize: 13 }}>
                        Status: <b>{b.status}</b> • Total: <b>{money(b.total)}</b>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        {fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)} • {b.nights} nights • Guests: {b.guests}
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
                                href={`${api.defaults.baseURL}/my/bookings/hotel/${b._id}/proofs/${p._id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            ))}
                          </span>
                        )}
                      </div>

                      {b.payment?.adminNote ? (
                        <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                          <b>Verification note:</b> {b.payment.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 260 }}>
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
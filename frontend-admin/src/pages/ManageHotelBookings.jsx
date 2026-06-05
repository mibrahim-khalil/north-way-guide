// ManageHotelBookings.jsx
import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const STATUS = ["ALL", "PLACED", "CONFIRMED", "FULFILLED", "CANCELLED"];
const PAY_STATUS = ["ALL", "UNPAID", "SUBMITTED", "PAID", "REJECTED"];

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function statusTone(s) {
  const v = String(s || "").toUpperCase();
  if (v === "FULFILLED" || v === "CONFIRMED") return "ok";
  if (v === "PLACED") return "warn";
  if (v === "CANCELLED") return "danger";
  return "neutral";
}

function payPillStyle(s) {
  const v = String(s || "").toUpperCase();
  if (v === "PAID") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (v === "SUBMITTED") return { background: "rgba(245,158,11,0.15)", color: "rgb(146,64,14)" };
  if (v === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 20.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ActionsMenu({ open, anchorRect, onClose, items }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose();
    const onClickAway = () => onClose();
    const onScroll = () => onClose();
    const onResize = () => onClose();

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClickAway);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClickAway);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const width = 280;
  const gap = 8;
  const left = clamp(anchorRect.right - width, 10, window.innerWidth - width - 10);
  const top = clamp(anchorRect.bottom + gap, 10, window.innerHeight - 10);

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top,
        left,
        width,
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(15,23,42,0.10)",
        borderRadius: 14,
        boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        overflow: "hidden",
        zIndex: 99999,
        backdropFilter: "blur(12px)",
      }}
    >
      {items.map((it, idx) => (
        <button
          key={idx}
          type="button"
          disabled={it.disabled}
          onClick={() => {
            if (it.disabled) return;
            it.onClick?.();
            onClose();
          }}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: it.disabled ? "not-allowed" : "pointer",
            fontWeight: 900,
            fontSize: 13,
            color: it.danger ? "#b91c1c" : "#0f172a",
            opacity: it.disabled ? 0.55 : 1,
            borderBottom: idx === items.length - 1 ? "none" : "1px solid rgba(15,23,42,0.06)",
          }}
          title={it.title || ""}
        >
          {it.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

export default function ManageHotelBookings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

  // kebab menu state (same pattern as Manage Events)
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const params = {};
      if (status !== "ALL") params.status = status;
      if (paymentStatus !== "ALL") params.paymentStatus = paymentStatus;

      const res = await api.get("/admin/hotel-bookings", { params });
      setRows(res.data?.items || []);
    } catch (err) {
      setRows([]);
      setPageError(err?.response?.data?.message || "Failed to load hotel bookings");
    } finally {
      setLoading(false);
    }
  }, [status, paymentStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((b) => {
      const hay = [
        b._id,
        b.status,
        b.payment?.status,
        b.payment?.methodLabel,
        b.payment?.transactionId,
        b.contact?.fullName,
        b.contact?.phone,
        b.room?.roomName,
        b.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [rows, q]);

  const setBookingStatus = async (booking, nextStatus) => {
    const ok = window.confirm(
      `Set booking #${String(booking?._id).slice(-6).toUpperCase()} to ${nextStatus}?`
    );
    if (!ok) return;

    try {
      await api.patch(`/admin/hotel-bookings/${booking._id}/status`, { status: nextStatus });
      await fetchBookings();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update booking status");
    }
  };

  const verifyPayment = async (booking, decision) => {
    const ok = window.confirm(
      `Mark payment as ${decision} for booking #${String(booking?._id).slice(-6).toUpperCase()}?`
    );
    if (!ok) return;

    try {
      await api.patch("/admin/payments/verify", {
        targetType: "HOTEL_BOOKING",
        targetId: booking._id,
        decision,
        adminNote: "",
      });
      await fetchBookings();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to verify payment");
    }
  };

  const proofUrl = (bookingId, proofId) =>
    `${api.defaults.baseURL}/admin/payments/proofs/HOTEL_BOOKING/${bookingId}/${proofId}`;

  const openMenu = (bookingId, btnEl) => {
    if (!btnEl) return;
    setMenuFor(bookingId);
    setMenuRect(btnEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setMenuFor(null);
    setMenuRect(null);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .hbTableOuter{
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }
        .hbTableScroll{ overflow-x:auto; }
        .hbTable{
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
          min-width: 1180px;
        }
        .hbTable thead th{
          text-align:left;
          padding: 12px 12px;
          font-size: 12px;
          font-weight: 1000;
          color: rgba(15,23,42,0.82);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(15,23,42,0.10);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .hbTable tbody td{
          padding: 12px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.40);
        }
        .hbTable tbody tr:hover td{
          background: rgba(109,40,217,0.06);
        }
        .hbTable tbody tr:last-child td{
          border-bottom: none;
        }

        .hbTitle{
          font-weight: 1000;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hbSub{
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hbBadge{
          display:inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          border: 1px solid rgba(15,23,42,0.10);
          white-space: nowrap;
        }
        .hbBadge.ok{ background: rgba(16,185,129,0.14); color: #065f46; }
        .hbBadge.warn{ background: rgba(245,158,11,0.14); color: #92400e; }
        .hbBadge.danger{ background: rgba(239,68,68,0.12); color: #7f1d1d; }
        .hbBadge.neutral{ background: rgba(148,163,184,0.16); color: #0f172a; }

        .kebabBtn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.70);
          cursor:pointer;
        }
        .kebabBtn:hover{
          background: rgba(109,40,217,0.06);
          border-color: rgba(109,40,217,0.18);
        }

        .detailsPanel{
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 14px;
          background: rgba(255,255,255,0.70);
          padding: 12px;
          display:grid;
          gap: 12px;
        }
        .proofRow{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          align-items:center;
          justify-content:space-between;
        }
        .proofMeta{
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }
      `}</style>

      {/* Header (same structure as Manage Events) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Manage Hotel Bookings</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Review bookings, verify payments, and update status.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchBookings} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {pageError ? (
        <div className="card">
          <div className="cardBody" style={{ color: "crimson", fontWeight: 900 }}>
            {pageError}
          </div>
        </div>
      ) : null}

      {/* Filters (like Events) */}
      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Search
              </div>
              <input
                className="hmInput"
                placeholder="Search id, name, phone, room, payment..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Status
              </div>
              <select className="hmInput" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Payment
              </div>
              <select
                className="hmInput"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                {PAY_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>Results: {filtered.length}</div>
        </div>
      </div>

      {/* Results Table (same rounded table shell as Events) */}
      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="adminMuted">No bookings</div>
          ) : (
            <div className="hbTableOuter">
              <div className="hbTableScroll">
                <table className="hbTable">
                  <colgroup>
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "13%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Dates</th>
                      <th>Room</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((b) => {
                      const isOpen = openId === b._id;
                      const shortId = String(b._id).slice(-6).toUpperCase();

                      const payStatus = String(b.payment?.status || "UNPAID").toUpperCase();
                      const proofs = b.payment?.proofs || [];

                      const canConfirmOrFulfill =
                        payStatus === "PAID" && b.status !== "CANCELLED" && b.status !== "FULFILLED";

                      const confirmTip = canConfirmOrFulfill
                        ? ""
                        : "Confirm/Fulfill only after payment is PAID";

                      const menuItems = [
                        {
                          label: isOpen ? "Hide details" : "View details",
                          onClick: () => setOpenId(isOpen ? null : b._id),
                        },

                        ...(payStatus === "SUBMITTED"
                          ? [
                              { label: "Verify payment (PAID)", onClick: () => verifyPayment(b, "PAID") },
                              { label: "Reject payment", danger: true, onClick: () => verifyPayment(b, "REJECTED") },
                            ]
                          : []),

                        {
                          label: "Confirm booking",
                          disabled: !canConfirmOrFulfill,
                          title: confirmTip,
                          onClick: () => setBookingStatus(b, "CONFIRMED"),
                        },
                        {
                          label: "Mark fulfilled",
                          disabled: !canConfirmOrFulfill,
                          title: confirmTip,
                          onClick: () => setBookingStatus(b, "FULFILLED"),
                        },
                        {
                          label: "Cancel booking",
                          danger: true,
                          disabled: b.status === "CANCELLED" || b.status === "FULFILLED",
                          onClick: () => setBookingStatus(b, "CANCELLED"),
                        },
                      ];

                      return (
                        <Fragment key={b._id}>
                          <tr>
                            <td>
                              <div className="hbTitle">#{shortId}</div>
                              <div className="hbSub">
                                {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                              </div>
                            </td>

                            <td>
                              <span className={`hbBadge ${statusTone(b.status)}`}>{b.status}</span>
                            </td>

                            <td>
                              <div style={{ display: "grid", gap: 6 }}>
                                <span
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontWeight: 1000,
                                    fontSize: 12,
                                    width: "fit-content",
                                    border: "1px solid rgba(15,23,42,0.10)",
                                    ...payPillStyle(payStatus),
                                  }}
                                >
                                  {payStatus}
                                </span>
                                <div className="hbSub">
                                  {b.payment?.methodLabel || b.payment?.methodCode || "—"}
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="hbTitle">
                                {fmt(b.checkInDate)} → {fmt(b.checkOutDate)}
                              </div>
                              <div className="hbSub">
                                {b.nights} nights • guests: {b.guests}
                              </div>
                            </td>

                            <td>
                              <div className="hbTitle" title={b.room?.roomName || "—"}>
                                {b.room?.roomName || "—"}
                              </div>
                              <div className="hbSub">
                                PKR {Number(b.room?.pricePerNight || 0).toLocaleString("en-PK")}/night
                              </div>
                            </td>

                            <td>
                              <div className="hbTitle" title={b.contact?.fullName || "—"}>
                                {b.contact?.fullName || "—"}
                              </div>
                              <div className="hbSub">{b.contact?.phone || "—"}</div>
                            </td>

                            <td>
                              <div className="hbTitle">{money(b.total)}</div>
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="kebabBtn"
                                title="Actions"
                                onMouseDown={(ev) => ev.stopPropagation()}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  if (menuFor === b._id) return closeMenu();
                                  openMenu(b._id, ev.currentTarget);
                                }}
                              >
                                <KebabIcon />
                              </button>

                              <ActionsMenu
                                open={menuFor === b._id}
                                anchorRect={menuFor === b._id ? menuRect : null}
                                onClose={closeMenu}
                                items={menuItems}
                              />
                            </td>
                          </tr>

                          {isOpen ? (
                            <tr>
                              <td colSpan={8} style={{ padding: 0 }}>
                                <div style={{ padding: 12 }}>
                                  <div className="detailsPanel">
                                    <div style={{ display: "grid", gap: 6 }}>
                                      <div style={{ fontWeight: 1000 }}>Note</div>
                                      <div style={{ color: "rgba(100,116,139,0.95)", fontWeight: 800 }}>
                                        {b.note || "—"}
                                      </div>
                                    </div>

                                    <div style={{ display: "grid", gap: 8 }}>
                                      <div style={{ fontWeight: 1000 }}>Payment Proofs</div>

                                      {proofs.length === 0 ? (
                                        <div className="proofMeta">No proofs uploaded.</div>
                                      ) : (
                                        <div style={{ display: "grid", gap: 8 }}>
                                          {proofs.map((p, idx) => (
                                            <div key={p._id} className="proofRow">
                                              <div className="proofMeta">
                                                Proof {idx + 1}:{" "}
                                                <b style={{ color: "var(--heading)" }}>{p.originalName}</b>{" "}
                                                • {p.size ? Math.round(p.size / 1024) : 0} KB
                                              </div>

                                              <a
                                                className="aBtn"
                                                href={proofUrl(b._id, p._id)}
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {payStatus === "SUBMITTED" ? (
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                          <button className="aBtn primary" onClick={() => verifyPayment(b, "PAID")}>
                                            Verify (PAID)
                                          </button>
                                          <button className="aBtn danger" onClick={() => verifyPayment(b, "REJECTED")}>
                                            Reject
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}

                    {loading ? (
                      <tr>
                        <td colSpan="8" style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          Loading...
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
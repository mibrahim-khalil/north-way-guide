import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const STATUS = ["ALL", "PLACED", "CONFIRMED", "FULFILLED", "CANCELLED"];
const PAY_STATUS = ["ALL", "UNPAID", "SUBMITTED", "PAID", "REJECTED", "REFUNDED"];

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function statusPillClass(s) {
  const v = String(s || "").toUpperCase();
  if (v === "FULFILLED") return "pill ok";
  if (v === "CONFIRMED") return "pill ok";
  if (v === "PLACED") return "pill warn";
  if (v === "CANCELLED") return "pill danger";
  return "pill";
}

function payPillClass(s) {
  const v = String(s || "").toUpperCase();
  if (v === "PAID") return "ok";
  if (v === "SUBMITTED") return "warn";
  if (v === "REJECTED") return "danger";
  if (v === "REFUNDED") return "danger";
  return "neutral";
}

function getApiOrigin() {
  const b = api?.defaults?.baseURL || "";
  if (b.startsWith("http")) return b.replace(/\/api\/?$/, "");
  return "";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

  const width = 260;
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

export default function ManageOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [q, setQ] = useState("");

  const [openId, setOpenId] = useState(null);

  // dropdown state
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setPageError("");
    try {
      const params = {};
      if (status !== "ALL") params.status = status;
      if (paymentStatus !== "ALL") params.paymentStatus = paymentStatus;

      const res = await api.get("/admin/orders", { params });
      setRows(res.data.items || []);
    } catch (err) {
      setRows([]);
      setPageError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status, paymentStatus]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((o) => {
      const hay = [
        o._id,
        o.status,
        o.payment?.status,
        o.payment?.methodLabel,
        o.payment?.transactionId,
        o.shipping?.fullName,
        o.shipping?.phone,
        o.shipping?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [rows, q]);

  const setOrderStatus = async (order, nextStatus) => {
    const ok = window.confirm(
      `Set order #${String(order?._id).slice(-6).toUpperCase()} to ${nextStatus}?`
    );
    if (!ok) return;

    try {
      await api.patch(`/admin/orders/${order._id}/status`, { status: nextStatus });
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update order status");
    }
  };

  const verifyPayment = async (order, decision) => {
    const shortId = String(order?._id).slice(-6).toUpperCase();
    const ok = window.confirm(
      `${decision === "PAID" ? "VERIFY" : "REJECT"} payment for order #${shortId}?`
    );
    if (!ok) return;

    const adminNote =
      decision === "REJECTED" ? window.prompt("Reason / admin note (optional):", "") || "" : "";

    try {
      await api.patch("/admin/payments/verify", {
        targetType: "PRODUCT_ORDER",
        targetId: order._id,
        decision,
        adminNote,
      });
      await fetchOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to verify payment");
    }
  };

  const openProof = (orderId, proofId) => {
    const origin = getApiOrigin();
    const url = `${origin}/api/admin/payments/proofs/PRODUCT_ORDER/${orderId}/${proofId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openMenu = (orderId, btnEl) => {
    if (!btnEl) return;
    setMenuFor(orderId);
    setMenuRect(btnEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setMenuFor(null);
    setMenuRect(null);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .evTableOuter{
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }
        .evTableScroll{ overflow-x:auto; }
        .evTable{
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
          min-width: 1200px;
        }
        .evTable thead th{
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
        .evTable tbody td{
          padding: 12px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.40);
        }
        .evTable tbody tr:hover td{
          background: rgba(109,40,217,0.06);
        }
        .evTable tbody tr:last-child td{
          border-bottom: none;
        }
        .evTitle{
          font-weight: 1000;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .evSub{
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .payChip{
          display: inline-flex;
          width: fit-content;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 1100;
          font-size: 12px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.70);
          line-height: 1;
        }
        .payChip.ok{ background: rgba(16,185,129,0.14); color: rgb(6,95,70); }
        .payChip.warn{ background: rgba(245,158,11,0.14); color: rgb(146,64,14); }
        .payChip.danger{ background: rgba(239,68,68,0.12); color: rgb(127,29,29); }
        .payChip.neutral{ background: rgba(148,163,184,0.14); color: rgb(30,41,59); }

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
        .itemRow{
          display:flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.55);
        }
      `}</style>

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
          <h2 style={{ margin: 0 }}>Manage Orders</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Verify payments and manage order statuses.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={() => fetchOrders()} disabled={loading}>
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

      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Search
              </div>
              <input
                className="hmInput"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search id, name, phone, status, txid..."
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

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>
            Results: <b style={{ color: "var(--heading)" }}>{filtered.length}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : (
            <div className="evTableOuter">
              <div className="evTableScroll">
                <table className="evTable">
                  <colgroup>
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Customer</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((o) => {
                      const isOpen = openId === o._id;
                      const shortId = String(o._id).slice(-6).toUpperCase();

                      const payStatus = String(o?.payment?.status || "UNPAID").toUpperCase();
                      const proofs = o?.payment?.proofs || [];
                      const canConfirmOrFulfill = payStatus === "PAID";

                      const payTone = payPillClass(o.payment?.status);

                      const menuItems = [];

                      menuItems.push({
                        label: isOpen ? "Hide details" : "View details",
                        onClick: () => setOpenId(isOpen ? null : o._id),
                      });

                      if (payStatus === "SUBMITTED") {
                        if (proofs.length > 0) {
                          menuItems.push({
                            label: "View payment proof",
                            onClick: () => openProof(o._id, proofs[0]._id),
                          });
                        }
                        menuItems.push({
                          label: "Verify payment (PAID)",
                          onClick: () => verifyPayment(o, "PAID"),
                        });
                        menuItems.push({
                          label: "Reject payment",
                          danger: true,
                          onClick: () => verifyPayment(o, "REJECTED"),
                        });
                      }

                      menuItems.push({
                        label: "Confirm order",
                        disabled:
                          !canConfirmOrFulfill ||
                          o.status === "CANCELLED" ||
                          o.status === "FULFILLED",
                        title: !canConfirmOrFulfill ? "Cannot confirm until payment is PAID." : "",
                        onClick: () => setOrderStatus(o, "CONFIRMED"),
                      });

                      menuItems.push({
                        label: "Mark fulfilled",
                        disabled:
                          !canConfirmOrFulfill ||
                          o.status === "CANCELLED" ||
                          o.status === "FULFILLED",
                        title: !canConfirmOrFulfill ? "Cannot fulfill until payment is PAID." : "",
                        onClick: () => setOrderStatus(o, "FULFILLED"),
                      });

                      menuItems.push({
                        label: "Cancel order",
                        danger: true,
                        disabled: o.status === "CANCELLED" || o.status === "FULFILLED",
                        onClick: () => setOrderStatus(o, "CANCELLED"),
                      });

                      return (
                        <Fragment key={o._id}>
                          <tr>
                            <td>
                              <div className="evTitle">#{shortId}</div>
                              <div className="evSub">
                                items: {(o.items || []).length} •{" "}
                                {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                              </div>
                            </td>

                            <td>
                              <span className={statusPillClass(o.status)}>{o.status}</span>
                            </td>

                            <td>
                              <div style={{ display: "grid", gap: 6 }}>
                                <span className={`payChip ${payTone}`}>{o.payment?.status || "—"}</span>
                                <div className="evSub" style={{ marginTop: 0 }}>
                                  {o.payment?.methodLabel || o.payment?.methodCode || "—"}
                                  {o.payment?.transactionId ? ` • ${o.payment.transactionId}` : ""}
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="evTitle">{money(o.total)}</div>
                              <div className="evSub">subtotal: {money(o.subtotal)}</div>
                            </td>

                            <td>
                              <div className="evTitle">{o.shipping?.fullName || "—"}</div>
                              <div className="evSub">{o.shipping?.phone || "—"}</div>
                              <div className="evSub">{o.shipping?.address || "—"}</div>
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="kebabBtn"
                                title="Actions"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (menuFor === o._id) return closeMenu();
                                  openMenu(o._id, e.currentTarget);
                                }}
                              >
                                <KebabIcon />
                              </button>

                              <ActionsMenu
                                open={menuFor === o._id}
                                anchorRect={menuFor === o._id ? menuRect : null}
                                onClose={closeMenu}
                                items={menuItems}
                              />
                            </td>
                          </tr>

                          {isOpen ? (
                            <tr>
                              <td colSpan={6} style={{ padding: 0 }}>
                                <div style={{ padding: 12 }}>
                                  <div className="detailsPanel">
                                    <div style={{ fontWeight: 1000 }}>Items</div>

                                    {(o.items || []).length === 0 ? (
                                      <div className="adminMuted" style={{ fontWeight: 900 }}>
                                        No items.
                                      </div>
                                    ) : (
                                      <div style={{ display: "grid", gap: 8 }}>
                                        {(o.items || []).map((it, idx) => (
                                          <div key={idx} className="itemRow">
                                            <div style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                                              {it.name} × {it.quantity}
                                            </div>
                                            <div style={{ fontWeight: 1000, color: "var(--heading)" }}>
                                              {money(it.lineTotal)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {payStatus === "SUBMITTED" && proofs.length > 1 ? (
                                      <div style={{ marginTop: 4 }}>
                                        <div style={{ fontWeight: 1000, marginBottom: 8 }}>Proof Files</div>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          {proofs.map((p) => (
                                            <button
                                              key={p._id}
                                              className="aBtn"
                                              type="button"
                                              onClick={() => openProof(o._id, p._id)}
                                            >
                                              {p.originalName || "Proof"}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}

                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No orders found.
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
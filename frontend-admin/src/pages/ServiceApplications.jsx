import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const SERVICE_OPTS = [
  { value: "all", label: "All" },
  { value: "HOTEL", label: "Hotel" },
  { value: "GUIDE", label: "Guide" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "PRODUCT_VENDOR", label: "Vendor / Shop" },
];

const STATUS_OPTS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "all", label: "All" },
];

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.applications)) return data.applications;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data?.data?.applications)) return data.data.applications;
  return [];
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

function pillClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "ok";
  if (s === "PENDING") return "warn";
  if (s === "REJECTED") return "bad";
  return "";
}

function formatPreview(app) {
  const t = String(app?.serviceType || "").toUpperCase();
  const p = app?.payload || {};

  if (t === "HOTEL") {
    const rooms = Array.isArray(p.rooms) ? p.rooms.length : 0;
    const imgs = Array.isArray(p.images) ? p.images.length : 0;
    return `${p?.name || "Hotel"} (${p?.city || "—"}) • rooms: ${rooms} • images: ${imgs}`;
  }

  if (t === "GUIDE") {
    const docs = (app?.documents || []).length;
    return `${p?.name || "Guide"} (${p?.baseCity || "—"}) • docs: ${docs}`;
  }

  if (t === "TRANSPORT") {
    const routes = Array.isArray(p.routes) ? p.routes.length : 0;
    return `${p?.providerName || "Transport"} • routes: ${routes}`;
  }

  if (t === "PRODUCT_VENDOR") {
    return `${p?.shopName || "Vendor"} (${p?.city || "—"})`;
  }

  return "—";
}

function safeJson(x) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 99999,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(980px, 100%)",
          maxHeight: "86vh",
          overflow: "auto",
          borderRadius: 18,
        }}
      >
        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button className="aBtn" type="button" onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ marginTop: 12 }}>{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ServiceApplications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [serviceType, setServiceType] = useState("all");
  const [status, setStatus] = useState("PENDING");

  // modal
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // kebab menu
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const params = {};
      if (serviceType !== "all") params.serviceType = serviceType;
      if (status !== "all") params.status = status;

      const res = await api.get("/admin/applications", { params });
      setRows(pickItems(res.data));
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    let arr = [...rows];

    // local search (server already filtered by serviceType/status)
    if (query) {
      arr = arr.filter((a) => {
        const u = a?.userId || {};
        const p = a?.payload || {};
        const blob = `${a?.serviceType || ""} ${a?.status || ""} ${a?.adminNote || ""} ${u?.name || ""} ${u?.email || ""} ${u?.phone || ""} ${safeJson(p)}`.toLowerCase();
        return blob.includes(query);
      });
    }

    // sort newest first
    arr.sort((A, B) => (new Date(B?.createdAt || 0).getTime() || 0) - (new Date(A?.createdAt || 0).getTime() || 0));

    return arr;
  }, [rows, q]);

  const openView = (app) => {
    setViewing(app);
    setAdminNote(app?.adminNote || "");
    setOpen(true);
  };

  const closeView = () => {
    setOpen(false);
    setViewing(null);
    setAdminNote("");
  };

  const openMenu = (id, btnEl) => {
    if (!btnEl) return;
    setMenuFor(id);
    setMenuRect(btnEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setMenuFor(null);
    setMenuRect(null);
  };

  const patchStatus = async (app, nextStatus) => {
    const id = app?._id;
    if (!id) return;

    const ok = window.confirm(`Set status to ${nextStatus}?`);
    if (!ok) return;

    try {
      await api.patch(`/admin/applications/${id}`, {
        status: nextStatus,
        adminNote: adminNote || "",
      });
      closeView();
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to update application");
    }
  };

  const downloadDoc = async (appId, doc) => {
    try {
      const res = await api.get(`/admin/applications/${appId}/documents/${doc._id}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: doc?.mimeType || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = doc?.originalName || doc?.filename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to download document");
    }
  };

  const onApplyFilters = async () => {
    // fetch from server with filters
    setErr("");
    setLoading(true);
    try {
      const params = {};
      if (serviceType !== "all") params.serviceType = serviceType;
      if (status !== "all") params.status = status;

      const res = await api.get("/admin/applications", { params });
      setRows(pickItems(res.data));
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .apTableOuter{
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }
        .apTableScroll{ overflow-x:auto; }
        .apTable{
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
          min-width: 1180px;
        }
        .apTable thead th{
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
        .apTable tbody td{
          padding: 12px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.40);
        }
        .apTable tbody tr:hover td{
          background: rgba(109,40,217,0.06);
        }
        .apTable tbody tr:last-child td{ border-bottom:none; }

        .apTitle{
          font-weight: 1000;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .apSub{
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pillX{
          display:inline-flex;
          align-items:center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 1000;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.65);
          color: rgba(15,23,42,0.80);
          white-space: nowrap;
        }
        .pillX.ok{
          border-color: rgba(16,185,129,0.25);
          background: rgba(16,185,129,0.12);
          color: rgba(5,150,105,0.95);
        }
        .pillX.warn{
          border-color: rgba(245,158,11,0.25);
          background: rgba(245,158,11,0.12);
          color: rgba(180,83,9,0.95);
        }
        .pillX.bad{
          border-color: rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.12);
          color: rgba(185,28,28,0.95);
        }

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

        @media (max-width: 980px){
          .apFiltersGrid{ grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
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
          <h2 style={{ margin: 0 }}>Service Applications</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Review pending applications and approve or reject listings.
          </div>
          {err ? (
            <div style={{ color: "crimson", fontWeight: 900, marginTop: 8 }}>
              {err}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchAll} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters (same layout style as Events) */}
      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div
            className="apFiltersGrid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Search
              </div>
              <input
                className="hmInput"
                placeholder="Search user, email, payload..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Service Type
              </div>
              <select className="hmInput" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                {SERVICE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Status
              </div>
              <select className="hmInput" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: 900, color: "var(--muted)" }}>
              Results: {items.length}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="aBtn primary" type="button" onClick={onApplyFilters} disabled={loading}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : (
            <div className="apTableOuter">
              <div className="apTableScroll">
                <table className="apTable">
                  <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Payload Preview</th>
                      <th>Docs</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((a) => {
                      const u = a?.userId || {};
                      const docsCount = (a?.documents || []).length;
                      const st = String(a?.status || "").toUpperCase();
                      const pending = st === "PENDING";

                      const menuItems = [
                        { label: "View", onClick: () => openView(a) },
                        {
                          label: "Approve",
                          disabled: !pending,
                          onClick: () => {
                            setViewing(a);
                            setAdminNote(a?.adminNote || "");
                            setOpen(true);
                            // approve from modal or directly:
                            setTimeout(() => patchStatus(a, "APPROVED"), 0);
                          },
                        },
                        {
                          label: "Reject",
                          danger: true,
                          disabled: !pending,
                          onClick: () => {
                            setViewing(a);
                            setAdminNote(a?.adminNote || "");
                            setOpen(true);
                            setTimeout(() => patchStatus(a, "REJECTED"), 0);
                          },
                        },
                      ];

                      return (
                        <tr key={a._id}>
                          <td>
                            <div className="apTitle" title={u?.name || "—"}>{u?.name || "—"}</div>
                            <div className="apSub" title={`${u?.email || "—"} ${u?.phone || ""}`}>
                              {u?.email || "—"} {u?.phone ? `• ${u.phone}` : ""}
                            </div>
                          </td>

                          <td style={{ fontWeight: 1000 }}>{String(a?.serviceType || "—").toUpperCase()}</td>

                          <td>
                            <span className={`pillX ${pillClass(a?.status)}`}>{String(a?.status || "—").toUpperCase()}</span>
                          </td>

                          <td>
                            <div className="apTitle" title={formatPreview(a)} style={{ fontWeight: 900 }}>
                              {formatPreview(a)}
                            </div>
                            {a?.adminNote ? (
                              <div className="apSub" title={a.adminNote}>
                                <b>Admin note:</b> {a.adminNote}
                              </div>
                            ) : (
                              <div className="apSub">—</div>
                            )}
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            {docsCount > 0 ? `${docsCount} file(s)` : "—"}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="kebabBtn"
                              title="Actions"
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (menuFor === a._id) return closeMenu();
                                openMenu(a._id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === a._id}
                              anchorRect={menuFor === a._id ? menuRect : null}
                              onClose={closeMenu}
                              items={menuItems}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No applications found.
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

      {/* View Modal */}
      <Modal
        open={open}
        title={
          viewing
            ? `Application • ${String(viewing.serviceType || "").toUpperCase()} • ${String(viewing.status || "").toUpperCase()}`
            : "Application"
        }
        onClose={closeView}
      >
        {!viewing ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody" style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 1000 }}>Admin Note</div>
                <textarea
                  className="hmInput"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Optional note / rejection reason..."
                />

                {String(viewing?.status || "").toUpperCase() === "PENDING" ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className="aBtn" type="button" onClick={() => patchStatus(viewing, "REJECTED")} style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}>
                      Reject
                    </button>
                    <button className="aBtn primary" type="button" onClick={() => patchStatus(viewing, "APPROVED")}>
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="apSub">No actions (already {String(viewing.status || "").toLowerCase()}).</div>
                )}
              </div>
            </div>

            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody">
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Payload</div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.45,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(15,23,42,0.08)",
                    background: "rgba(15,23,42,0.03)",
                    overflow: "auto",
                  }}
                >
                  {safeJson(viewing.payload || {})}
                </pre>
              </div>
            </div>

            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody">
                <div style={{ fontWeight: 1000, marginBottom: 8 }}>Documents</div>
                {(viewing.documents || []).length === 0 ? (
                  <div className="adminMuted">No documents.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {(viewing.documents || []).map((d) => (
                      <div
                        key={d._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(15,23,42,0.08)",
                          background: "rgba(255,255,255,0.65)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 1000 }}>{d.originalName || d.filename}</div>
                          <div className="apSub">
                            {(d.mimeType || "file")} • {Math.round((d.size || 0) / 1024)} KB
                          </div>
                        </div>
                        <button className="aBtn" type="button" onClick={() => downloadDoc(viewing._id, d)}>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
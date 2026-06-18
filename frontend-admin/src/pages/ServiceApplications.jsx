import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const SERVICE_TYPES = ["ALL", "HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"];
const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function pillStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return { background: "rgba(16,185,129,0.14)", color: "rgb(6,95,70)", border: "1px solid rgba(16,185,129,0.25)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.12)", color: "rgb(127,29,29)", border: "1px solid rgba(239,68,68,0.25)" };
  if (s === "PENDING") return { background: "rgba(59,130,246,0.12)", color: "rgb(30,64,175)", border: "1px solid rgba(59,130,246,0.25)" };
  return { background: "rgba(100,116,139,0.10)", color: "rgb(51,65,85)", border: "1px solid rgba(100,116,139,0.22)" };
}

function StatusPill({ status }) {
  const s = String(status || "PENDING").toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        ...pillStyle(s),
      }}
    >
      {s}
    </span>
  );
}

function safeJson(x) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function previewText(app) {
  const t = String(app?.serviceType || "").toUpperCase();
  const p = app?.payload || {};

  if (t === "HOTEL") {
    const rooms = Array.isArray(p?.rooms) ? p.rooms.length : 0;
    const imgs = Array.isArray(p?.images) ? p.images.length : 0;
    return `${p?.name || "Hotel"} (${p?.city || "—"}) • rooms: ${rooms} • images: ${imgs}`;
  }

  if (t === "GUIDE") {
    const imgs = Array.isArray(p?.images) ? p.images.length : 0;
    return `${p?.name || "Guide"} (${p?.baseCity || "—"}) • images: ${imgs}`;
  }

  if (t === "TRANSPORT") {
    const routes = Array.isArray(p?.routes) ? p.routes.length : 0;
    return `${p?.providerName || "Transport"} • routes: ${routes}`;
  }

  if (t === "PRODUCT_VENDOR") {
    return `${p?.shopName || "Vendor"} (${p?.city || "—"})`;
  }

  return "—";
}

function Modal({ open, title, onClose, children, right }) {
  if (!open) return null;
  return (
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
        zIndex: 9999,
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {right}
              <button className="btn" type="button" onClick={onClose}>Close</button>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [serviceType, setServiceType] = useState("ALL");
  const [status, setStatus] = useState("PENDING");
  const [q, setQ] = useState("");

  const [viewing, setViewing] = useState(null); // app
  const [adminNote, setAdminNote] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (serviceType !== "ALL") params.serviceType = serviceType;
      if (status !== "ALL") params.status = status;

      const res = await api.get("/admin/applications", { params });
      setItems(res.data?.applications || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, status]);

  const filtered = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return items;

    return items.filter((a) => {
      const u = a?.userId || {};
      const p = a?.payload || {};

      const blob = [
        a?.serviceType,
        a?.status,
        a?.adminNote,
        u?.name,
        u?.email,
        u?.phone,
        p?.name,
        p?.city,
        p?.baseCity,
        p?.providerName,
        p?.shopName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });
  }, [items, q]);

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

  const patchStatus = async (app, nextStatus) => {
    const id = app?._id;
    if (!id) return;

    const ok = window.confirm(`Set status to ${nextStatus}?`);
    if (!ok) return;

    try {
      await api.patch(`/admin/applications/${id}`, { status: nextStatus, adminNote: adminNote || "" });
      setViewing(null);
      setAdminNote("");
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update application");
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <style>{`
        .saToolbar{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          align-items: end;
        }
        @media (max-width: 900px){
          .saToolbar{ grid-template-columns: 1fr; }
        }
        .saTopRow{
          display:flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .saTableWrap{
          overflow-x:auto;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 16px;
          background: #fff;
        }
        table.saTable{
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          font-size: 14px;
        }
        .saTable th{
          text-align: left;
          padding: 12px;
          background: rgba(15,23,42,0.04);
          color: rgba(15,23,42,0.65);
          font-weight: 1000;
          border-bottom: 1px solid rgba(15,23,42,0.08);
        }
        .saTable td{
          padding: 12px;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          vertical-align: middle;
        }
        .saUserName{ font-weight: 1000; }
        .saSub{ font-size: 12px; color: rgba(15,23,42,0.65); font-weight: 800; margin-top: 4px; }
        .saActions{ display:flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
      `}</style>

      <div className="saTopRow">
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Service Applications</h2>
          <p className="p" style={{ margin: 0 }}>
            Review pending applications and approve or reject listings.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={fetchAll} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <div className="saToolbar">
            <div>
              <label>Service Type</label>
              <select className="input" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                {SERVICE_TYPES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Search</label>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by user, email, service name, city, provider..."
              />
            </div>
          </div>

          <div className="p" style={{ marginTop: 10, fontWeight: 900 }}>
            Results: {filtered.length}
          </div>
        </div>
      </div>

      <div className="saTableWrap">
        <table className="saTable">
          <thead>
            <tr>
              <th style={{ width: 320 }}>User</th>
              <th style={{ width: 120 }}>Service</th>
              <th style={{ width: 140 }}>Status</th>
              <th>Payload Preview</th>
              <th style={{ width: 120 }}>Docs</th>
              <th style={{ width: 180 }}>Submitted</th>
              <th style={{ width: 220, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const u = a?.userId || {};
              const docsCount = (a?.documents || []).length;
              const isPending = String(a?.status || "").toUpperCase() === "PENDING";

              return (
                <tr key={a._id}>
                  <td>
                    <div className="saUserName">{u?.name || "—"}</div>
                    <div className="saSub">{u?.email || "—"} {u?.phone ? `• ${u.phone}` : ""}</div>
                  </td>

                  <td style={{ fontWeight: 1000 }}>{String(a?.serviceType || "—").toUpperCase()}</td>

                  <td>
                    <StatusPill status={a?.status} />
                  </td>

                  <td style={{ color: "rgba(15,23,42,0.75)", fontWeight: 800 }}>
                    {previewText(a)}
                    {a?.adminNote ? <div className="saSub"><b>Admin note:</b> {a.adminNote}</div> : null}
                  </td>

                  <td style={{ fontWeight: 900 }}>
                    {docsCount > 0 ? `${docsCount} file(s)` : "—"}
                  </td>

                  <td className="saSub">
                    {a?.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                  </td>

                  <td>
                    <div className="saActions">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setViewing(a);
                          setAdminNote(a?.adminNote || "");
                        }}
                      >
                        View
                      </button>

                      {isPending ? (
                        <>
                          <button className="btn primary" type="button" onClick={() => patchStatus(a, "APPROVED")}>
                            Approve
                          </button>
                          <button
                            className="btn"
                            type="button"
                            style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                            onClick={() => patchStatus(a, "REJECTED")}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="saSub" style={{ alignSelf: "center" }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 18 }}>
                  <div className="p" style={{ margin: 0 }}>No applications found.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!viewing}
        title={viewing ? `Application • ${String(viewing.serviceType || "").toUpperCase()} • ${String(viewing.status || "").toUpperCase()}` : ""}
        onClose={() => setViewing(null)}
        right={
          viewing && String(viewing?.status || "").toUpperCase() === "PENDING" ? (
            <>
              <button className="btn primary" type="button" onClick={() => patchStatus(viewing, "APPROVED")}>
                Approve
              </button>
              <button
                className="btn"
                type="button"
                style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                onClick={() => patchStatus(viewing, "REJECTED")}
              >
                Reject
              </button>
            </>
          ) : null
        }
      >
        {viewing ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label>Admin Note (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Reason or internal note..."
              />
              <div className="saSub">
                Tip: Add a short reason if rejecting, so the seller knows what to fix.
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
                  <div className="p">No documents.</div>
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
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 1000 }}>{d.originalName || d.filename}</div>
                          <div className="saSub">
                            {(d.mimeType || "file")} • {Math.round((d.size || 0) / 1024)} KB
                          </div>
                        </div>
                        <button className="btn" type="button" onClick={() => downloadDoc(viewing._id, d)}>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
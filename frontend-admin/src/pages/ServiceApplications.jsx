import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const STATUS = ["PENDING", "APPROVED", "REJECTED"];
const TYPES = ["HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"];

function apiOrigin() {
  // api.baseURL = "http://localhost:5000/api"
  const b = api?.defaults?.baseURL || "http://localhost:5000/api";
  return b.replace(/\/api\/?$/, "");
}

function pretty(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function payloadPreview(app) {
  const p = app?.payload || {};
  if (app.serviceType === "HOTEL")
    return `${p?.name || "—"} (${p?.city || "—"}) • rooms: ${(p?.rooms || []).length}`;
  if (app.serviceType === "GUIDE")
    return `${p?.name || "—"} (${p?.baseCity || "—"}) • docs: ${(app?.documents || []).length}`;
  return "—";
}

function ViewModal({ open, onClose, app }) {
  if (!open || !app) return null;

  const origin = apiOrigin();
  const downloadDoc = (docId) => {
    window.open(`${origin}/api/admin/applications/${app._id}/documents/${docId}`, "_blank");
  };

  return createPortal(
    <>
      <div className="saOverlay" onClick={onClose} />
      <div className="saModal" role="dialog" aria-modal="true">
        <div className="saModalTop">
          <div>
            <div className="saModalTitle">Application Details</div>
            <div className="saModalSub">
              {app.serviceType} • {app.status}
            </div>
          </div>
          <button className="aBtn" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div className="aCard" style={{ padding: 12 }}>
            <div style={{ fontWeight: 1000, marginBottom: 6 }}>User</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--heading)" }}>
              <div>
                <span style={{ color: "var(--muted)" }}>Name:</span> {app.userId?.name || "—"}
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Email:</span> {app.userId?.email || "—"}
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Phone:</span> {app.userId?.phone || "—"}
              </div>
            </div>
          </div>

          <div className="aCard" style={{ padding: 12 }}>
            <div style={{ fontWeight: 1000, marginBottom: 6 }}>Payload</div>
            <pre className="saPre">{pretty(app.payload)}</pre>
          </div>

          {app.serviceType === "GUIDE" && (
            <div className="aCard" style={{ padding: 12 }}>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Documents (Admin only)</div>

              {(app.documents || []).length === 0 ? (
                <div className="adminMuted" style={{ fontWeight: 900 }}>
                  No documents uploaded.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {(app.documents || []).map((d) => (
                    <div key={d._id} className="saDocRow">
                      <div style={{ minWidth: 0 }}>
                        <div className="saDocName">{d.originalName}</div>
                        <div className="saDocMeta">
                          {d.mimeType} • {Math.round((d.size || 0) / 1024)} KB
                        </div>
                      </div>
                      <button className="aBtn primary" onClick={() => downloadDoc(d._id)}>
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {app.adminNote ? (
            <div className="aCard" style={{ padding: 12 }}>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Admin Note</div>
              <div style={{ fontWeight: 900, opacity: 0.9 }}>{app.adminNote}</div>
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function ServiceApplications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("PENDING");
  const [serviceType, setServiceType] = useState("HOTEL");

  const [viewing, setViewing] = useState(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/applications", {
        params: { status, serviceType },
      });
      setRows(res.data.applications || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load applications");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [status, serviceType]);

  const approve = async (id) => {
    const ok = confirm("Approve this application? This will create the real listing.");
    if (!ok) return;

    try {
      await api.patch(`/admin/applications/${id}`, { status: "APPROVED" });
      await fetchApps();
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    }
  };

  const reject = async (id) => {
    const note = prompt("Reject note (optional):") || "";
    try {
      await api.patch(`/admin/applications/${id}`, { status: "REJECTED", adminNote: note });
      await fetchApps();
    } catch (e) {
      alert(e?.response?.data?.message || "Reject failed");
    }
  };

  const items = useMemo(() => rows, [rows]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* ✅ Styles aligned with Manage Events / Settings */}
      <style>{`
        .saTop{
          display:flex;
          justify-content: space-between;
          align-items: end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .saFilterGrid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 900px){
          .saFilterGrid{ grid-template-columns: 1fr; }
        }

        /* Rounded table container like Events page */
        .saTableWrap{
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }

        .saTable{
          width:100%;
          min-width: 1100px;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
        }

        .saTable thead th{
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

        .saTable tbody td{
          padding: 12px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.40);
        }
        .saTable tbody tr:hover td{
          background: rgba(109,40,217,0.06);
        }
        .saTable tbody tr:last-child td{
          border-bottom: none;
        }

        .saUserName{
          font-weight: 1000;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .saUserEmail{
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .saActions{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        @media (max-width: 900px){
          .saActions{ justify-content: flex-start; }
        }

        /* Modal */
        .saOverlay{
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 9998;
        }
        .saModal{
          position: fixed;
          left: 50%;
          top: 6%;
          transform: translateX(-50%);
          width: min(980px, calc(100% - 24px));
          max-height: 88vh;
          overflow: auto;
          z-index: 9999;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.10);
          border-radius: 18px;
          box-shadow: 0 30px 90px rgba(15,23,42,0.16);
          backdrop-filter: blur(18px);
          padding: 14px;
        }
        .saModalTop{
          display:flex;
          justify-content: space-between;
          align-items:flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .saModalTitle{
          font-weight: 1000;
          font-size: 18px;
          color: var(--heading);
        }
        .saModalSub{
          font-weight: 900;
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }
        .saPre{
          margin: 0;
          padding: 12px;
          border-radius: 12px;
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          overflow: auto;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.4;
        }
        .saDocRow{
          display:flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          border: 1px solid rgba(15,23,42,0.08);
          padding: 10px;
          border-radius: 12px;
          background: rgba(255,255,255,0.55);
        }
        .saDocName{
          font-weight: 1000;
          font-size: 13px;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .saDocMeta{
          font-weight: 800;
          opacity: 0.7;
          font-size: 12px;
          margin-top: 3px;
          color: var(--muted);
        }
      `}</style>

      {/* Top bar like Manage Events */}
      <div className="saTop">
        <div>
          <h2 style={{ margin: 0 }}>Service Applications</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Review pending applications and approve or reject listings.
          </div>
        </div>

        <button className="aBtn" onClick={fetchApps} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Filters card */}
      <div className="aCard" style={{ padding: 16 }}>
        <div className="saFilterGrid">
          <div>
            <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              Service Type
            </div>
            <select className="smInput" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              Status
            </div>
            <select className="smInput" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adminMuted" style={{ fontWeight: 900, marginTop: 10 }}>
          Results: <b style={{ color: "var(--heading)" }}>{items.length}</b>
        </div>
      </div>

      {/* Results table (rounded like Events) */}
      <div className="aCard" style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div className="adminMuted" style={{ fontWeight: 900 }}>
            {loading ? "Loading..." : "No applications found."}
          </div>
        ) : (
          <div className="saTableWrap">
            <table className="saTable">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "24%" }} />
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
                {items.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="saUserName" title={a.userId?.name || "—"}>
                        {a.userId?.name || "—"}
                      </div>
                      <div className="saUserEmail" title={a.userId?.email || "—"}>
                        {a.userId?.email || "—"}
                      </div>
                    </td>

                    <td style={{ fontWeight: 900, color: "var(--heading)" }}>{a.serviceType}</td>

                    <td>
                      <span className={`pill ${a.status === "APPROVED" ? "ok" : a.status === "REJECTED" ? "warn" : ""}`}>
                        {a.status}
                      </span>
                    </td>

                    <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                      {payloadPreview(a)}
                    </td>

                    <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                      {a.serviceType === "GUIDE"
                        ? (a.documents || []).length > 0
                          ? `${a.documents.length} file(s)`
                          : "—"
                        : "—"}
                    </td>

                    <td>
                      <div className="saActions">
                        <button className="aBtn" onClick={() => setViewing(a)}>
                          View
                        </button>

                        {a.status === "PENDING" ? (
                          <>
                            <button className="aBtn primary" onClick={() => approve(a._id)}>
                              Approve
                            </button>
                            <button className="aBtn danger" onClick={() => reject(a._id)}>
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "var(--muted)", fontWeight: 900, alignSelf: "center" }}>
                            No actions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ViewModal open={!!viewing} onClose={() => setViewing(null)} app={viewing} />
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const STATUS = ["PENDING", "APPROVED", "REJECTED"];
const TYPES = ["HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"];

function apiOrigin() {
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
          <button className="aBtn" onClick={onClose}>Close</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div className="aCard" style={{ padding: 12 }}>
            <div style={{ fontWeight: 1000, marginBottom: 6 }}>User</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--heading)" }}>
              <div><span className="adminMuted">Name:</span> {app.userId?.name || "—"}</div>
              <div><span className="adminMuted">Email:</span> {app.userId?.email || "—"}</div>
              <div><span className="adminMuted">Phone:</span> {app.userId?.phone || "—"}</div>
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
      const res = await api.get("/admin/applications", { params: { status, serviceType } });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="saTop">
        <div>
          <h2 style={{ margin: 0 }}>Service Applications</h2>
          <div className="adminMuted" style={{ marginTop: 6 }}>
            Review pending applications and approve or reject listings.
          </div>
        </div>

        <button className="aBtn" onClick={fetchApps} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="aCard" style={{ padding: 16 }}>
        <div className="saFilterGrid">
          <div>
            <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              Service Type
            </div>
            <select className="smInput" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="adminMuted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              Status
            </div>
            <select className="smInput" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="adminMuted" style={{ fontWeight: 900, marginTop: 10 }}>
          Results: <b style={{ color: "var(--heading)" }}>{items.length}</b>
        </div>
      </div>

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

                    <td className="adminMuted" style={{ fontWeight: 900 }}>
                      {payloadPreview(a)}
                    </td>

                    <td className="adminMuted" style={{ fontWeight: 900 }}>
                      {a.serviceType === "GUIDE"
                        ? (a.documents || []).length > 0
                          ? `${a.documents.length} file(s)`
                          : "—"
                        : "—"}
                    </td>

                    <td>
                      <div className="saActions">
                        <button className="aBtn" onClick={() => setViewing(a)}>View</button>

                        {a.status === "PENDING" ? (
                          <>
                            <button className="aBtn primary" onClick={() => approve(a._id)}>Approve</button>
                            <button className="aBtn danger" onClick={() => reject(a._id)}>Reject</button>
                          </>
                        ) : (
                          <span className="adminMuted" style={{ fontWeight: 900, alignSelf: "center" }}>
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
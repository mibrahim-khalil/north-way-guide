import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function ReportDetailsModal({ open, item, onClose, onStatus, onDelete }) {
  const [busy, setBusy] = useState(false);

  const attachments = useMemo(() => {
    return Array.isArray(item?.attachments) ? item.attachments : [];
  }, [item]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const reporter = item.reporterUserId || {};

  const setStatus = async (next) => {
    try {
      setBusy(true);
      await onStatus?.(item._id, next);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = window.confirm("Delete this report?");
    if (!ok) return;
    try {
      setBusy(true);
      await onDelete?.(item._id);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <>
      <style>{`
        .rpOverlay{
          position: fixed;
          inset: 0;
          background: rgba(2,6,23,0.55);
          z-index: 99999;
          display: grid;
          place-items: center;
          padding: 18px;
        }
        .rpModal{
          width: min(980px, 100%);
          max-height: 86vh;
          overflow: auto;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.96);
          box-shadow: 0 30px 120px rgba(0,0,0,0.45);
        }
        .rpHead{
          padding: 14px;
          border-bottom: 1px solid rgba(15,23,42,0.10);
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 10px;
          position: sticky;
          top: 0;
          background: rgba(255,255,255,0.96);
          z-index: 2;
        }
        .rpClose{
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.70);
          cursor: pointer;
          font-weight: 1000;
        }
        .rpClose:hover{
          background: rgba(109,40,217,0.06);
          border-color: rgba(109,40,217,0.18);
        }
        .rpBody{
          padding: 14px;
          display:grid;
          gap: 12px;
        }
        .rpGrid{
          display:grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
        }
        @media (max-width: 900px){
          .rpGrid{ grid-template-columns: 1fr; }
        }
        .rpBox{
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          padding: 12px;
        }
        .rpLabel{
          font-size: 12px;
          font-weight: 1000;
          opacity: 0.78;
          margin-bottom: 6px;
        }
        .rpText{
          font-weight: 900;
          color: var(--heading);
          word-break: break-word;
        }
        .rpMuted{
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          word-break: break-word;
          white-space: pre-wrap;
        }
        .rpAttachGrid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 900px){
          .rpAttachGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .rpAttach{
          border-radius: 14px;
          overflow:hidden;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.70);
          cursor:pointer;
        }
        .rpAttach img{
          width:100%;
          height:110px;
          object-fit:cover;
          display:block;
        }
        .rpPill{
          display:inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          border: 1px solid rgba(15,23,42,0.10);
          white-space: nowrap;
          background: rgba(109,40,217,0.06);
          color: #0f172a;
        }
      `}</style>

      <div className="rpOverlay" onMouseDown={onClose}>
        <div className="rpModal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="rpHead">
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="rpPill">{item.kind}</span>
                <span className="rpPill">{item.status}</span>
                <span className="rpPill">Topic: {item.topic || "—"}</span>
              </div>

              <div style={{ fontWeight: 1100, fontSize: 18, color: "var(--heading)" }}>
                {item.subject || "—"}
              </div>

              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
                Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
              </div>
            </div>

            <button className="rpClose" onClick={onClose} title="Close">
              ✕
            </button>
          </div>

          <div className="rpBody">
            <div className="rpGrid">
              <div className="rpBox">
                <div className="rpLabel">Message</div>
                <div className="rpMuted">{item.message || "—"}</div>
              </div>

              <div className="rpBox">
                <div className="rpLabel">Reporter</div>
                <div className="rpText">{reporter.name || "—"}</div>
                <div className="rpMuted">{reporter.email || ""}</div>
                <div className="rpMuted">{reporter.phone || ""}</div>

                {item.referenceId ? (
                  <>
                    <div className="rpLabel" style={{ marginTop: 10 }}>Reference</div>
                    <div className="rpMuted">{item.referenceId}</div>
                  </>
                ) : null}

                {item.againstUserLabel ? (
                  <>
                    <div className="rpLabel" style={{ marginTop: 10 }}>Against user</div>
                    <div className="rpMuted">{item.againstUserLabel}</div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="rpBox">
              <div className="rpLabel">Update status</div>
              <select
                className="hmInput"
                value={item.status || "OPEN"}
                onChange={(e) => setStatus(e.target.value)}
                disabled={busy}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <button className="aBtn" onClick={() => setStatus("IN_REVIEW")} disabled={busy}>
                  Mark IN_REVIEW
                </button>
                <button className="aBtn" onClick={() => setStatus("RESOLVED")} disabled={busy}>
                  Mark RESOLVED
                </button>
                <button className="aBtn" onClick={() => setStatus("REJECTED")} disabled={busy}>
                  Mark REJECTED
                </button>
                <button className="aBtn" onClick={remove} disabled={busy} style={{ background: "crimson" }}>
                  Delete
                </button>
              </div>
            </div>

            <div className="rpBox">
              <div className="rpLabel">Attachments</div>
              {attachments.length === 0 ? (
                <div className="rpMuted">—</div>
              ) : (
                <div className="rpAttachGrid">
                  {attachments.map((u) => (
                    <div
                      key={u}
                      className="rpAttach"
                      title="Open"
                      onClick={() => window.open(u, "_blank", "noopener,noreferrer")}
                    >
                      <img src={u} alt="attachment" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="aBtn" onClick={onClose} disabled={busy}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
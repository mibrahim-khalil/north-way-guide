import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";
import ReportDetailsModal from "../components/common/ReportDetailsModal";

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

export default function ManageReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  // filters (same pattern as ManageEvents)
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");     // all|COMPLAINT|SUGGESTION
  const [status, setStatus] = useState("all"); // all|OPEN|IN_REVIEW|RESOLVED|REJECTED
  const [sort, setSort] = useState("newest");  // newest|oldest

  // kebab menu
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports");
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let arr = [...items];

    if (query) {
      arr = arr.filter((r) => {
        const u = r.reporterUserId || {};
        const hay = `
          ${r.subject || ""} ${r.message || ""} ${r.topic || ""} ${r.kind || ""}
          ${u.name || ""} ${u.email || ""} ${u.phone || ""}
          ${r.referenceId || ""} ${r.againstUserLabel || ""}
        `.toLowerCase();
        return hay.includes(query);
      });
    }

    if (kind !== "all") arr = arr.filter((r) => r.kind === kind);
    if (status !== "all") arr = arr.filter((r) => r.status === status);

    arr.sort((a, b) => {
      const A = new Date(a.createdAt).getTime() || 0;
      const B = new Date(b.createdAt).getTime() || 0;
      return sort === "newest" ? B - A : A - B;
    });

    return arr;
  }, [items, q, kind, status, sort]);

  const openDetails = (r) => {
    setActive(r);
    setOpen(true);
  };

  const updateStatus = async (id, nextStatus) => {
    const res = await api.patch(`/admin/reports/${id}/status`, { status: nextStatus });
    const updated = res.data?.item;

    if (updated?._id) {
      setItems((prev) => prev.map((x) => (x._id === id ? updated : x)));
      setActive((prev) => (prev?._id === id ? updated : prev));
    } else {
      await fetchAll();
    }
  };

  const remove = async (id) => {
    await api.delete(`/admin/reports/${id}`);
    setItems((prev) => prev.filter((x) => x._id !== id));
    setActive((prev) => (prev?._id === id ? null : prev));
  };

  const openMenu = (reportId, btnEl) => {
    if (!btnEl) return;
    setMenuFor(reportId);
    setMenuRect(btnEl.getBoundingClientRect());
  };

  const closeMenu = () => {
    setMenuFor(null);
    setMenuRect(null);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* same style block approach as ManageEvents */}
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
          min-width: 980px;
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
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .evBadge{
          display:inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          border: 1px solid rgba(15,23,42,0.10);
          white-space: nowrap;
        }
        .evBadge.complaint{ background: rgba(239,68,68,0.10); color: #7f1d1d; }
        .evBadge.suggestion{ background: rgba(59,130,246,0.10); color: #1e3a8a; }

        .evLink{
          font-weight: 900;
          color: #1d4ed8;
          text-decoration: underline;
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
        .clickableTitle{ cursor: pointer; }
        .clickableTitle:hover{ text-decoration: underline; }
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
          <h2 style={{ margin: 0 }}>Manage Reports</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Complaints & Suggestions submitted by users.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchAll}>Refresh</button>
        </div>
      </div>

      {/* Filters (same grid as events) */}
      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Search
              </div>
              <input
                className="hmInput"
                placeholder="Search subject, message, reporter..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Type
              </div>
              <select className="hmInput" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="all">All</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="SUGGESTION">Suggestion</option>
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Status
              </div>
              <select className="hmInput" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Sort
              </div>
              <select className="hmInput" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest → Oldest</option>
                <option value="oldest">Oldest → Newest</option>
              </select>
            </div>
          </div>

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>
            Results: {filtered.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="adminMuted">No reports</div>
          ) : (
            <div className="evTableOuter">
              <div className="evTableScroll">
                <table className="evTable">
                  <colgroup>
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "6%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Subject / Message</th>
                      <th>Type / Topic</th>
                      <th>Reporter</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => {
                      const u = r.reporterUserId || {};
                      const kindClass = r.kind === "COMPLAINT" ? "complaint" : "suggestion";
                      const attCount = Array.isArray(r.attachments) ? r.attachments.length : 0;

                      const menuItems = [
                        { label: "View details", onClick: () => openDetails(r) },
                        ...(attCount
                          ? [
                              {
                                label: `Open attachment (${attCount})`,
                                onClick: () =>
                                  window.open(r.attachments[0], "_blank", "noopener,noreferrer"),
                              },
                            ]
                          : []),
                        { label: "Mark OPEN", onClick: () => updateStatus(r._id, "OPEN") },
                        { label: "Mark IN_REVIEW", onClick: () => updateStatus(r._id, "IN_REVIEW") },
                        { label: "Mark RESOLVED", onClick: () => updateStatus(r._id, "RESOLVED") },
                        { label: "Mark REJECTED", onClick: () => updateStatus(r._id, "REJECTED") },
                        { label: "Delete", danger: true, onClick: () => remove(r._id) },
                      ];

                      return (
                        <tr key={r._id}>
                          <td>
                            <div
                              className="evTitle clickableTitle"
                              title={r.subject || "—"}
                              onClick={() => openDetails(r)}
                            >
                              {r.subject || "—"}
                            </div>
                            <div className="evSub">{r.message || "—"}</div>
                          </td>

                          <td>
                            <span className={`evBadge ${kindClass}`}>{r.kind}</span>
                            <div className="evSub" style={{ marginTop: 8 }}>
                              Topic: <b style={{ color: "var(--heading)" }}>{r.topic || "—"}</b>
                            </div>
                            {attCount ? (
                              <div className="evSub" style={{ marginTop: 6 }}>
                                <a className="evLink" href={r.attachments[0]} target="_blank" rel="noreferrer">
                                  Attachments ({attCount})
                                </a>
                              </div>
                            ) : null}
                          </td>

                          <td>
                            <div className="evTitle" title={u.name || "—"}>{u.name || "—"}</div>
                            <div className="evSub" title={u.email || ""}>{u.email || ""}</div>
                            <div className="evSub" title={u.phone || ""}>{u.phone || ""}</div>
                          </td>

                          <td>
                            <div className="evTitle">{r.status || "—"}</div>
                            <div className="evSub">Use actions to update</div>
                          </td>

                          <td>
                            <div className="evTitle">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                            </div>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="kebabBtn"
                              title="Actions"
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (menuFor === r._id) return closeMenu();
                                openMenu(r._id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === r._id}
                              anchorRect={menuFor === r._id ? menuRect : null}
                              onClose={closeMenu}
                              items={menuItems}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReportDetailsModal
        open={open}
        item={active}
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
        onStatus={updateStatus}
        onDelete={remove}
      />
    </div>
  );
}
import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

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

export default function ManageReviews() {
  const [tab, setTab] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openId, setOpenId] = useState(null);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reviews", { params: { status: tab } });
      setRows(res.data.items || []);
    } catch (e) {
      setRows([]);
      alert(e?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((r) => {
      const hay = [
        r._id,
        r.targetType,
        r.status,
        r.userId?.email,
        r.userId?.name,
        r.comment,
        r.adminNote,
        r.rating,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [rows, q]);

  const approve = async (r) => {
    const ok = window.confirm("Approve this review?");
    if (!ok) return;
    await api.patch(`/admin/reviews/${r._id}/approve`);
    load();
  };

  const reject = async (r) => {
    const note = window.prompt("Reject note (optional):", "");
    if (note === null) return;
    await api.patch(`/admin/reviews/${r._id}/reject`, { adminNote: note });
    load();
  };

  const remove = async (r) => {
    const ok = window.confirm("Delete this review?");
    if (!ok) return;
    await api.delete(`/admin/reviews/${r._id}`);
    load();
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
          min-width: 1100px;
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
          gap: 10px;
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
          <h2 style={{ margin: 0 }}>Manage Reviews</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Approve/Reject user reviews.</div>
        </div>

        <button className="aBtn" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} className={`aBtn ${tab === t ? "primary" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
            <input
              className="hmInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
            />
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
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>User</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const isOpen = openId === r._id;

                      const menuItems = [
                        {
                          label: isOpen ? "Hide details" : "View details",
                          onClick: () => setOpenId(isOpen ? null : r._id),
                        },
                        ...(tab === "PENDING"
                          ? [
                              { label: "Approve", onClick: () => approve(r) },
                              { label: "Reject", danger: true, onClick: () => reject(r) },
                            ]
                          : []),
                        { label: "Delete", danger: true, onClick: () => remove(r) },
                      ];

                      return (
                        <Fragment key={r._id}>
                          <tr>
                            <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.targetType}</td>
                            <td>
                              <div className="evTitle">{r.userId?.name || "—"}</div>
                              <div className="evSub">{r.userId?.email || "—"}</div>
                            </td>
                            <td style={{ fontWeight: 1000, color: "var(--heading)" }}>★ {r.rating}</td>
                            <td>
                              <div className="evTitle" title={r.comment || "—"}>
                                {r.comment || "—"}
                              </div>
                              {r.adminNote ? <div className="evSub">admin note: {r.adminNote}</div> : null}
                            </td>
                            <td>
                              <span
                                className={`pill ${
                                  r.status === "APPROVED" ? "ok" : r.status === "REJECTED" ? "danger" : "warn"
                                }`}
                              >
                                {r.status}
                              </span>
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

                          {isOpen ? (
                            <tr>
                              <td colSpan={6} style={{ padding: 0 }}>
                                <div style={{ padding: 12 }}>
                                  <div className="detailsPanel">
                                    <div>
                                      <div style={{ fontWeight: 1000, marginBottom: 6 }}>Review ID</div>
                                      <div style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r._id}</div>
                                    </div>

                                    <div>
                                      <div style={{ fontWeight: 1000, marginBottom: 6 }}>Comment</div>
                                      <div style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)", whiteSpace: "pre-wrap" }}>
                                        {r.comment || "—"}
                                      </div>
                                    </div>

                                    <div>
                                      <div style={{ fontWeight: 1000, marginBottom: 6 }}>Admin Note</div>
                                      <div style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)", whiteSpace: "pre-wrap" }}>
                                        {r.adminNote || "—"}
                                      </div>
                                    </div>
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
                          No reviews found.
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
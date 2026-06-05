import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";
import EventFormModal from "../components/common/EventFormModal";

const TYPE_OPTS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const PUB_OPTS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

const SORT_OPTS = [
  { value: "startAsc", label: "Start (Soon → Later)" },
  { value: "startDesc", label: "Start (Later → Soon)" },
];

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
}

function mapEvent(doc) {
  return {
    id: doc._id,
    title: doc.title || "",
    location: doc.location || "",
    startDate: doc.startDate || "",
    endDate: doc.endDate || "",
    isPublished: Boolean(doc.isPublished),
    mapUrl: doc.mapUrl || "",
    raw: doc,
  };
}

function formatDateRange(startDate, endDate) {
  const s = new Date(startDate);
  const e = endDate ? new Date(endDate) : null;
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const a = Number.isNaN(s.getTime()) ? "—" : s.toLocaleDateString([], opts);
  const b = e && !Number.isNaN(e.getTime()) ? e.toLocaleDateString([], opts) : "";
  return b ? `${a} - ${b}` : a;
}

function isUpcoming(ev) {
  const now = Date.now();
  const start = new Date(ev.startDate).getTime();
  return Number.isFinite(start) && start >= now;
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

export default function ManageEvents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [published, setPublished] = useState("all");
  const [sort, setSort] = useState("startAsc");

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // kebab menu
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/admin/events");
      const items = pickItems(res.data).map(mapEvent);
      setRows(items);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();

    let arr = [...rows];

    if (query) {
      arr = arr.filter((e) =>
        `${e.title || ""} ${e.location || ""}`.toLowerCase().includes(query)
      );
    }

    if (type === "upcoming") arr = arr.filter(isUpcoming);
    if (type === "past") arr = arr.filter((e) => !isUpcoming(e));

    if (published === "published") arr = arr.filter((e) => e.isPublished);
    if (published === "hidden") arr = arr.filter((e) => !e.isPublished);

    arr.sort((a, b) => {
      const A = new Date(a.startDate).getTime() || 0;
      const B = new Date(b.startDate).getTime() || 0;
      return sort === "startAsc" ? A - B : B - A;
    });

    return arr;
  }, [rows, q, type, published, sort]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (ev) => {
    setEditing(ev.raw || ev);
    setOpen(true);
  };

  const onSave = async (payload) => {
    try {
      if (editing?._id) await api.put(`/admin/events/${editing._id}`, payload);
      else await api.post("/admin/events", payload);

      setOpen(false);
      setEditing(null);
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to save event");
    }
  };

  const remove = async (id, title) => {
    const ok = window.confirm(`Delete "${title || "this event"}"?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/events/${id}`);
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Failed to delete event");
    }
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
          <h2 style={{ margin: 0 }}>Manage Events</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Create upcoming events and keep past history.
          </div>
          {err ? <div style={{ color: "crimson", fontWeight: 900, marginTop: 8 }}>{err}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchAll} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={openCreate}>
            + Add Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Search
              </div>
              <input
                className="hmInput"
                placeholder="Search title or location..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Type
              </div>
              <select className="hmInput" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Published
              </div>
              <select
                className="hmInput"
                value={published}
                onChange={(e) => setPublished(e.target.value)}
              >
                {PUB_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                Sort
              </div>
              <select className="hmInput" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>Results: {items.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : (
            <div className="evTableOuter">
              <div className="evTableScroll">
                <table className="evTable">
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Location</th>
                      <th>Start</th>
                      <th>Published</th>
                      <th>Map</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((e) => {
                      const menuItems = [
                        { label: "Edit", onClick: () => openEdit(e) },
                        { label: "Delete", danger: true, onClick: () => remove(e.id, e.title) },
                      ];

                      const startOk = !Number.isNaN(new Date(e.startDate).getTime());
                      const startLabel = startOk ? new Date(e.startDate).toLocaleString() : "—";

                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="evTitle" title={e.title || "—"}>
                              {e.title || "—"}
                            </div>
                            <div className="evSub">{formatDateRange(e.startDate, e.endDate)}</div>
                          </td>

                          <td>
                            <div className="evTitle" title={e.location || "—"} style={{ fontWeight: 900 }}>
                              {e.location || "—"}
                            </div>
                            <div className="evSub">{isUpcoming(e) ? "Upcoming" : "Past"}</div>
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            {startLabel}
                          </td>

                          <td>
                            <span className={`pillX ${e.isPublished ? "ok" : "warn"}`}>
                              {e.isPublished ? "Published" : "Hidden"}
                            </span>
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            {e.mapUrl ? (
                              <a
                                href={e.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontWeight: 1000, textDecoration: "underline", color: "inherit" }}
                              >
                                Open
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="kebabBtn"
                              title="Actions"
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (menuFor === e.id) return closeMenu();
                                openMenu(e.id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === e.id}
                              anchorRect={menuFor === e.id ? menuRect : null}
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
                          No events found.
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

      <EventFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        initialEvent={editing}
        onSave={onSave}
      />
    </div>
  );
}
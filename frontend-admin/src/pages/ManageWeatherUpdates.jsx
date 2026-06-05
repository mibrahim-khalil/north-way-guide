import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api";
import WeatherPlaceFormModal from "../components/common/WeatherPlaceFormModal";

function mapRow(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    lat: doc.lat,
    lon: doc.lon,
    sortOrder: Number(doc.sortOrder || 0),
    isActive: Boolean(doc.isActive),
  };
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

export default function ManageWeatherUpdates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/weather-places");
      setRows((res.data?.items || []).map(mapRow));
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load weather places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!query) return true;
      const hay = `${r.id} ${r.name} ${r.lat} ${r.lon} ${r.isActive ? "active" : "hidden"}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q]);

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (r) => {
    setEditing(r);
    setOpen(true);
  };

  const onDelete = async (r) => {
    const ok = window.confirm(`Hide "${r.name}"? (Soft delete)`);
    if (!ok) return;
    try {
      await api.delete(`/admin/weather-places/${r.id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Hide failed");
    }
  };

  const onSave = async (payload) => {
    try {
      const body = {
        name: payload.name,
        lat: payload.lat,
        lon: payload.lon,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      };

      if (payload.id) await api.put(`/admin/weather-places/${payload.id}`, body);
      else await api.post("/admin/weather-places", body);

      setOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Save failed");
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
          min-width: 860px;
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
          <h2 style={{ margin: 0 }}>Manage Weather Updates</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Admin manages locations (lat/lon). Website fetches real weather from OpenWeather automatically.
          </div>
          {err ? <div style={{ color: "crimson", fontWeight: 1000, marginTop: 8 }}>{err}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={onAdd}>
            + Add Place
          </button>
        </div>
      </div>

      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
            <input
              className="hmInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search place..."
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
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Place</th>
                      <th>Lat</th>
                      <th>Lon</th>
                      <th>Sort</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => {
                      const menuItems = [
                        { label: "Edit", onClick: () => onEdit(r) },
                        { label: "Hide", danger: true, onClick: () => onDelete(r) },
                      ];

                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="evTitle">{r.name}</div>
                            <div className="evSub">id: {r.id}</div>
                          </td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.lat}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.lon}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.sortOrder}</td>
                          <td>
                            <span className={`pill ${r.isActive ? "ok" : "warn"}`}>
                              {r.isActive ? "Active" : "Hidden"}
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
                                if (menuFor === r.id) return closeMenu();
                                openMenu(r.id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === r.id}
                              anchorRect={menuFor === r.id ? menuRect : null}
                              onClose={closeMenu}
                              items={menuItems}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No places found. Click “Add Place”.
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

      <WeatherPlaceFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={onSave}
      />
    </div>
  );
}
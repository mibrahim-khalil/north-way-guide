import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SpotFormModal from "../components/common/SpotFormModal";
import { api } from "../utils/api";

const SORTS = [
  { value: "name-asc", label: "Name (A → Z)" },
  { value: "district-asc", label: "District (A → Z)" },
  { value: "status-asc", label: "Status (A → Z)" },
  { value: "region-asc", label: "Region (A → Z)" },
];

function toRow(doc) {
  const tags = Array.isArray(doc.tags) ? doc.tags.filter(Boolean) : [];

  return {
    id: doc._id,
    name: doc.title ?? "",
    district: doc.location ?? "",
    region: doc.region || "UNKNOWN",
    description: doc.description ?? "",
    mapsUrl: doc.mapsUrl ?? "",
    tags,
    tag: tags[0] || "",
    status: doc.isActive ? "Published" : "Hidden",
    images: doc.images ?? [],
  };
}

function parseTags(row) {
  if (Array.isArray(row.tags) && row.tags.length) return row.tags.filter(Boolean);

  const raw = String(row.tagsText || row.tag || "").trim();
  if (!raw) return [];

  return raw
    .split(/,|\/|\|/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function toPayload(row) {
  const tags = parseTags(row);

  return {
    title: row.name,
    location: row.district,
    description: row.description || "",
    mapsUrl: row.mapsUrl || "",
    images: Array.isArray(row.images) ? row.images : [],
    tags,
    region: row.region || "UNKNOWN",
    isActive: row.status === "Published",
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

export default function ManageSpots() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("All");
  const [sort, setSort] = useState("name-asc");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchSpots = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await api.get("/spots/admin/all");
      setRows((res.data.items || []).map(toRow));
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load spots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const districts = useMemo(() => {
    const set = new Set(rows.map((s) => s.district).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = rows.filter((s) => {
      const matchDistrict = district === "All" || s.district === district;

      const hay = [
        s.id,
        s.name,
        s.district,
        s.region,
        s.tag,
        s.status,
        s.description,
        s.mapsUrl,
        ...(s.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || hay.includes(query);
      return matchDistrict && matchQ;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name-asc") return String(a.name).localeCompare(String(b.name));
      if (sort === "district-asc") return String(a.district).localeCompare(String(b.district));
      if (sort === "status-asc") return String(a.status).localeCompare(String(b.status));
      if (sort === "region-asc") return String(a.region).localeCompare(String(b.region));
      return 0;
    });

    return list;
  }, [rows, q, district, sort]);

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (spot) => {
    setEditing(spot);
    setOpen(true);
  };

  const onDelete = async (spot) => {
    const ok = window.confirm(`Delete spot "${spot.name}"? (soft delete)`);
    if (!ok) return;

    try {
      await api.delete(`/spots/${spot.id}`);
      await fetchSpots();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const onSave = async (spot) => {
    if (!spot?.name || !spot?.district) {
      alert("Name and District are required");
      return;
    }

    try {
      const payload = toPayload(spot);

      if (editing?.id) await api.put(`/spots/${editing.id}`, payload);
      else await api.post("/spots", payload);

      setOpen(false);
      setEditing(null);
      await fetchSpots();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
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
          <h2 style={{ margin: 0 }}>Manage Tourist Spots</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Add / edit tourist spots and visibility.</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchSpots} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={onAdd}>
            + Add Spot
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
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr .8fr .9fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
              <input className="hmInput" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>District</div>
              <select className="hmInput" value={district} onChange={(e) => setDistrict(e.target.value)}>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Sort</div>
              <select className="hmInput" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
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
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Spot</th>
                      <th>District</th>
                      <th>Region</th>
                      <th>Tag</th>
                      <th>Status</th>
                      <th>Maps</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const menuItems = [
                        { label: "Edit", onClick: () => onEdit(s) },
                        { label: "Delete", danger: true, onClick: () => onDelete(s) },
                      ];

                      return (
                        <tr key={s.id}>
                          <td>
                            <div className="evTitle" title={s.name}>{s.name}</div>
                            <div className="evSub">id: {s.id}</div>
                          </td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{s.district}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{s.region || "UNKNOWN"}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{s.tag || "—"}</td>
                          <td>
                            <span className={`pill ${s.status === "Published" ? "ok" : "warn"}`}>{s.status}</span>
                          </td>
                          <td style={{ fontWeight: 900 }}>
                            {s.mapsUrl ? (
                              <a href={s.mapsUrl} target="_blank" rel="noreferrer">
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
                                if (menuFor === s.id) return closeMenu();
                                openMenu(s.id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === s.id}
                              anchorRect={menuFor === s.id ? menuRect : null}
                              onClose={closeMenu}
                              items={menuItems}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No spots found.
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

      <SpotFormModal
        open={open}
        onClose={() => setOpen(false)}
        initialSpot={editing}
        onSave={onSave}
      />
    </div>
  );
}
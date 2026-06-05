import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import GuideFormModal from "../components/common/GuideFormModal";
import { api } from "../utils/api";

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function mapGuide(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    baseCity: doc.baseCity || "",
    phone: doc.phone || "",
    bio: doc.bio || "",
    rating: Number(doc.rating ?? 0),
    pricePerDay: Number(doc.pricePerDay ?? 0),
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    specialties: Array.isArray(doc.specialties) ? doc.specialties : [],
    images: Array.isArray(doc.images) ? doc.images : [],
    isActive: Boolean(doc.isActive),
  };
}

const SORTS = [
  { value: "rating-desc", label: "Rating (High → Low)" },
  { value: "name-asc", label: "Name (A → Z)" },
  { value: "city-asc", label: "City (A → Z)" },
];

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

export default function ManageGuides() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [tab, setTab] = useState("approved"); // approved | pending

  // Approved filters
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [sort, setSort] = useState("rating-desc");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // kebab menu
  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchGuides = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/guides");
      const items = pickItems(res.data).map(mapGuide);
      setRows(items);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || e.message || "Failed to load guides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const pending = useMemo(() => rows.filter((g) => !g.isActive), [rows]);
  const approved = useMemo(() => rows.filter((g) => g.isActive), [rows]);

  const cities = useMemo(() => {
    const set = new Set(approved.map((g) => g.baseCity).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [approved]);

  const filteredApproved = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = approved.filter((g) => {
      const matchCity = city === "All" || g.baseCity === city;
      const hay = [
        g.id,
        g.name,
        g.baseCity,
        (g.specialties || []).join(" "),
        (g.languages || []).join(" "),
        String(g.pricePerDay || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || hay.includes(query);
      return matchCity && matchQ;
    });

    list = [...list].sort((a, b) => {
      if (sort === "rating-desc") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "name-asc") return String(a.name).localeCompare(String(b.name));
      if (sort === "city-asc") return String(a.baseCity).localeCompare(String(b.baseCity));
      return 0;
    });

    return list;
  }, [approved, q, city, sort]);

  const approve = async (g) => {
    try {
      await api.put(`/guides/${g.id}`, { isActive: true });
      await fetchGuides();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Approve failed");
    }
  };

  const reject = async (g) => {
    const ok = window.confirm(`Reject "${g.name}"? (This will deactivate it)`);
    if (!ok) return;

    try {
      await api.put(`/guides/${g.id}`, { isActive: false });
      await fetchGuides();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Reject failed");
    }
  };

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (g) => {
    setEditing(g);
    setOpen(true);
  };

  const onDelete = async (g) => {
    const ok = window.confirm(`Delete "${g.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/guides/${g.id}`);
      await fetchGuides();
    } catch (e) {
      // fallback deactivate
      try {
        await api.put(`/guides/${g.id}`, { isActive: false });
        await fetchGuides();
      } catch (e2) {
        alert(e2?.response?.data?.message || e2.message || "Delete failed");
      }
    }
  };

  const onSave = async (form) => {
    try {
      const payload = {
        name: form.name,
        baseCity: form.baseCity,
        phone: form.phone,
        bio: form.bio,
        rating: form.rating,
        pricePerDay: form.pricePerDay,
        languages: form.languages,
        specialties: form.specialties,
        images: form.images,
        isActive: form.isActive,
      };

      if (form.id) await api.put(`/guides/${form.id}`, payload);
      else await api.post("/guides", payload);

      setOpen(false);
      setEditing(null);
      await fetchGuides();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Save failed");
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
          <h2 style={{ margin: 0 }}>Manage Guides</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Approve pending guides and manage approved listings.
          </div>
          {err ? <div style={{ color: "crimson", fontWeight: 900, marginTop: 8 }}>{err}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchGuides} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={onAdd}>
            + Add Guide
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className={`aBtn ${tab === "approved" ? "primary" : ""}`} onClick={() => setTab("approved")}>
          Approved ({approved.length})
        </button>
        <button className={`aBtn ${tab === "pending" ? "primary" : ""}`} onClick={() => setTab("pending")}>
          Pending ({pending.length})
        </button>
      </div>

      {/* Approved */}
      {tab === "approved" ? (
        <>
          <div className="card">
            <div className="cardBody" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                    Search
                  </div>
                  <input
                    className="hmInput"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search..."
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                    City
                  </div>
                  <select className="hmInput" value={city} onChange={(e) => setCity(e.target.value)}>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                    Sort
                  </div>
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
                Results: {filteredApproved.length}
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
                        <col style={{ width: "34%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "8%" }} />
                      </colgroup>

                      <thead>
                        <tr>
                          <th>Guide</th>
                          <th>City</th>
                          <th>Rating</th>
                          <th>Price/Day</th>
                          <th>Languages</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredApproved.map((g) => {
                          const menuItems = [
                            { label: "Edit", onClick: () => onEdit(g) },
                            { label: "Delete", danger: true, onClick: () => onDelete(g) },
                          ];

                          return (
                            <tr key={g.id}>
                              <td>
                                <div className="evTitle" title={g.name}>
                                  {g.name}
                                </div>
                                <div className="evSub">id: {g.id}</div>
                              </td>
                              <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                                {g.baseCity || "—"}
                              </td>
                              <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                                {g.rating ?? 0}
                              </td>
                              <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                                {g.pricePerDay ? `PKR ${g.pricePerDay}` : "—"}
                              </td>
                              <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                                {(g.languages || []).join(", ") || "—"}
                              </td>

                              <td style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  className="kebabBtn"
                                  title="Actions"
                                  onMouseDown={(ev) => ev.stopPropagation()}
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    if (menuFor === g.id) return closeMenu();
                                    openMenu(g.id, ev.currentTarget);
                                  }}
                                >
                                  <KebabIcon />
                                </button>

                                <ActionsMenu
                                  open={menuFor === g.id}
                                  anchorRect={menuFor === g.id ? menuRect : null}
                                  onClose={closeMenu}
                                  items={menuItems}
                                />
                              </td>
                            </tr>
                          );
                        })}

                        {!loading && filteredApproved.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                              No approved guides found.
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
        </>
      ) : (
        /* Pending */
        <div className="card">
          <div className="cardBody">
            <div style={{ fontWeight: 900, color: "var(--muted)", marginBottom: 10 }}>
              Results: {pending.length}
            </div>

            {loading ? (
              <div className="adminMuted">Loading...</div>
            ) : (
              <div className="evTableOuter">
                <div className="evTableScroll">
                  <table className="evTable" style={{ minWidth: 950 }}>
                    <colgroup>
                      <col style={{ width: "36%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "8%" }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>Guide</th>
                        <th>City</th>
                        <th>Price/Day</th>
                        <th>Specialties</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pending.map((g) => {
                        const menuItems = [
                          { label: "View / Edit", onClick: () => onEdit(g) },
                          { label: "Approve", onClick: () => approve(g) },
                          { label: "Reject", danger: true, onClick: () => reject(g) },
                          { label: "Delete", danger: true, onClick: () => onDelete(g) },
                        ];

                        return (
                          <tr key={g.id}>
                            <td>
                              <div className="evTitle" title={g.name}>
                                {g.name}
                              </div>
                              <div className="evSub">id: {g.id}</div>
                            </td>
                            <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                              {g.baseCity || "—"}
                            </td>
                            <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                              {g.pricePerDay ? `PKR ${g.pricePerDay}` : "—"}
                            </td>
                            <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                              {(g.specialties || []).join(", ") || "—"}
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="kebabBtn"
                                title="Actions"
                                onMouseDown={(ev) => ev.stopPropagation()}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  if (menuFor === g.id) return closeMenu();
                                  openMenu(g.id, ev.currentTarget);
                                }}
                              >
                                <KebabIcon />
                              </button>

                              <ActionsMenu
                                open={menuFor === g.id}
                                anchorRect={menuFor === g.id ? menuRect : null}
                                onClose={closeMenu}
                                items={menuItems}
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {!loading && pending.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                            No pending guides.
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
      )}

      <GuideFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        initialGuide={editing}
        onSave={onSave}
      />
    </div>
  );
}
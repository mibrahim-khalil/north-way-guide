import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import TransportFormModal from "../components/common/TransportFormModal";
import { api } from "../utils/api";

const SORTS = [
  { value: "fare-asc", label: "Fare (Low → High)" },
  { value: "fare-desc", label: "Fare (High → Low)" },
  { value: "route-asc", label: "Route (A → Z)" },
];

function toRow(doc) {
  return {
    id: doc._id,

    providerName: doc.providerName || "",
    contactPhone: doc.contactPhone || "",
    whatsapp: doc.whatsapp || "",
    bookingUrl: doc.bookingUrl || "",
    officeCity: doc.officeCity || "",
    officeAddress: doc.officeAddress || "",
    officeMapsUrl: doc.officeMapsUrl || "",

    from: doc.from || "",
    to: doc.to || "",
    type: doc.type || "Local",
    fare: Number(doc.fare || 0),
    availability: doc.availability || "Daily",

    status: doc.isActive ? "Active" : "Inactive",
    notes: doc.notes || "",

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toPayload(route) {
  return {
    providerName: route.providerName,
    contactPhone: route.contactPhone || "",
    whatsapp: route.whatsapp || "",
    bookingUrl: route.bookingUrl || "",
    officeCity: route.officeCity || "",
    officeAddress: route.officeAddress || "",
    officeMapsUrl: route.officeMapsUrl || "",

    from: route.from,
    to: route.to,
    type: route.type,
    fare: Number(route.fare || 0),
    availability: route.availability,
    notes: route.notes || "",
    isActive: route.status === "Active",
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

export default function ManageTransport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("fare-asc");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const fetchTransport = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await api.get("/transport/admin");
      setRows((res.data.items || []).map(toRow));
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load transport routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = rows.filter((r) => {
      const matchType = type === "All" || r.type === type;

      const hay = [
        r.id,
        r.providerName,
        r.from,
        r.to,
        r.type,
        r.availability,
        r.status,
        r.notes,
        r.contactPhone,
        r.whatsapp,
        r.bookingUrl,
        r.officeCity,
        r.officeAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || hay.includes(query);
      return matchType && matchQ;
    });

    list = [...list].sort((a, b) => {
      if (sort === "fare-asc") return (a.fare ?? 0) - (b.fare ?? 0);
      if (sort === "fare-desc") return (b.fare ?? 0) - (a.fare ?? 0);
      if (sort === "route-asc") return `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`);
      return 0;
    });

    return list;
  }, [rows, q, type, sort]);

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (route) => {
    setEditing(route);
    setOpen(true);
  };

  const onDelete = async (route) => {
    const ok = window.confirm(`Delete route "${route.from} → ${route.to}" (${route.type})? (soft delete)`);
    if (!ok) return;

    try {
      await api.delete(`/transport/${route.id}`);
      await fetchTransport();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const onSave = async (route) => {
    if (!route.providerName || !route.from || !route.to) {
      alert("Provider Name, From, and To are required.");
      return;
    }

    try {
      const payload = toPayload(route);

      if (editing?.id) await api.put(`/transport/${editing.id}`, payload);
      else await api.post("/transport", payload);

      setOpen(false);
      setEditing(null);
      await fetchTransport();
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
          <h2 style={{ margin: 0 }}>Manage Transport</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Manage routes, providers and availability.</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchTransport} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={onAdd}>
            + Add Route
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
              <input
                className="hmInput"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search provider, route, phone, whatsapp, city..."
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Type</div>
              <select className="hmInput" value={type} onChange={(e) => setType(e.target.value)}>
                <option>All</option>
                <option>Local</option>
                <option>Private</option>
                <option>Flight</option>
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
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Provider + Route</th>
                      <th>Type</th>
                      <th>Fare</th>
                      <th>Availability</th>
                      <th>Contacts</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const menuItems = [
                        { label: "Edit", onClick: () => onEdit(r) },
                        { label: "Delete", danger: true, onClick: () => onDelete(r) },
                      ];

                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="evTitle">{r.providerName || "—"}</div>
                            <div className="evSub">
                              {r.from} → {r.to}
                            </div>
                            <div className="evSub">id: {r.id}</div>
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.type}</td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            {r.type === "Flight" ? "—" : `PKR ${Number(r.fare || 0).toLocaleString("en-PK")}`}
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{r.availability}</td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            <div style={{ display: "grid", gap: 4 }}>
                              <div>{r.contactPhone ? `☎ ${r.contactPhone}` : "—"}</div>
                              <div>{r.whatsapp ? `WA ${r.whatsapp}` : "—"}</div>
                              <div style={{ fontSize: 12, opacity: 0.9 }}>
                                {r.officeCity ? `Office: ${r.officeCity}` : ""}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className={`pill ${r.status === "Active" ? "ok" : "warn"}`}>{r.status}</span>
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

                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No routes found.
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

      <TransportFormModal
        open={open}
        onClose={() => setOpen(false)}
        initialRoute={editing}
        onSave={onSave}
      />
    </div>
  );
}
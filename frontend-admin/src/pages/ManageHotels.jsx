import { useEffect, useMemo, useState } from "react";
import HotelFormModal from "../components/common/HotelFormModal";
import { api } from "../utils/api";

const SORTS = [
  { value: "rating-desc", label: "Rating (High → Low)" },
  { value: "price-asc", label: "Price From (Low → High)" },
  { value: "name-asc", label: "Name (A → Z)" },
];

function toRow(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    city: doc.city || "",
    rating: Number(doc.rating || 0),
    priceFrom: Number(doc.priceFrom || 0),
    status: doc.isActive ? "Approved" : "Hidden",
    address: doc.address || "",
    mapsUrl: doc.mapsUrl || "",
    description: doc.description || "",
    amenities: doc.amenities || [],
    images: doc.images || [],
    rooms: doc.rooms || [],
  };
}

function toPayload(h) {
  return {
    name: h.name,
    city: h.city,
    rating: Number(h.rating || 0),
    priceFrom: Number(h.priceFrom || 0),
    address: h.address || "",
    mapsUrl: h.mapsUrl || "",
    description: h.description || "",
    amenities: Array.isArray(h.amenities) ? h.amenities : [],
    images: Array.isArray(h.images) ? h.images : [],
    rooms: Array.isArray(h.rooms) ? h.rooms : [],
    isActive: h.status === "Approved",
  };
}

export default function ManageHotels() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [sort, setSort] = useState("rating-desc");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchHotels = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await api.get("/hotels");
      setRows((res.data.items || []).map(toRow));
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load hotels");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const cities = useMemo(() => {
    const set = new Set(rows.map((h) => h.city).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = rows.filter((h) => {
      const matchCity = city === "All" || h.city === city;

      const hay = [
        h.id,
        h.name,
        h.city,
        h.status,
        h.address,
        ...(h.amenities || []),
        ...(h.rooms || []).map((r) => r.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || hay.includes(query);
      return matchCity && matchQ;
    });

    list = [...list].sort((a, b) => {
      if (sort === "rating-desc") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "price-asc") return (a.priceFrom ?? 0) - (b.priceFrom ?? 0);
      if (sort === "name-asc") return String(a.name).localeCompare(String(b.name));
      return 0;
    });

    return list;
  }, [rows, q, city, sort]);

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (hotel) => {
    setEditing(hotel);
    setOpen(true);
  };

  const onDelete = async (hotel) => {
    const ok = confirm(`Delete hotel "${hotel.name}"? (soft delete)`);
    if (!ok) return;

    try {
      await api.delete(`/hotels/${hotel.id}`);
      await fetchHotels();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const onSave = async (hotel) => {
    if (!hotel?.name || !hotel?.city) {
      alert("Hotel Name and City are required.");
      return;
    }

    try {
      const payload = toPayload(hotel);

      if (editing?.id) await api.put(`/hotels/${editing.id}`, payload);
      else await api.post("/hotels", payload);

      setOpen(false);
      setEditing(null);
      await fetchHotels();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* ✅ EXACT SAME TABLE CSS used by ManageEvents */}
      <style>{`
        .evTableWrap{
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }

        .evTable{
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
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

        .evBadge{
          display:inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          border: 1px solid rgba(15,23,42,0.10);
          white-space: nowrap;
        }

        .evBadge.ok{
          background: rgba(16,185,129,0.14);
          color: #065f46;
        }

        .evBadge.no{
          background: rgba(239,68,68,0.12);
          color: #7f1d1d;
        }

        .evActions{
          display:flex;
          gap:10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        @media (max-width: 900px){
          .evActions{ justify-content: flex-start; }
        }
      `}</style>

      {/* Header (same layout as Events) */}
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
          <h2 style={{ margin: 0 }}>Manage Hotels</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Add, edit, hide and manage hotel listings.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={fetchHotels} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="aBtn primary" onClick={onAdd}>
            + Add Hotel
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

      {/* Filters (Events style card + hmInput) */}
      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
              <input
                className="hmInput"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, city, status, room..."
              />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>City</div>
              <select className="hmInput" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Sort</div>
              <select className="hmInput" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>
            Results: <b style={{ color: "var(--heading)" }}>{filtered.length}</b>
          </div>
        </div>
      </div>

      {/* Table (Events style) */}
      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : (
            <div className="evTableWrap">
              <table className="evTable" style={{ minWidth: 1100 }}>
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Hotel</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Price From</th>
                    <th>Rooms</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <div className="evTitle" title={h.name}>{h.name}</div>
                        <div className="evSub">id: {h.id}</div>
                      </td>

                      <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                        {h.city || "—"}
                      </td>

                      <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                        {h.rating ?? 0}
                      </td>

                      <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                        PKR {Number(h.priceFrom || 0).toLocaleString("en-PK")}
                      </td>

                      <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                        {(h.rooms || []).length}
                      </td>

                      <td>
                        <span className={`evBadge ${h.status === "Approved" ? "ok" : "no"}`}>
                          {h.status}
                        </span>
                      </td>

                      <td>
                        <div className="evActions">
                          <button className="aBtn" onClick={() => onEdit(h)}>Edit</button>
                          <button className="aBtn danger" onClick={() => onDelete(h)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                        No hotels found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <HotelFormModal
        open={open}
        onClose={() => setOpen(false)}
        initialHotel={editing}
        onSave={onSave}
      />
    </div>
  );
}
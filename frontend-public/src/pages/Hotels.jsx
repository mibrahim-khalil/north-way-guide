import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import HotelCard from "../components/cards/HotelCard";
import HotelListItem from "../components/cards/HotelListItem";

function pickItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function mapHotel(doc) {
  return {
    id: doc._id,
    name: doc.name,
    city: doc.city,

    ratingAvg: doc.ratingAvg ?? 0,
    ratingCount: doc.ratingCount ?? 0,

    priceFrom: doc.priceFrom || 0,
    image: (doc.images && doc.images[0]) || "",

    address: doc.address || "",
    mapsUrl: doc.mapsUrl || "",
    description: doc.description || "",
    amenities: doc.amenities || [],
    rooms: doc.rooms || [],
  };
}

export default function Hotels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const pageSize = view === "grid" ? 12 : 10;

  useEffect(() => setPage(1), [view]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/hotels")
      .then((res) => {
        const list = pickItems(res.data);
        const activeOnly = list.filter((h) => h?.isActive === true); 
        setItems(activeOnly.map(mapHotel));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Hotels</h2>
          <p className="p">
            {loading ? "Loading..." : `Showing ${pageItems.length} of ${items.length} hotels`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={`btn ${view === "grid" ? "primary" : ""}`} onClick={() => setView("grid")}>
            Grid
          </button>
          <button className={`btn ${view === "list" ? "primary" : ""}`} onClick={() => setView("list")}>
            List
          </button>
        </div>
      </div>

      <hr className="sep" />

      {!loading && items.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <div className="p" style={{ margin: 0 }}>No hotels available right now.</div>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid cols-4">
          {pageItems.map((h) => <HotelCard key={h.id} hotel={h} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pageItems.map((h) => <HotelListItem key={h.id} hotel={h} />)}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button className="btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="badge">Page {page} / {totalPages}</span>
        <button className="btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </>
  );
}
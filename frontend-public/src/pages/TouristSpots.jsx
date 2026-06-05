import { useEffect, useMemo, useState } from "react";
import SpotCard from "../components/cards/SpotCard";
import SpotListItem from "../components/cards/SpotListItem";
import { api } from "../utils/api";

function normalizeSpot(s) {
  return {
    id: s?._id || s?.id,
    name: s?.title || s?.name || "",
    district: s?.location || s?.district || "",
    tag: (Array.isArray(s?.tags) && s.tags[0]) || s?.tag || "Spot",
    image: (Array.isArray(s?.images) && s.images[0]) || s?.image || "",
    description: s?.description || "",
    mapsUrl: s?.mapsUrl || "",
    ratingAvg: s?.ratingAvg ?? 0,
    ratingCount: s?.ratingCount ?? 0,
  };
}

export default function TouristSpots() {
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const pageSize = view === "grid" ? 12 : 10;

  useEffect(() => setPage(1), [view]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/spots");
        const items = (res.data?.items || []).map(normalizeSpot);
        if (!alive) return;
        setRows(items);
      } catch (e) {
        if (!alive) return;
        setRows([]);
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Tourist Spots</h2>
          <p className="p">
            {loading ? "Loading..." : `Showing ${pageItems.length} of ${rows.length} spots`}
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

      {loading ? (
        <div className="card">
          <div className="cardBody">
            <p className="p">Loading spots...</p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid cols-4">
          {pageItems.map((s) => <SpotCard key={s.id} spot={s} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pageItems.map((s) => <SpotListItem key={s.id} spot={s} />)}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button className="btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span className="badge">Page {page} / {totalPages}</span>
        <button className="btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </>
  );
}
import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import GuideCard from "../components/cards/GuideCard";
import GuideListItem from "../components/cards/GuideListItem";
import { Link } from "react-router-dom";

function pickItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

function mapGuide(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    image: (doc.images && doc.images[0]) || "",
    area: doc.baseCity || "",

  
    ratingAvg: doc.ratingAvg ?? 0,
    ratingCount: doc.ratingCount ?? 0,

    rate: doc.pricePerDay ? `PKR ${doc.pricePerDay}/day` : "—",
    experience: doc.bio || "—",
    specialization: Array.isArray(doc.specialties)
      ? doc.specialties.join(", ")
      : "—",
    languages: Array.isArray(doc.languages) ? doc.languages : [],
  };
}
export default function Guides() {
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const pageSize = view === "grid" ? 12 : 10;

  useEffect(() => setPage(1), [view]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/guides")
      .then((res) => {
        const list = pickItems(res.data);
        const activeOnly = list.filter((g) => g?.isActive === true);
        setItems(activeOnly.map(mapGuide));
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
          <h2 style={{ margin: "0 0 6px" }}>Tour Guides</h2>
          <p className="p">
            {loading
              ? "Loading..."
              : `Showing ${pageItems.length} of ${items.length} guides`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn ${view === "grid" ? "primary" : ""}`}
            onClick={() => setView("grid")}
          >
            Grid
          </button>
          <button
            className={`btn ${view === "list" ? "primary" : ""}`}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      <hr className="sep" />

      {!loading && items.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <div className="p">No guides available right now.</div>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid cols-4">
          {pageItems.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pageItems.map((g) => (
            <GuideListItem key={g.id} guide={g} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
        <button
          className="btn"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span className="badge">
          Page {page} / {totalPages}
        </span>

        <button
          className="btn"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
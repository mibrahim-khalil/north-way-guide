import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../utils/api";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

function safeStr(x) {
  return String(x || "").toLowerCase();
}

export default function SearchResults() {
  const query = useQuery();
  const qRaw = (query.get("q") || "").trim();
  const q = qRaw.toLowerCase();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ spots: [], hotels: [], products: [], guides: [] });

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!q) {
        setData({ spots: [], hotels: [], products: [], guides: [] });
        return;
      }

      setLoading(true);
      try {
        const [spotsRes, hotelsRes, productsRes, guidesRes] = await Promise.all([
          api.get("/spots"),
          api.get("/hotels"),
          api.get("/products"),
          api.get("/guides"),
        ]);

        if (!alive) return;

        setData({
          spots: spotsRes.data?.items || [],
          hotels: hotelsRes.data?.items || [],
          products: productsRes.data?.items || [],
          guides: guidesRes.data?.items || [],
        });
      } catch {
        if (!alive) return;
        setData({ spots: [], hotels: [], products: [], guides: [] });
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [q]);

  const results = useMemo(() => {
    if (!q) return { spots: [], hotels: [], products: [], guides: [] };

    const spotRes = (data.spots || []).filter((s) => {
      const hay = `${s.title || s.name || ""} ${s.location || s.district || ""} ${(s.tags || []).join(" ")}`;
      return safeStr(hay).includes(q);
    });

    const hotelRes = (data.hotels || []).filter((h) => {
      const hay = `${h.name || ""} ${h.city || ""} ${h.address || ""}`;
      return safeStr(hay).includes(q);
    });

    const productRes = (data.products || []).filter((p) => {
      const hay = `${p.name || ""} ${p.category || ""}`;
      return safeStr(hay).includes(q);
    });

    const guideRes = (data.guides || []).filter((g) => {
      const hay = `${g.name || ""} ${g.baseCity || ""} ${g.area || ""} ${(g.specialties || []).join(" ")}`;
      return safeStr(hay).includes(q);
    });

    return { spots: spotRes, hotels: hotelRes, products: productRes, guides: guideRes };
  }, [q, data]);

  const total =
    results.spots.length + results.hotels.length + results.products.length + results.guides.length;

  return (
    <div className="card">
      <div className="cardBody">
        <h2 style={{ margin: "0 0 6px" }}>Search Results</h2>

        <p className="p">
          {!qRaw ? (
            "Type something in the header search bar to find places and services."
          ) : loading ? (
            <>
              Searching for <b>"{qRaw}"</b>...
            </>
          ) : (
            <>
              Showing results for <b>"{qRaw}"</b> — <b>{total}</b> found
            </>
          )}
        </p>

        <hr className="sep" />

        {!qRaw ? (
          <div className="p">No query provided.</div>
        ) : loading ? (
          <div className="p">Loading results...</div>
        ) : total === 0 ? (
          <div className="p">No results found.</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            <ResultGroup
              title="Tourist Spots"
              items={results.spots.map((x) => ({
                title: x.title || x.name || "—",
                sub: x.location || x.district || "—",
                to: `/tourist-spots/${x._id}`,
              }))}
            />
            <ResultGroup
              title="Hotels"
              items={results.hotels.map((x) => ({
                title: x.name || "—",
                sub: x.city || "—",
                to: `/hotels/${x._id}`,
              }))}
            />
            <ResultGroup
              title="Local Products"
              items={results.products.map((x) => ({
                title: x.name || "—",
                sub: x.category || "—",
                to: `/local-products/${x._id}`,
              }))}
            />
            <ResultGroup
              title="Guides"
              items={results.guides.map((x) => ({
                title: x.name || "—",
                sub: x.baseCity || x.area || "—",
                to: `/guides/${x._id}`,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ title, items }) {
  if (!items.length) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="badge">{items.length}</span>
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {items.map((it, idx) => (
          <Link
            key={idx}
            to={it.to}
            className="card"
            style={{
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: 14,
              textDecoration: "none",
            }}
          >
            <div>
              <div style={{ fontWeight: 900, color: "var(--heading)" }}>{it.title}</div>
              <div className="p" style={{ fontSize: 13 }}>{it.sub}</div>
            </div>
            <span style={{ fontWeight: 900, color: "#6d28d9" }}>Open</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./SearchModal.css";
import { api } from "../../utils/api";

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function s(x) {
  return String(x || "");
}

export default function SearchModal({ open, onClose, initialQuery = "" }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [spots, setSpots] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [products, setProducts] = useState([]);
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    if (open) setQ(initialQuery || "");
  }, [open, initialQuery]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!open) return;
      if (loadedOnce) return;

      setLoading(true);
      try {
        const [spotsRes, hotelsRes, productsRes, guidesRes] = await Promise.all([
          api.get("/spots"),
          api.get("/hotels"),
          api.get("/products"),
          api.get("/guides"),
        ]);

        if (!alive) return;

        setSpots(pickItems(spotsRes.data));
        setHotels(pickItems(hotelsRes.data));
        setProducts(pickItems(productsRes.data));
        setGuides(pickItems(guidesRes.data));
        setLoadedOnce(true);
      } catch {
        if (!alive) return;
        setSpots([]);
        setHotels([]);
        setProducts([]);
        setGuides([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [open, loadedOnce]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const out = [];

    for (const sp of spots) {
      const hay = `${s(sp.title || sp.name)} ${s(sp.location || sp.district)} ${(sp.tags || []).join(" ")}`.toLowerCase();
      if (hay.includes(query)) out.push({ type: "Spot", title: sp.title || sp.name, sub: sp.location || sp.district, to: `/tourist-spots/${sp._id}` });
    }

    for (const h of hotels) {
      const hay = `${s(h.name)} ${s(h.city)} ${s(h.address)}`.toLowerCase();
      if (hay.includes(query)) out.push({ type: "Hotel", title: h.name, sub: h.city, to: `/hotels/${h._id}` });
    }

    for (const p of products) {
      const hay = `${s(p.name)} ${s(p.category)}`.toLowerCase();
      if (hay.includes(query)) out.push({ type: "Product", title: p.name, sub: p.category, to: `/local-products/${p._id}` });
    }

    for (const g of guides) {
      const hay = `${s(g.name)} ${s(g.baseCity || g.area)} ${(g.specialties || []).join(" ")}`.toLowerCase();
      if (hay.includes(query)) out.push({ type: "Guide", title: g.name, sub: g.baseCity || g.area || "", to: `/guides/${g._id}` });
    }

    return out.slice(0, 12);
  }, [q, spots, hotels, products, guides]);

  if (!open) return null;

  return (
    <>
      <div className="searchOverlay" onClick={onClose} />
      <div className="searchModal" role="dialog" aria-modal="true">
        <div className="searchTop">
          <div>
            <div className="searchTitle">Search</div>
            <div className="searchSub">Find spots, hotels, products, guides</div>
          </div>
          <button className="searchClose" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type to search..."
            autoFocus
          />
        </div>

        <div className="searchResults">
          {loading ? (
            <div className="searchEmpty">Loading...</div>
          ) : !q.trim() ? (
            <div className="searchEmpty">Start typing to search across the website.</div>
          ) : results.length === 0 ? (
            <div className="searchEmpty">No results found.</div>
          ) : (
            results.map((r, idx) => (
              <Link key={idx} to={r.to} className="searchItem" onClick={onClose}>
                <span className="searchType">{r.type}</span>
                <div>
                  <div className="searchItemTitle">{r.title}</div>
                  <div className="searchItemSub">{r.sub}</div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="searchHint">Tip: press Esc to close</div>
      </div>
    </>
  );
}
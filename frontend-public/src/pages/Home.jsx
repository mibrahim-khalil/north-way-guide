import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

import SpotCard from "../components/cards/SpotCard";
import HotelCard from "../components/cards/HotelCard";
import ProductCard from "../components/cards/ProductCard";
import GuideCard from "../components/cards/GuideCard";

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function mapSpot(doc) {
  return {
    id: doc._id,
    name: doc.title || "",
    district: doc.location || "",
    tag: Array.isArray(doc.tags) && doc.tags.length ? doc.tags[0] : "Spot",
    image: (Array.isArray(doc.images) && doc.images[0]) || "",
    images: Array.isArray(doc.images) ? doc.images : [],
    description: doc.description || "",
    mapsUrl: doc.mapsUrl || "",
    // from highlights API
    ratingAvg: Number(doc.ratingAvg || 0),
    ratingCount: Number(doc.ratingCount || 0),
  };
}

function mapHotel(doc) {
  return {
    id: doc._id,
    name: doc.name,
    city: doc.city,
    rating: doc.rating || 0,
    priceFrom: doc.priceFrom || 0,
    image: (doc.images && doc.images[0]) || "",
    images: doc.images || [],
    ratingAvg: Number(doc.ratingAvg ?? doc.rating ?? 0),
    ratingCount: Number(doc.ratingCount ?? 0),
  };
}

function mapGuide(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    area: doc.baseCity || "",
    rate: doc.pricePerDay ? `PKR ${doc.pricePerDay}/day` : "",
    specialization: Array.isArray(doc.specialties)
      ? doc.specialties.join(", ")
      : "",
    image: (doc.images && doc.images[0]) || "",
    ratingAvg: Number(doc.ratingAvg ?? doc.rating ?? 0),
    ratingCount: Number(doc.ratingCount ?? 0),
  };
}

function mapProduct(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    category: doc.category || "",
    price: Number(doc.price || 0),
    image: (Array.isArray(doc.images) && doc.images[0]) || "",
    images: Array.isArray(doc.images) ? doc.images : [],
    description: doc.description || "",
    locationName: doc.locationName || "",
    googleMapUrl: doc.googleMapUrl || "",
    stock: Number(doc.stock || 0),

    // from highlights API
    ratingAvg: Number(doc.ratingAvg || 0),
    ratingCount: Number(doc.ratingCount || 0),
  };
}

export default function Home() {
  const [spotsDb, setSpotsDb] = useState([]);
  const [hotelsDb, setHotelsDb] = useState([]);
  const [guidesDb, setGuidesDb] = useState([]);
  const [productsDb, setProductsDb] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/home/highlights", { params: { limit: 4 } })
      .then((res) => {
        const data = res.data || {};
        setSpotsDb(pickItems(data.spots).map(mapSpot));
        setHotelsDb(pickItems(data.hotels).map(mapHotel));
        setGuidesDb(pickItems(data.guides).map(mapGuide));
        setProductsDb(pickItems(data.products).map(mapProduct));
      })
      .catch(() => {
        setSpotsDb([]);
        setHotelsDb([]);
        setGuidesDb([]);
        setProductsDb([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const topSpots = useMemo(() => spotsDb.slice(0, 4), [spotsDb]);
  const topHotels = useMemo(() => hotelsDb.slice(0, 4), [hotelsDb]);
  const topGuides = useMemo(() => guidesDb.slice(0, 4), [guidesDb]);
  const topProducts = useMemo(() => productsDb.slice(0, 4), [productsDb]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>Explore Highlights</h2>
            <p className="p">{loading ? "Loading..." : "Top picks — sorted by rating (spots/products use approved reviews)."}</p>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: "0 0 6px" }}>Top Rated Tourist Spots</h3>
            <p className="p">{loading ? "Loading..." : "Top 4 spots by approved reviews (fallback newest)."}</p>
          </div>
          <Link className="btn" to="/tourist-spots">View All Spots</Link>
        </div>
        <div className="grid cols-4">
          {topSpots.map((s) => <SpotCard key={s.id} spot={s} />)}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: "0 0 6px" }}>Top Rated Hotels</h3>
            <p className="p">{loading ? "Loading..." : "Top 4 hotels by rating field."}</p>
          </div>
          <Link className="btn" to="/hotels">View All Hotels</Link>
        </div>
        <div className="grid cols-4">{topHotels.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: "0 0 6px" }}>Top Guides</h3>
            <p className="p">{loading ? "Loading..." : "Top 4 guides by rating field."}</p>
          </div>
          <Link className="btn" to="/guides">View All Guides</Link>
        </div>
        <div className="grid cols-4">
          {topGuides.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: "0 0 6px" }}>Top Rated Products</h3>
            <p className="p">{loading ? "Loading..." : "Top 4 products by approved reviews (fallback newest)."}</p>
          </div>
          <Link className="btn" to="/local-products">View All Products</Link>
        </div>
        <div className="grid cols-4">
          {topProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import "./Home.css";

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
    specialization: Array.isArray(doc.specialties) ? doc.specialties.join(", ") : "",
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
    ratingAvg: Number(doc.ratingAvg || 0),
    ratingCount: Number(doc.ratingCount || 0),
  };
}

function SectionHead({ title, subtitle, to, linkLabel }) {
  return (
    <div className="nwSectionHead">
      <div className="nwSectionLeft">
        <h3 className="nwSectionTitle">{title}</h3>
        {subtitle ? <p className="nwSectionSub">{subtitle}</p> : null}
      </div>

      {to ? (
        <Link className="nwViewAll" to={to}>
          {linkLabel || "View all"}
        </Link>
      ) : null}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card nwSkeletonCard" aria-hidden="true">
      <div className="nwSkeletonMedia" />
      <div className="nwSkeletonBody">
        <div className="nwSkLine w70" />
        <div className="nwSkLine w45" />
        <div className="nwSkLine w55" />
        <div className="nwSkBtns">
          <div className="nwSkBtn" />
          <div className="nwSkBtn" />
        </div>
      </div>
    </div>
  );
}

function CardsRow({ loading, items, renderItem, skeletonCount = 4 }) {
  if (loading) {
    return (
      <div className="nwCards">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return <div className="nwEmpty">No items found.</div>;
  }

  return <div className="nwCards">{items.map(renderItem)}</div>;
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
    <div className="nwHome">
      <div className="nwIntro">
        <h2 className="nwIntroTitle">Explore Highlights</h2>
        <p className="nwIntroSub">
          Explore Trending & Top-Reviewed Experiences Across the Region.
        </p>
      </div>

      <section className="nwSection">
        <SectionHead
          title="Top Rated Tourist Spots"
          subtitle="Discover the Region’s Highest-Rated Attractions."
          to="/tourist-spots"
          linkLabel="View all spots"
        />
        <CardsRow
          loading={loading}
          items={topSpots}
          renderItem={(s) => <SpotCard key={s.id} spot={s} />}
        />
      </section>

      <section className="nwSection">
        <SectionHead
          title="Top Rated Hotels"
          subtitle="Explore Highly Rated Stays Across the Region."
          to="/hotels"
          linkLabel="View all hotels"
        />
        <CardsRow
          loading={loading}
          items={topHotels}
          renderItem={(h) => <HotelCard key={h.id} hotel={h} />}
        />
      </section>

      <section className="nwSection">
        <SectionHead
          title="Top Guides"
          subtitle="Trusted Guides Recommended by Travelers."
          to="/guides"
          linkLabel="View all guides"
        />
        <CardsRow
          loading={loading}
          items={topGuides}
          renderItem={(g) => <GuideCard key={g.id} guide={g} />}
        />
      </section>

      <section className="nwSection">
        <SectionHead
          title="Top Rated Products"
          subtitle="Featured Products Loved by Verified Buyers."
          to="/local-products"
          linkLabel="View all products"
        />
        <CardsRow
          loading={loading}
          items={topProducts}
          renderItem={(p) => <ProductCard key={p.id} product={p} />}
        />
      </section>
    </div>
  );
}
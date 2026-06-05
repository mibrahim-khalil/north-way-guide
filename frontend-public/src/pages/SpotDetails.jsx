import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../utils/api";
import ReviewSection from "../components/common/ReviewSection";
import BackButton from "../components/common/BackButton";
import ImageGallery from "../components/common/ImageGallery";

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = api?.defaults?.baseURL || "";
  const origin = base.replace(/\/api\/?$/, "");

  if (url.startsWith("/uploads/")) return `${origin}${url}`;
  if (url.startsWith("uploads/")) return `${origin}/${url}`;
  if (url.startsWith("../images/")) return url.replace("../images/", "/images/");

  return url;
}

function provinceFromRegion(region) {
  const r = String(region || "").toUpperCase().trim();

  if (!r || r === "UNKNOWN") return "Pakistan";
  if (r === "KPK" || r === "KHYBER_PAKHTUNKHWA") return "Khyber Pakhtunkhwa";
  if (r === "PUNJAB") return "Punjab";
  if (r === "SINDH") return "Sindh";
  if (r === "BALOCHISTAN") return "Balochistan";
  if (r === "ICT" || r === "ISLAMABAD") return "Islamabad";

  return "Gilgit-Baltistan";
}

function normalizeSpot(s) {
  const imgsRaw = Array.isArray(s?.images) ? s.images : [];
  const images = imgsRaw.map(resolveMediaUrl).filter(Boolean);

  const rawImage = images[0] || resolveMediaUrl(s?.image || "");

  const tags = Array.isArray(s?.tags)
    ? s.tags.filter(Boolean)
    : s?.tag
      ? [s.tag]
      : [];

  return {
    id: s?._id || s?.id,
    name: s?.title || s?.name || "",
    district: s?.location || s?.district || "",
    region: s?.region || "UNKNOWN",
    tags,
    image: rawImage,
    images: images.length ? images : rawImage ? [rawImage] : [],
    description: s?.description || "",
    mapsUrl: s?.mapsUrl || "",
  };
}

export default function SpotDetails() {
  const { id } = useParams();
  const [spotRaw, setSpotRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const spot = useMemo(() => (spotRaw ? normalizeSpot(spotRaw) : null), [spotRaw]);
  const province = useMemo(() => provinceFromRegion(spot?.region), [spot?.region]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/spots/${id}`);
        if (!alive) return;
        setSpotRaw(res.data?.item || null);
      } catch {
        if (!alive) return;
        setSpotRaw(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Spot not found</h2>
          <p className="p" style={{ marginTop: 8 }}>
            This spot may be removed or hidden.
          </p>
          <Link className="btn" to="/tourist-spots" style={{ marginTop: 12 }}>
            Back to Spots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`
        .backBtn{ border-radius: 999px; font-weight: 1000; padding: 10px 14px; }
        .sdTopRow{
          display:flex;
          justify-content:space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items:flex-start;
        }
        .sdActions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }
      `}</style>

      {/* Main Spot Card */}
      <div className="card">
        <ImageGallery images={spot.images} alt={spot.name} height={320} fit="cover" />

        <div className="cardBody">
          <div className="sdTopRow">
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{spot.name}</h2>

              <p className="p" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  District: <b>{spot.district}</b>
                </span>

                {(spot.tags || []).length > 0 ? (
                  spot.tags.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))
                ) : (
                  <span className="badge">Spot</span>
                )}
              </p>
            </div>

            <div className="sdActions">
              <a className="btn" href="#reviews">Reviews</a>
              <BackButton fallback="/tourist-spots" />
            </div>
          </div>

          <hr className="sep" />

          <p className="p">{spot.description || "Description will be added later."}</p>

          <hr className="sep" />

          <h3 style={{ margin: "0 0 8px" }}>Directions</h3>
          <p className="p">
            <b>Location:</b> {spot.district}, {province}
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {spot.mapsUrl ? (
              <a className="btn primary" href={spot.mapsUrl} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            ) : null}

            <Link className="btn" to="/transport">
              Check Transport
            </Link>
          </div>
        </div>
      </div>

      <div id="reviews">
        <ReviewSection targetType="SPOT" targetId={spot.id} />
      </div>
    </div>
  );
}
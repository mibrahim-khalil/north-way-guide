import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { api } from "../../utils/api";

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

export default function SpotCard({ spot }) {
  const id = spot?.id || spot?._id;
  const name = spot?.name || spot?.title || "Spot";
  const district = spot?.district || spot?.location || "—";
  const tag = (Array.isArray(spot?.tags) && spot.tags[0]) || spot?.tag || "Spot";

  const ratingAvg = Number(spot?.ratingAvg ?? 0);
  const ratingCount = Number(spot?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const rawImage = spot?.image || (Array.isArray(spot?.images) && spot.images[0]) || "";
  const image = useMemo(() => resolveMediaUrl(rawImage), [rawImage]);
  const [imgOk, setImgOk] = useState(true);

  const frame = { width: "100%", height: 170 };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {image && imgOk ? (
          <img
            src={image}
            alt={name}
            style={{ ...frame, objectFit: "cover", objectPosition: "center", display: "block" }}
            onError={() => setImgOk(false)}
          />
        ) : (
          <div
            style={{
              ...frame,
              background: "rgba(15,23,42,0.06)",
              borderBottom: "1px solid rgba(15,23,42,0.08)",
            }}
          />
        )}

        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 42%, rgba(2,6,23,0.00) 70%)",
          }}
        />

        {/* ✅ overlay chips (high contrast) */}
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            zIndex: 5,
          }}
        >
          {/* Rating chip */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(245,158,11,0.55)",
              color: "rgb(253,230,138)", // amber text
              boxShadow: "0 10px 22px rgba(2,6,23,0.22)",
              whiteSpace: "nowrap",
            }}
            title={ratingCount > 0 ? `${ratingAvg.toFixed(1)} out of 5 (${ratingCount} reviews)` : "No reviews yet"}
          >
            ★ {ratingText}
          </span>

          {/* Tag chip */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              boxShadow: "0 10px 22px rgba(2,6,23,0.22)",
              whiteSpace: "nowrap",
            }}
            title={tag}
          >
            {tag}
          </span>
        </div>
      </div>

      <div className="cardBody">
        <div style={{ fontWeight: 1100, color: "var(--heading)" }}>{name}</div>

        <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
          District: <b>{district}</b>
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Link
            className="btn primary"
            style={{ flex: 1, justifyContent: "center", textAlign: "center" }}
            to={`/tourist-spots/${id}`}
          >
            More Info
          </Link>

          <Link
            className="btn ghost"
            style={{ flex: 1, justifyContent: "center", textAlign: "center" }}
            to={`/tourist-spots/${id}#reviews`}
          >
            Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
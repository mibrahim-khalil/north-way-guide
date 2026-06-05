import { Link } from "react-router-dom";

export default function GuideCard({ guide }) {
  if (!guide) return null;

  const ratingAvg =
    guide?.ratingAvg ??
    guide?.averageRating ??
    guide?.rating ??
    0;

  const ratingCount = guide?.ratingCount ?? 0;

  const ratingText =
    ratingCount > 0
      ? `${Number(ratingAvg).toFixed(1)} (${ratingCount})`
      : ratingAvg > 0
      ? Number(ratingAvg).toFixed(1)
      : "New";

  const frame = { width: "100%", height: 170 };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <img
          src={guide.image || "/images/home1.png"}
          alt={guide.name}
          style={{ ...frame, objectFit: "cover" }}
          onError={(e) => (e.currentTarget.src = "/images/home1.png")}
        />

        {/* Gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 42%, rgba(2,6,23,0.00) 70%)",
          }}
        />

        {/* Rating Chip */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(245,158,11,0.55)",
              color: "rgb(253,230,138)",
            }}
          >
            ★ {ratingText}
          </span>
        </div>
      </div>

      <div className="cardBody">
        <div style={{ fontWeight: 1100, color: "var(--heading)" }}>
          {guide.name}
        </div>

        <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
          Area: <b>{guide.area}</b>
        </p>

        <p className="p" style={{ fontSize: 13 }}>
          Rate: <b>{guide.rate}</b>
        </p>

        <div style={{ marginTop: 12 }}>
          <Link
            className="btn primary"
            style={{ width: "100%" }}
            to={`/guides/${guide.id}`}
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { toFileUrl } from "../../utils/toFileUrl";

export default function GuideListItem({ guide }) {
  if (!guide) return null;

  const id = guide?.id || guide?._id;

  const ratingAvg = Number(guide?.ratingAvg ?? 0);
  const ratingCount = Number(guide?.ratingCount ?? 0);

  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const rawImage =
    guide?.image || (Array.isArray(guide?.images) && guide.images[0]) || "/images/home1.png";

  const image = toFileUrl(rawImage);

  return (
    <div className="card listCard">
      <div className="listCardImage">
        <img
          src={image}
          alt={guide?.name}
          onError={(e) => (e.currentTarget.src = "/images/home1.png")}
        />

        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(2,6,23,0.75)",
            border: "1px solid rgba(245,158,11,0.55)",
            color: "rgb(253,230,138)",
          }}
        >
          ★ {ratingText}
        </div>
      </div>

      <div className="listCardContent">
        <div style={{ fontWeight: 1100, fontSize: 18 }}>{guide?.name}</div>

        <p className="p">
          Area: <b>{guide?.area}</b>
        </p>

        <p className="p">
          Rate: <b>{guide?.rate}</b>
        </p>

        {guide?.specialization && (
          <p className="p" style={{ fontSize: 12 }}>
            <b>Specialties:</b> {guide.specialization}
          </p>
        )}

        <div className="listCardActions">
          <Link className="btn primary" to={`/guides/${id}`}>
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
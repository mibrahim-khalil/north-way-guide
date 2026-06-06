import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toFileUrl } from "../../utils/toFileUrl";

export default function SpotListItem({ spot }) {
  const id = spot?.id || spot?._id;
  const name = spot?.name || spot?.title || "Spot";
  const district = spot?.district || spot?.location || "—";

  const ratingAvg = Number(spot?.ratingAvg ?? 0);
  const ratingCount = Number(spot?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const tag = (Array.isArray(spot?.tags) && spot.tags[0]) || spot?.tag || "Spot";

  const rawImage = spot?.image || (Array.isArray(spot?.images) && spot.images[0]) || "";
  const image = useMemo(() => toFileUrl(rawImage), [rawImage]);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="card listCard">
      <div className="listCardImage">
        {image && imgOk ? (
          <img src={image} alt={name} onError={() => setImgOk(false)} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#f1f5f9" }} />
        )}

        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            zIndex: 5,
          }}
        >
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(245,158,11,0.55)",
              color: "rgb(253,230,138)",
            }}
          >
            ★ {ratingText}
          </span>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
            }}
          >
            {tag}
          </span>
        </div>
      </div>

      <div className="listCardContent">
        <div style={{ fontWeight: 1100, fontSize: 18 }}>{name}</div>
        <p className="p">
          District: <b>{district}</b>
        </p>

        <div className="listCardActions">
          <Link className="btn primary" to={`/tourist-spots/${id}`}>
            More Info
          </Link>
          <Link className="btn ghost" to={`/tourist-spots/${id}#reviews`}>
            Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
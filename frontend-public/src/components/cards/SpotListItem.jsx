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
          <div style={{ width: "100%", height: "100%", background: "var(--soft)" }} />
        )}

        <div className="nkChipRow">
          <span className="nkChip nkChip--onImage">{tag}</span>
          <span className="nkChip nkChip--onImage">★ {ratingText}</span>
        </div>
      </div>

      <div className="listCardContent">
        <div className="nkTitle nkTitle--lg">{name}</div>
        <div className="nkMeta">District: <b>{district}</b></div>

        <div className="listCardActions">
          <Link className="btn primary" to={`/tourist-spots/${id}`}>More Info</Link>
          <Link className="btn ghost" to={`/tourist-spots/${id}#reviews`}>Reviews</Link>
        </div>
      </div>
    </div>
  );
}
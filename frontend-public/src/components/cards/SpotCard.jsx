import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toFileUrl } from "../../utils/toFileUrl";

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
  const image = useMemo(() => toFileUrl(rawImage), [rawImage]);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="card nkCard">
      <div className="nkMedia">
        {image && imgOk ? (
          <img src={image} alt={name} className="nkImg" onError={() => setImgOk(false)} />
        ) : (
          <div className="nkImgPlaceholder" />
        )}

        <div className="nkChipRow">
          <span className="nkChip nkChip--onImage">{tag}</span>
          <span className="nkChip nkChip--onImage">★ {ratingText}</span>
        </div>
      </div>

      <div className="nkBody">
        <div className="nkTitle">{name}</div>
        <div className="nkMeta">{district}</div>

        <div className="nkActions">
          <Link className="btn primary" to={`/tourist-spots/${id}`}>More Info</Link>
          <Link className="btn ghost" to={`/tourist-spots/${id}#reviews`}>Reviews</Link>
        </div>
      </div>
    </div>
  );
}
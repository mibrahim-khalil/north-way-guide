import { Link } from "react-router-dom";
import { toFileUrl } from "../../utils/toFileUrl";

export default function GuideCard({ guide }) {
  if (!guide) return null;

  const ratingAvg = guide?.ratingAvg ?? guide?.averageRating ?? guide?.rating ?? 0;
  const ratingCount = guide?.ratingCount ?? 0;
  const ratingText =
    ratingCount > 0
      ? `${Number(ratingAvg).toFixed(1)} (${ratingCount})`
      : ratingAvg > 0
      ? Number(ratingAvg).toFixed(1)
      : "New";

  const id = guide?.id || guide?._id;
  const rawImage =
    guide?.image || (Array.isArray(guide?.images) && guide.images[0]) || "/images/home1.png";
  const image = toFileUrl(rawImage);

  return (
    <div className="card nkCard">
      <div className="nkMedia">
        <img
          src={image}
          alt={guide?.name}
          className="nkImg"
          onError={(e) => (e.currentTarget.src = "/images/home1.png")}
        />
        <span className="nkChip nkChip--onImage">★ {ratingText}</span>
      </div>

      <div className="nkBody">
        <div className="nkTitle">{guide?.name}</div>
        <div className="nkMeta">{guide?.area}</div>
        <div className="nkPrice">{guide?.rate}</div>

        <div className="nkActions">
          <Link className="btn primary" to={`/guides/${id}`}>View Profile</Link>
        </div>
      </div>
    </div>
  );
}
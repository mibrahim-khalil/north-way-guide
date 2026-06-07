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
        <span className="nkChip nkChip--onImage">★ {ratingText}</span>
      </div>

      <div className="listCardContent">
        <div className="nkTitle nkTitle--lg">{guide?.name}</div>
        <div className="nkMeta">Area: <b>{guide?.area}</b></div>
        <div className="nkMeta">Rate: <b>{guide?.rate}</b></div>

        {guide?.specialization && (
          <div className="nkMeta nkMeta--sm">
            <b>Specialties:</b> {guide.specialization}
          </div>
        )}

        <div className="listCardActions">
          <Link className="btn primary" to={`/guides/${id}`}>View Profile</Link>
        </div>
      </div>
    </div>
  );
}
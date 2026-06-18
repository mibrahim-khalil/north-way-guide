import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HotelBookingModal from "../forms/HotelBookingModal";
import { toFileUrl } from "../../utils/toFileUrl";

export default function HotelCard({ hotel }) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  const ratingAvg = hotel?.ratingAvg ?? hotel?.averageRating ?? hotel?.rating ?? 0;
  const ratingCount = hotel?.ratingCount ?? 0;

  const ratingText =
    ratingCount > 0
      ? `${Number(ratingAvg).toFixed(1)} (${ratingCount})`
      : ratingAvg > 0
      ? Number(ratingAvg).toFixed(1)
      : "New";

  const rawImage = hotel?.image || (Array.isArray(hotel?.images) && hotel.images[0]) || "";
  const image = useMemo(() => toFileUrl(rawImage), [rawImage]);

  const id = hotel?.id || hotel?._id;

  // Fallback placeholder image (make sure this file exists in /public/images/)
  const fallback = "/images/home1.png";

  return (
    <>
      <div className="card nkCard">
        <div className="nkMedia">
          {image && imgOk ? (
            <img
              src={image}
              alt={hotel?.name || "Hotel"}
              className="nkImg"
              onError={(e) => {
                setImgOk(false);
                // fallback image instead of blank placeholder
                e.currentTarget.src = fallback;
              }}
            />
          ) : (
            <img src={fallback} alt="Hotel placeholder" className="nkImg" />
          )}

          <span className="nkChip nkChip--onImage">★ {ratingText}</span>
        </div>

        <div className="nkBody">
          <div className="nkTitle">{hotel?.name}</div>
          <div className="nkMeta">{hotel?.city}</div>
          <div className="nkPrice">
            From PKR {Number(hotel?.priceFrom || 0).toLocaleString("en-PK")}/night
          </div>

          <div className="nkActions">
            <button className="btn primary" type="button" onClick={() => setOpen(true)}>
              Book Now
            </button>
            <Link className="btn ghost" to={`/hotels/${id}`}>
              More Info
            </Link>
          </div>
        </div>
      </div>

      <HotelBookingModal open={open} onClose={() => setOpen(false)} hotel={hotel} />
    </>
  );
}
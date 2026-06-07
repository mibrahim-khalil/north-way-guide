import { useState } from "react";
import { Link } from "react-router-dom";
import HotelBookingModal from "../forms/HotelBookingModal";
import { toFileUrl } from "../../utils/toFileUrl";

export default function HotelListItem({ hotel }) {
  const [open, setOpen] = useState(false);

  const id = hotel?.id || hotel?._id;
  const ratingAvg = Number(hotel?.ratingAvg ?? 0);
  const ratingCount = Number(hotel?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const rawImage = hotel?.image || (Array.isArray(hotel?.images) && hotel.images[0]) || "";
  const image = toFileUrl(rawImage);

  return (
    <>
      <div className="card listCard">
        <div className="listCardImage">
          <img
            src={image}
            alt={hotel?.name}
            onError={(e) => (e.currentTarget.src = "/images/home1.png")}
          />
          <span className="nkChip nkChip--onImage">★ {ratingText}</span>
        </div>

        <div className="listCardContent">
          <div className="nkTitle nkTitle--lg">{hotel?.name}</div>
          <div className="nkMeta">
            {hotel?.city} • From PKR {hotel?.priceFrom}/night
          </div>

          <div className="listCardActions">
            <button className="btn primary" onClick={() => setOpen(true)}>Book Now</button>
            <Link className="btn ghost" to={`/hotels/${id}`}>More Info</Link>
          </div>
        </div>
      </div>

      <HotelBookingModal open={open} onClose={() => setOpen(false)} hotel={hotel} />
    </>
  );
}
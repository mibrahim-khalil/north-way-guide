import { useState } from "react";
import { Link } from "react-router-dom";
import HotelBookingModal from "../forms/HotelBookingModal";

export default function HotelListItem({ hotel }) {
  const [open, setOpen] = useState(false);

  const id = hotel.id || hotel._id;

  const ratingAvg = Number(hotel?.ratingAvg ?? 0);
  const ratingCount = Number(hotel?.ratingCount ?? 0);

  const ratingText =
    ratingCount > 0 && ratingAvg > 0
      ? `${ratingAvg.toFixed(1)} (${ratingCount})`
      : "New";

  return (
    <>
      <div className="card listCard">
        <div className="listCardImage">
          <img src={hotel.image} alt={hotel.name} />

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
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
          </div>
        </div>

        <div className="listCardContent">
          <div style={{ fontWeight: 1100, fontSize: 18 }}>
            {hotel.name}
          </div>

          <p className="p">
            {hotel.city} • From PKR {hotel.priceFrom}/night
          </p>

          <div className="listCardActions">
            <button className="btn primary" onClick={() => setOpen(true)}>
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
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

  const frame = { width: "100%", height: 170 };
  const id = hotel?.id || hotel?._id;

  return (
    <>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ position: "relative" }}>
          {image && imgOk ? (
            <img
              src={image}
              alt={hotel?.name}
              style={{ ...frame, objectFit: "cover" }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div
              style={{
                ...frame,
                background: "rgba(15,23,42,0.06)",
                borderBottom: "1px solid rgba(15,23,42,0.08)",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 42%, rgba(2,6,23,0.00) 70%)",
            }}
          />

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
          <div style={{ fontWeight: 1100, color: "var(--heading)" }}>{hotel?.name}</div>

          <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
            {hotel?.city} •{" "}
            <b>
              From PKR {Number(hotel?.priceFrom || 0).toLocaleString("en-PK")}/night
            </b>
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn primary" style={{ flex: 1 }} onClick={() => setOpen(true)}>
              Book Now
            </button>

            <Link className="btn ghost" style={{ flex: 1 }} to={`/hotels/${id}`}>
              More Info
            </Link>
          </div>
        </div>
      </div>

      <HotelBookingModal open={open} onClose={() => setOpen(false)} hotel={hotel} />
    </>
  );
}
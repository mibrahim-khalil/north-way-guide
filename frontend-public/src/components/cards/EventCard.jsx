import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toFileUrl } from "../../utils/toFileUrl";

function formatDate(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function rangeText(startDate, endDate) {
  const a = formatDate(startDate);
  const b = endDate ? formatDate(endDate) : "";
  return b ? `${a} – ${b}` : a;
}

function countdownText(nowMs, startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : null;
  if (!Number.isFinite(start)) return "";

  if (start > nowMs) {
    const diff = start - nowMs;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }
  if (end && end > nowMs) return "Ongoing";
  return "Ended";
}

export default function EventCard({ event, nowMs }) {
  const id = event?._id || event?.id;
  const title = event?.title || "Event";
  const location = event?.location || "—";

  const rawImage = event?.image || "";
  const image = useMemo(() => toFileUrl(rawImage), [rawImage]);
  const [imgOk, setImgOk] = useState(true);

  const chip = countdownText(nowMs || Date.now(), event?.startDate, event?.endDate);
  const dates = rangeText(event?.startDate, event?.endDate);

  return (
    <div className="card nkCard">
      <div className="nkMedia">
        {image && imgOk ? (
          <img
            src={image}
            alt={title}
            className="nkImg"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="nkImgPlaceholder" />
        )}

        {chip && <span className="nkChip nkChip--onImage">{chip}</span>}
      </div>

      <div className="nkBody">
        <div className="nkTitle">{title}</div>
        <div className="nkMeta">{location}</div>
        <div className="nkMeta">{dates || "—"}</div>

        <div className="nkActions">
          <Link className="btn primary" to={`/events/${id}`}>More Info</Link>
          {event?.mapUrl ? (
            <a className="btn ghost" href={event.mapUrl} target="_blank" rel="noreferrer">Map</a>
          ) : (
            <button className="btn ghost" type="button" disabled>Map</button>
          )}
        </div>
      </div>
    </div>
  );
}
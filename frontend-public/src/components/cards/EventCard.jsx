import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { api } from "../../utils/api";

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = api?.defaults?.baseURL || "";
  const origin = base.replace(/\/api\/?$/, "");

  if (url.startsWith("/uploads/")) return `${origin}${url}`;
  if (url.startsWith("uploads/")) return `${origin}/${url}`;
  if (url.startsWith("../images/")) return url.replace("../images/", "/images/");

  return url;
}

function formatDate(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function rangeText(startDate, endDate) {
  const a = formatDate(startDate);
  const b = endDate ? formatDate(endDate) : "";
  return b ? `${a} - ${b}` : a;
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
  const image = useMemo(() => resolveMediaUrl(rawImage), [rawImage]);
  const [imgOk, setImgOk] = useState(true);

  const frame = { width: "100%", height: 170 };

  const chip = countdownText(nowMs || Date.now(), event?.startDate, event?.endDate);
  const dates = rangeText(event?.startDate, event?.endDate);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {image && imgOk ? (
          <img
            src={image}
            alt={title}
            style={{ ...frame, objectFit: "cover", objectPosition: "center", display: "block" }}
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
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 42%, rgba(2,6,23,0.00) 70%)",
          }}
        />

        {/* ✅ Only ONE chip (countdown) */}
        {chip ? (
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              zIndex: 5,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 999,
                fontWeight: 1100,
                fontSize: 12,
                background: "rgba(2,6,23,0.72)",
                border: "1px solid rgba(245,158,11,0.55)", // same accent as SpotCard
                color: "rgb(253,230,138)",
                boxShadow: "0 10px 22px rgba(2,6,23,0.22)",
                whiteSpace: "nowrap",
              }}
              title="Time status"
            >
              ⏳ {chip}
            </span>
          </div>
        ) : null}
      </div>

      <div className="cardBody">
        <div style={{ fontWeight: 1100, color: "var(--heading)" }}>{title}</div>

        <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
          Location: <b>{location}</b>
        </p>

        <p className="p" style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
          Date: <b>{dates || "—"}</b>
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Link
            className="btn primary"
            style={{ flex: 1, justifyContent: "center", textAlign: "center" }}
            to={`/events/${id}`}
          >
            More Info
          </Link>

          {event?.mapUrl ? (
            <a
              className="btn ghost"
              style={{ flex: 1, justifyContent: "center", textAlign: "center" }}
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Map
            </a>
          ) : (
            <button
              className="btn ghost"
              style={{
                flex: 1,
                justifyContent: "center",
                textAlign: "center",
                opacity: 0.55,
                cursor: "not-allowed",
              }}
              type="button"
              disabled
            >
              Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
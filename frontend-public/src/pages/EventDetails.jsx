import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../utils/api";
import BackButton from "../components/common/BackButton";
import ImageGallery from "../components/common/ImageGallery";

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

function formatDateTime(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

function normalizeEvent(e) {
  const image = resolveMediaUrl(e?.image || "");
  const images = image ? [image] : [];

  return {
    id: e?._id || e?.id,
    title: e?.title || "",
    location: e?.location || "",
    description: e?.description || "",
    mapUrl: e?.mapUrl || "",
    startDate: e?.startDate,
    endDate: e?.endDate,
    image,
    images,
  };
}

export default function EventDetails() {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  // keep countdown updated
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const event = useMemo(() => (raw ? normalizeEvent(raw) : null), [raw]);
  const chip = useMemo(
    () => (event ? countdownText(nowMs, event.startDate, event.endDate) : ""),
    [event, nowMs]
  );

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/events/${id}`);
        if (!alive) return;
        setRaw(res.data?.item || null);
      } catch {
        if (!alive) return;
        setRaw(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Event not found</h2>
          <p className="p" style={{ marginTop: 8 }}>
            This event may be removed or hidden.
          </p>
          <Link className="btn" to="/events" style={{ marginTop: 12 }}>
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`
        .backBtn{ border-radius: 999px; font-weight: 1000; padding: 10px 14px; }
        .edTopRow{
          display:flex;
          justify-content:space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items:flex-start;
        }
        .edActions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }
        .edChip{
          display:inline-flex;
          align-items:center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1100;
          font-size: 12px;
          background: rgba(2,6,23,0.72);
          border: 1px solid rgba(245,158,11,0.55);
          color: rgb(253,230,138);
          box-shadow: 0 10px 22px rgba(2,6,23,0.22);
          white-space: nowrap;
        }
      `}</style>

      <div className="card">
        <ImageGallery images={event.images} alt={event.title} height={320} fit="cover" />

        <div className="cardBody">
          <div className="edTopRow">
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{event.title}</h2>

              <p className="p" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  Location: <b>{event.location || "—"}</b>
                </span>

                {/* countdown chip */}
                {chip ? <span className="edChip">⏳ {chip}</span> : null}
              </p>

              <p className="p" style={{ marginTop: 6 }}>
                <b>Date:</b> {rangeText(event.startDate, event.endDate) || "—"}
              </p>

              <p className="p" style={{ marginTop: 6, opacity: 0.9 }}>
                <b>Starts:</b> {formatDateTime(event.startDate) || "—"}
              </p>
            </div>

            <div className="edActions">
              <BackButton fallback="/events" />
            </div>
          </div>

          <hr className="sep" />

          <p className="p">{event.description || "Details will be added later."}</p>

          <hr className="sep" />

          <h3 style={{ margin: "0 0 8px" }}>Location</h3>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {event.mapUrl ? (
              <a className="btn primary" href={event.mapUrl} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            ) : (
              <button className="btn primary" type="button" disabled style={{ opacity: 0.6 }}>
                Map Not Available
              </button>
            )}

            <Link className="btn" to="/transport">
              Check Transport
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
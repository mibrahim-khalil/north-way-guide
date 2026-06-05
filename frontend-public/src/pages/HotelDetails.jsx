import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import HotelBookingModal from "../components/forms/HotelBookingModal";
import { useToast } from "../context/ToastContext";
import { requireLogin } from "../utils/requireLogin";
import { api } from "../utils/api";
import ReviewSection from "../components/common/ReviewSection";
import BackButton from "../components/common/BackButton";
import ImageGallery from "../components/common/ImageGallery";


function mapHotel(doc) {
  return {
    id: doc._id,
    name: doc.name,
    city: doc.city,
    rating: doc.rating || 0,
    priceFrom: doc.priceFrom || 0,
    image: (doc.images && doc.images[0]) || "",
    images: doc.images || [],
    address: doc.address || "",
    mapsUrl: doc.mapsUrl || "",
    description: doc.description || "",
    amenities: doc.amenities || [],
    rooms: doc.rooms || [],
  };
}

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    api
      .get(`/hotels/${id}`)
      .then((res) => {
        if (!alive) return;

        const raw = res.data?.item ?? res.data?.hotel ?? res.data;
        if (!raw || raw.isActive === false) {
          setHotel(null);
          return;
        }

        setHotel(mapHotel(raw));
      })
      .catch(() => {
        if (!alive) return;
        setHotel(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const onBookNow = async () => {
    const ok = await requireLogin(
      navigate,
      toast,
      "Please login to book a hotel",
      location.pathname + location.search
    );
    if (!ok) return;
    setOpen(true);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="cardBody">Loading...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Hotel not found</h2>
          <p className="p" style={{ marginTop: 8 }}>
            The hotel you are looking for doesn’t exist or is not available.
          </p>
          <Link className="btn" to="/hotels" style={{ marginTop: 12 }}>
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = hotel.images?.length ? hotel.images : [hotel.image].filter(Boolean);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`
        .backBtn{ border-radius: 999px; font-weight: 1000; padding: 10px 14px; }
      `}</style>

      <div className="card">
        <ImageGallery images={galleryImages} alt={hotel.name} height={320} fit="cover" /> {/* ✅ fit="cover" */}

        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{hotel.name}</h2>
              <p className="p">
                {hotel.city} • ★ {hotel.rating}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={onBookNow}>
                Book Now
              </button>
              <BackButton fallback="/hotels" />
            </div>
          </div>

          <hr className="sep" />

          <p className="p">{hotel.description}</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {hotel.amenities?.map((a) => (
              <span key={a} className="badge">{a}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="cardBody">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ margin: "0 0 8px" }}>Room Categories</h3>
              <button className="btn" onClick={onBookNow}>
                Book (Choose Room)
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {(hotel.rooms || []).length === 0 ? (
                <div className="p">No room categories added yet.</div>
              ) : (
                hotel.rooms.map((r, idx) => (
                  <div
                    key={r.id || r.name || idx}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "rgba(255,255,255,0.65)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong>{r.name}</strong>
                      <span style={{ fontWeight: 900 }}>PKR {r.pricePerNight}/night</span>
                    </div>
                    <div className="p" style={{ fontSize: 13, marginTop: 6 }}>
                      Capacity: {r.capacity} guests
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ReviewSection targetType="HOTEL" targetId={hotel.id} />

        <div className="card">
          <div className="cardBody">
            <h3 style={{ margin: "0 0 8px" }}>Location & Directions</h3>
            <p className="p">
              <b>Address:</b> {hotel.address || "—"}
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {hotel.mapsUrl ? (
                <a className="btn primary" href={hotel.mapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              ) : null}

              <Link className="btn" to="/transport">
                Check Transport
              </Link>
            </div>

            <hr className="sep" />

            <p className="p" style={{ fontSize: 13 }}>
              Note: Map integration (embedded map) can be added later using Google Maps API.
            </p>
          </div>
        </div>
      </div>

      <HotelBookingModal open={open} onClose={() => setOpen(false)} hotel={hotel} />
    </div>
  );
}
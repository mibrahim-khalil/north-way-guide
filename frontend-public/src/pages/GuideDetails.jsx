import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { requireLogin } from "../utils/requireLogin";
import GuideHireModal from "../components/forms/GuideHireModal";
import { api } from "../utils/api";
import ReviewSection from "../components/common/ReviewSection";
import BackButton from "../components/common/BackButton";
import ImageGallery from "../components/common/ImageGallery";

function mapGuide(doc) {
  return {
    id: doc._id,
    name: doc.name || "",
    image: (doc.images && doc.images[0]) || "",
    images: Array.isArray(doc.images) ? doc.images : [],
    area: doc.baseCity || "",
    rating: doc.rating ?? 0,
    pricePerDay: Number(doc.pricePerDay || 0),
    rate: doc.pricePerDay ? `PKR ${doc.pricePerDay}/day` : "—",
    experience: doc.bio || "—",
    specialization: Array.isArray(doc.specialties) ? doc.specialties.join(", ") : "—",
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    phone: doc.phone || "",
  };
}

export default function GuideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    api
      .get(`/guides/${id}`)
      .then((res) => {
        if (!alive) return;

        const raw = res.data?.item ?? res.data?.guide ?? res.data;
        if (!raw || raw.isActive === false) {
          setGuide(null);
          return;
        }
        setGuide(mapGuide(raw));
      })
      .catch(() => {
        if (!alive) return;
        setGuide(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const onHire = async () => {
    const ok = await requireLogin(
      navigate,
      toast,
      "Please login to hire a guide",
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

  if (!guide) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Guide not found</h2>
          <p className="p" style={{ marginTop: 8 }}>
            This guide does not exist or is not available.
          </p>
          <Link className="btn" to="/guides" style={{ marginTop: 12 }}>
            Back to Guides
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = guide.images?.length ? guide.images : [guide.image].filter(Boolean);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`
        .backBtn{ border-radius: 999px; font-weight: 1000; padding: 10px 14px; }
      `}</style>

      <div className="card">
        <ImageGallery images={galleryImages} alt={guide.name} height={320} fit="cover" /> {/* ✅ fit="cover" */}

        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{guide.name}</h2>
              <p className="p">
                Area: <b>{guide.area}</b> • Rating: <b>★ {guide.rating}</b> • Rate: <b>{guide.rate}</b>
              </p>
              {guide.languages?.length ? (
                <p className="p" style={{ fontSize: 13 }}>
                  Languages: <b>{guide.languages.join(", ")}</b>
                </p>
              ) : null}
            </div>

            <BackButton fallback="/guides" />
          </div>

          <hr className="sep" />

          <div className="grid cols-2">
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody">
                <h3 style={{ margin: "0 0 8px" }}>Experience</h3>
                <p className="p">{guide.experience || "—"}</p>
                <hr className="sep" />
                <h3 style={{ margin: "0 0 8px" }}>Specialization</h3>
                <p className="p">{guide.specialization || "—"}</p>
              </div>
            </div>

            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardBody">
                <h3 style={{ margin: "0 0 8px" }}>Service Details</h3>
                <div className="p" style={{ fontSize: 13 }}>
                  <b>Service Area:</b> {guide.area}
                </div>
                <div className="p" style={{ fontSize: 13, marginTop: 6 }}>
                  <b>Charges:</b> {guide.rate}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn primary" onClick={onHire}>Hire Now</button>
                  <button className="btn" onClick={() => toast("Messaging will be added later (UI)")}>
                    Message (UI)
                  </button>
                </div>

                <hr className="sep" />
                <p className="p" style={{ fontSize: 13 }}>
                  After hiring, you will be redirected to submit payment proof (same as hotel).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReviewSection targetType="GUIDE" targetId={guide.id} />
      <GuideHireModal open={open} onClose={() => setOpen(false)} guide={guide} />
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { requireLogin } from "../utils/requireLogin";
import ReviewSection from "../components/common/ReviewSection";

function normalizeProduct(p) {
  if (!p) return null;
  return {
    ...p,
    id: p._id || p.id,
    image: (Array.isArray(p.images) && p.images[0]) || p.image || p.imageUrl || "",
    price: Number(p.price ?? 0),
  };
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const display = useMemo(() => normalizeProduct(product), [product]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (!alive) return;
        setProduct(res.data?.item || null);
      } catch {
        if (!alive) return;
        setProduct(null);
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

  if (!display) {
    return (
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: 0 }}>Product not found</h2>
          <p className="p" style={{ marginTop: 8 }}>
            This product is not available (maybe not approved yet).
          </p>
          <Link className="btn" to="/local-products" style={{ marginTop: 12 }}>
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const shopName = display.locationName || display.shopName || "—";
  const mapsUrl = display.googleMapUrl || display.mapsUrl || "";

  const handleAdd = async () => {
    const ok = await requireLogin(navigate, toast, "Please login to add items to cart", location.pathname);
    if (!ok) return;

    addToCart(display, 1);
    toast(`${display.name} added to cart`);
  };

  const handleBuyNow = async () => {
    const ok = await requireLogin(navigate, toast, "Please login to continue", location.pathname);
    if (!ok) return;

    addToCart(display, 1);
    toast(`${display.name} added to cart — opening cart...`, 1800);
    setTimeout(() => navigate("/cart"), 650);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <img
          src={display.image}
          alt={display.name}
          style={{ height: 320, width: "100%", objectFit: "cover" }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />

        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{display.name}</h2>
              <p className="p">
                Category: <b>{display.category}</b> • Price:{" "}
                <b>PKR {Number(display.price || 0).toLocaleString("en-PK")}</b>
              </p>
            </div>

            <Link className="btn ghost" to="/local-products">
              Back
            </Link>
          </div>

          <ReviewSection targetType="PRODUCT" targetId={display.id} />

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={handleAdd}>
              Add to Cart
            </button>
            <button className="btn ghost" onClick={handleBuyNow}>
              Buy Now
            </button>
            <Link className="btn ghost" to="/cart">
              Go to Cart
            </Link>
          </div>

          <hr className="sep" />

          <p className="p">{display.description || "Description will be added later."}</p>

          <hr className="sep" />

          <h3 style={{ margin: "0 0 8px" }}>Shop & Location</h3>

          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardBody">
              <div className="p" style={{ margin: 0 }}>
                <b>Shop:</b> {shopName}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {mapsUrl ? (
                  <a className="btn primary" href={mapsUrl} target="_blank" rel="noreferrer">
                    Open Google Maps
                  </a>
                ) : null}

                <Link className="btn ghost" to="/local-products">
                  Shop More Products
                </Link>

                <Link className="btn ghost" to="/transport">
                  Check Transport
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { requireLogin } from "../../utils/requireLogin";
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

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [imgOk, setImgOk] = useState(true);

  const rawImage =
    product?.image ||
    (Array.isArray(product?.images) && product.images[0]) ||
    "";

  const image = useMemo(() => resolveMediaUrl(rawImage), [rawImage]);

  const handleAdd = async () => {
    const ok = await requireLogin(
      navigate,
      toast,
      "Please login to add items to cart",
      location.pathname
    );
    if (!ok) return;

    addToCart(product, 1);
    toast(`${product.name} added to cart`);
  };

  const ratingAvg = Number(product?.ratingAvg ?? product?.rating ?? 0);
  const ratingCount = Number(product?.ratingCount ?? 0);

  const ratingText =
    ratingCount > 0 && ratingAvg > 0
      ? `${ratingAvg.toFixed(1)} (${ratingCount})`
      : "New";

  const tag = product?.category || "Product";

  const frame = { width: "100%", height: 170 };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {image && imgOk ? (
          <img
            src={image}
            alt={product?.name}
            style={{
              ...frame,
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
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

        {/* ✅ Same Gradient as SpotCard */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 42%, rgba(2,6,23,0.00) 70%)",
          }}
        />

        {/* ✅ Overlay Chips (SAME AS SPOT CARD) */}
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
          {/* ⭐ Rating Chip */}
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
              border: "1px solid rgba(245,158,11,0.55)",
              color: "rgb(253,230,138)",
              boxShadow: "0 10px 22px rgba(2,6,23,0.22)",
              whiteSpace: "nowrap",
            }}
            title={
              ratingCount > 0
                ? `${ratingAvg.toFixed(1)} out of 5 (${ratingCount} reviews)`
                : "No reviews yet"
            }
          >
            ★ {ratingText}
          </span>

          {/* 🏷 Category Tag Chip */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              boxShadow: "0 10px 22px rgba(2,6,23,0.22)",
              whiteSpace: "nowrap",
            }}
            title={tag}
          >
            {tag}
          </span>
        </div>
      </div>

      <div className="cardBody">
        <div style={{ fontWeight: 1100, color: "var(--heading)" }}>
          {product?.name}
        </div>

        <p className="p" style={{ marginTop: 8, fontSize: 13 }}>
          Price:{" "}
          <b>
            PKR {Number(product?.price || 0).toLocaleString("en-PK")}
          </b>
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            className="btn primary"
            style={{ flex: 1 }}
            onClick={handleAdd}
          >
            Add to Cart
          </button>

          <Link
            className="btn ghost"
            style={{ flex: 1 }}
            to={`/local-products/${product?.id}`}
          >
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
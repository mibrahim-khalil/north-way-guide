import { useState } from "react";
import { Link } from "react-router-dom";
import ProductOrderModal from "../forms/ProductOrderModal";

export default function ProductListItem({ product }) {
  const [open, setOpen] = useState(false);

  const ratingAvg = Number(product?.ratingAvg ?? 0);
  const ratingCount = Number(product?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0
      ? `${ratingAvg.toFixed(1)} (${ratingCount})`
      : "New";

  const tag = product?.category || "Product";

  return (
    <>
      <div className="card listCard">
        <div className="listCardImage">
          <img src={product.image} alt={product.name} />

          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            gap: 8,
            zIndex: 5,
          }}>
            <span style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(245,158,11,0.55)",
              color: "rgb(253,230,138)",
            }}>
              ★ {ratingText}
            </span>

            <span style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 1100,
              fontSize: 12,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
            }}>
              {tag}
            </span>
          </div>
        </div>

        <div className="listCardContent">
          <div style={{ fontWeight: 1100, fontSize: 18 }}>
            {product.name}
          </div>

          <p className="p">PKR {product.price}</p>

          <div className="listCardActions">
            <button className="btn primary" onClick={() => setOpen(true)}>
              Order Now
            </button>
            <Link className="btn ghost" to={`/local-products/${product.id}`}>
              More Info
            </Link>
          </div>
        </div>
      </div>

      <ProductOrderModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import ProductOrderModal from "../forms/ProductOrderModal";
import { toFileUrl } from "../../utils/toFileUrl";

export default function ProductListItem({ product }) {
  const [open, setOpen] = useState(false);

  const ratingAvg = Number(product?.ratingAvg ?? 0);
  const ratingCount = Number(product?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const tag = product?.category || "Product";

  const rawImage = product?.image || (Array.isArray(product?.images) && product.images[0]) || "";
  const image = toFileUrl(rawImage);

  return (
    <>
      <div className="card listCard">
        <div className="listCardImage">
          <img
            src={image}
            alt={product?.name}
            onError={(e) => (e.currentTarget.src = "/images/home1.png")}
          />
          <div className="nkChipRow">
            <span className="nkChip nkChip--onImage">{tag}</span>
            <span className="nkChip nkChip--onImage">★ {ratingText}</span>
          </div>
        </div>

        <div className="listCardContent">
          <div className="nkTitle nkTitle--lg">{product?.name}</div>
          <div className="nkPrice">PKR {product?.price}</div>

          <div className="listCardActions">
            <button className="btn primary" onClick={() => setOpen(true)}>Order Now</button>
            <Link className="btn ghost" to={`/local-products/${product?.id || product?._id}`}>
              More Info
            </Link>
          </div>
        </div>
      </div>

      <ProductOrderModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}
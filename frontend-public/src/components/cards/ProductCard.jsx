import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { requireLogin } from "../../utils/requireLogin";
import { toFileUrl } from "../../utils/toFileUrl";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [imgOk, setImgOk] = useState(true);

  const rawImage = product?.image || (Array.isArray(product?.images) && product.images[0]) || "";
  const image = useMemo(() => toFileUrl(rawImage), [rawImage]);

  const handleAdd = async () => {
    const ok = await requireLogin(
      navigate,
      toast,
      "Please login to add items to cart",
      location.pathname
    );
    if (!ok) return;
    addToCart(product, 1);
    toast(`${product?.name} added to cart`);
  };

  const ratingAvg = Number(product?.ratingAvg ?? product?.rating ?? 0);
  const ratingCount = Number(product?.ratingCount ?? 0);
  const ratingText =
    ratingCount > 0 && ratingAvg > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount})` : "New";

  const tag = product?.category || "Product";

  return (
    <div className="card nkCard">
      <div className="nkMedia">
        {image && imgOk ? (
          <img src={image} alt={product?.name} className="nkImg" onError={() => setImgOk(false)} />
        ) : (
          <div className="nkImgPlaceholder" />
        )}

        <div className="nkChipRow">
          <span className="nkChip nkChip--onImage">{tag}</span>
          <span className="nkChip nkChip--onImage">★ {ratingText}</span>
        </div>
      </div>

      <div className="nkBody">
        <div className="nkTitle">{product?.name}</div>
        <div className="nkMeta">{tag}</div>
        <div className="nkPrice">PKR {Number(product?.price || 0).toLocaleString("en-PK")}</div>

        <div className="nkActions">
          <button className="btn primary" onClick={handleAdd}>Add to Cart</button>
          <Link className="btn ghost" to={`/local-products/${product?.id || product?._id}`}>
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
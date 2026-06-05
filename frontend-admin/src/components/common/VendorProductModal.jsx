import { useEffect, useMemo, useState } from "react";
import "./VendorProductModal.css";

const emptyProduct = {
  id: "",
  name: "",
  category: "",
  price: 0,
  image: "",
  inStock: true,
  description: "",
};

export default function VendorProductModal({ open, onClose, initialProduct, onSave }) {
  const isEdit = Boolean(initialProduct?.id);
  const [product, setProduct] = useState(emptyProduct);

  useEffect(() => {
    if (!open) return;
    setProduct(initialProduct ? { ...emptyProduct, ...initialProduct } : emptyProduct);
  }, [open, initialProduct]);

  const title = useMemo(() => (isEdit ? "Edit Product" : "Add Product"), [isEdit]);

  if (!open) return null;

  const onChange = (k) => (e) => setProduct((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!product.id || !product.name || !product.category) {
      return alert("Product ID, Name and Category are required.");
    }
    const payload = {
      ...product,
      price: Number(product.price || 0),
      inStock: String(product.inStock) === "true" || product.inStock === true,
    };
    onSave?.(payload);
    onClose?.();
  };

  return (
    <>
      <div className="vpmOverlay" onClick={onClose} />
      <div className="vpmModal" role="dialog" aria-modal="true">
        <div className="vpmTop">
          <div>
            <div className="vpmTitle">{title}</div>
            <div className="vpmSub">Vendor products (mock now, backend later)</div>
          </div>
          <button className="vpmClose" onClick={onClose}>✕</button>
        </div>

        <form className="vpmForm" onSubmit={submit}>
          <div className="vpmGrid">
            <div>
              <label>Product ID *</label>
              <input className="vpmInput" value={product.id} onChange={onChange("id")} disabled={isEdit} />
              <div className="vpmHint">Unique id e.g. shilajit-250g</div>
            </div>

            <div>
              <label>In Stock</label>
              <select className="vpmInput" value={String(product.inStock)} onChange={(e) => setProduct((p) => ({ ...p, inStock: e.target.value }))}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label>Name *</label>
              <input className="vpmInput" value={product.name} onChange={onChange("name")} />
            </div>

            <div>
              <label>Category *</label>
              <input className="vpmInput" value={product.category} onChange={onChange("category")} placeholder="Herbal / Food / Handicraft" />
            </div>

            <div>
              <label>Price (PKR)</label>
              <input className="vpmInput" type="number" min="0" value={product.price} onChange={onChange("price")} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Image URL</label>
              <input className="vpmInput" value={product.image} onChange={onChange("image")} placeholder="https://..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea className="vpmInput" rows="3" value={product.description} onChange={onChange("description")} />
            </div>
          </div>

          <div className="vpmActions">
            <button type="button" className="aBtn" onClick={onClose}>Cancel</button>
            <button type="submit" className="aBtn primary">{isEdit ? "Save Changes" : "Create Product"}</button>
          </div>
        </form>
      </div>
    </>
  );
}
import { useState } from "react";
import "./ProductOrderModal.css";

export default function ProductOrderModal({ open, onClose, product }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    quantity: 1,
    address: "",
    notes: "",
  });

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  if (!open || !product) return null;

  const total = Number(product.price || 0) * Number(form.quantity || 1);

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.quantity) {
      alert("Please fill all required fields.");
      return;
    }

    alert(
      `Order placed (UI)\n\nProduct: ${product.name}\nQty: ${form.quantity}\nTotal: PKR ${total}\nName: ${form.fullName}\nPhone: ${form.phone}\nAddress: ${form.address}`
    );
    onClose?.();
  };

  return (
    <>
      <div className="poOverlay" onClick={onClose} />
      <div className="poModal" role="dialog" aria-modal="true">
        <div className="poTop">
          <div>
            <div className="poTitle">Order Product</div>
            <div className="poSub">{product.name} • PKR {product.price}</div>
          </div>
          <button className="poClose" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="poForm" onSubmit={submit}>
          <div className="poGrid">
            <div>
              <label>Full Name *</label>
              <input className="input" value={form.fullName} onChange={onChange("fullName")} />
            </div>

            <div>
              <label>Phone Number *</label>
              <input className="input" value={form.phone} onChange={onChange("phone")} placeholder="03xx-xxxxxxx" />
            </div>

            <div>
              <label>Quantity *</label>
              <input className="input" type="number" min="1" value={form.quantity} onChange={onChange("quantity")} />
            </div>

            <div>
              <label>Total</label>
              <input className="input" value={`PKR ${total}`} readOnly />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Delivery Address *</label>
              <textarea rows="3" value={form.address} onChange={onChange("address")} placeholder="Complete address..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Notes (optional)</label>
              <textarea rows="3" value={form.notes} onChange={onChange("notes")} placeholder="Any instruction..." />
            </div>
          </div>

          <div className="poActions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">Place Order (UI)</button>
          </div>
        </form>
      </div>
    </>
  );
}
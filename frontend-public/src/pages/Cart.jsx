import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function Cart() {
  const { items, totals, updateQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onClear = () => {
    if (!items.length) return;
    clearCart();
    toast("Cart cleared");
  };

  const onCheckout = () => {
    if (!items.length) return toast("Your cart is empty");
    navigate("/checkout");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Your Cart</h2>
          <p className="p">
            Items: <b>{totals.count}</b> • Subtotal: <b>PKR {totals.amount.toLocaleString("en-PK")}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={onClear} disabled={!items.length}>
            Clear Cart
          </button>
          <Link className="btn ghost" to="/local-products">
            Continue Shopping
          </Link>
          <button className="btn primary" onClick={onCheckout}>
            Checkout
          </button>
        </div>
      </div>

      {!items.length ? (
        <div className="card">
          <div className="cardBody">
            <p className="p">Your cart is empty.</p>
            <Link className="btn primary" to="/local-products" style={{ marginTop: 12 }}>
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="cardBody" style={{ display: "grid", gap: 12 }}>
            {items.map((it) => (
              <div
                key={it.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "rgba(255,255,255,0.55)",
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <img
                  src={it.image}
                  alt={it.name}
                  style={{ width: 80, height: 70, borderRadius: 14, objectFit: "cover" }}
                />

                <div>
                  <div style={{ fontWeight: 1000, color: "var(--heading)" }}>{it.name}</div>
                  <div className="p" style={{ fontSize: 13 }}>
                    PKR {it.price.toLocaleString("en-PK")} • Total:{" "}
                    <b>PKR {(it.price * it.quantity).toLocaleString("en-PK")}</b>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ margin: 0, fontWeight: 900, color: "var(--muted)", fontSize: 12 }}>
                      Qty
                    </label>

                    <input
                      className="input"
                      style={{ width: 110 }}
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => {
                        updateQty(it.productId, e.target.value);
                        toast("Quantity updated");
                      }}
                    />

                    <Link className="btn ghost" to={`/local-products/${it.productId}`}>
                      More Info
                    </Link>

                    <button
                      className="btn"
                      onClick={() => {
                        removeItem(it.productId);
                        toast("Item removed");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 1000, color: "var(--heading)" }}>
                  PKR {(it.price * it.quantity).toLocaleString("en-PK")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px){
          .cardBody div[style*="grid-template-columns: 80px 1fr auto"]{
            grid-template-columns: 80px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
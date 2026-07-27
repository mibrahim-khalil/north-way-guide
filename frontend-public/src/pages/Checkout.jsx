import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { api } from "../utils/api";

const METHODS = [
  { label: "Bank Transfer", code: "BANK_TRANSFER" },
  { label: "Easypaisa", code: "EASYPAISA" },
  { label: "JazzCash", code: "JAZZCASH" },
  { label: "NayaPay", code: "NAYAPAY" },
];

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

export default function Checkout() {
  const { items, totals, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    methodCode: "BANK_TRANSFER",
    notes: "",
  });

  const [placing, setPlacing] = useState(false);

  //  when backend splits into multiple vendor orders, we show them here
  const [createdOrders, setCreatedOrders] = useState([]); // array of ProductOrder docs

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!items.length) return toast("Cart is empty.", 2000);
    if (!form.fullName || !form.phone || !form.address) {
      return toast("Please fill all required fields.", 2500);
    }

    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shipping: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: "",
          googleMapUrl: "",
          note: form.notes,
        },
        paymentMethod: form.methodCode,
      };

      const res = await api.post("/orders", payload);

      const list = Array.isArray(res.data?.items)
        ? res.data.items
        : res.data?.item
        ? [res.data.item]
        : [];

      if (!list.length) {
        toast("Order placed but no order returned by server.", 3000);
        return;
      }

      clearCart();

      //  If only 1 order => send user directly to submit payment
      if (list.length === 1) {
        const order = list[0];
        toast("Order placed. Please submit payment proof.", 3000);
        navigate(`/submit-payment?type=PRODUCT_ORDER&id=${order._id}&method=${form.methodCode}`);
        return;
      }

      // Multiple orders created (split by vendor)
      setCreatedOrders(list);
      toast(`Your cart was split into ${list.length} vendor orders. Submit proof for each one.`, 3500);
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to place order", 3000);
    } finally {
      setPlacing(false);
    }
  };

  // After split: show the "submit proof for each order" panel
  if (createdOrders.length > 0) {
    return (
      <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="cardBody">
          <h2 style={{ margin: "0 0 6px" }}>Orders Created</h2>
          <p className="p">
            Your cart contained items from multiple vendors, so we created <b>{createdOrders.length}</b> separate orders.
            Please submit payment proof for each order.
          </p>

          <hr className="sep" />

          <div style={{ display: "grid", gap: 12 }}>
            {createdOrders.map((o) => (
              <div key={o._id} className="card" style={{ boxShadow: "none" }}>
                <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>
                      Order #{String(o._id).slice(-6).toUpperCase()}
                    </div>
                    <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                      Items: {(o.items || []).length} • Total: <b>{money(o.total)}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      className="btn primary"
                      to={`/submit-payment?type=PRODUCT_ORDER&id=${o._id}&method=${form.methodCode}`}
                    >
                      Submit Proof
                    </Link>
                    <Link className="btn" to="/orders">
                      View in Orders
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link className="btn" to="/orders">Order History</Link>
            <Link className="btn" to="/local-products">Continue Shopping</Link>
            <button className="btn" type="button" onClick={() => navigate("/profile")}>
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.15fr .85fr", gap: 16 }}>
      <div className="card">
        <div className="cardBody">
          <h2 style={{ margin: "0 0 6px" }}>Checkout</h2>
          <p className="p">Enter delivery details and select payment method.</p>

          <hr className="sep" />

          <form onSubmit={placeOrder} style={{ display: "grid", gap: 12 }}>
            <div>
              <label>Full Name *</label>
              <input className="input" value={form.fullName} onChange={onChange("fullName")} />
            </div>

            <div>
              <label>Phone *</label>
              <input className="input" value={form.phone} onChange={onChange("phone")} placeholder="03xx-xxxxxxx" />
            </div>

            <div>
              <label>Delivery Address *</label>
              <textarea className="input" rows="3" value={form.address} onChange={onChange("address")} />
            </div>

            <div>
              <label>Payment Method *</label>
              <select className="input" value={form.methodCode} onChange={onChange("methodCode")}>
                {METHODS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>

              <p className="p" style={{ fontSize: 12, marginTop: 8 }}>
                After placing the order, you must upload payment proof.
                If your cart contains multiple vendors, you will submit proof for each vendor order.
              </p>
            </div>

            <div>
              <label>Notes (optional)</label>
              <textarea className="input" rows="2" value={form.notes} onChange={onChange("notes")} />
            </div>

            <button className="btn primary" type="submit" disabled={!items.length || placing}>
              {placing ? "Placing..." : "Place Order"}
            </button>

            <Link className="btn" to="/cart">
              Back to Cart
            </Link>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <h3 style={{ margin: "0 0 10px" }}>Order Summary</h3>
          <div className="p" style={{ fontSize: 13 }}>
            Items: <b>{totals.count}</b>
          </div>
          <div className="p" style={{ fontSize: 13, marginTop: 6 }}>
            Subtotal: <b>PKR {totals.amount.toLocaleString("en-PK")}</b>
          </div>

          <hr className="sep" />

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div className="p" style={{ fontSize: 13 }}>
                  {it.name} × {it.quantity}
                </div>
                <div style={{ fontWeight: 1000, color: "var(--heading)" }}>
                  PKR {(it.price * it.quantity).toLocaleString("en-PK")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px){
          .grid[style*="grid-template-columns"]{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
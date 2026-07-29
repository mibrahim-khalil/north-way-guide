import { createContext, useContext, useMemo, useState } from "react";

const CartCtx = createContext(null);
const KEY = "nw_cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  const persist = (next) => {
    setItems(next);
    saveCart(next);
  };
  const addToCart = (product, qty = 1) => {
    const q = Math.max(1, Number(qty || 1));
    const found = items.find((i) => i.productId === product.id);

    if (found) {
      persist(
        items.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + q } : i
        )
      );
    } else {
      persist([
        ...items,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image: product.image,
          quantity: q,
        },
      ]);
    }
  };
  const updateQty = (productId, qty) => {
    const q = Math.max(1, Number(qty || 1));
    persist(items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i)));
  };

  const removeItem = (productId) => {
    persist(items.filter((i) => i.productId !== productId));
  };

  const clearCart = () => persist([]);

  const totals = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const amount = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return { count, amount };
  }, [items]);

  return (
    <CartCtx.Provider value={{ items, addToCart, updateQty, removeItem, clearCart, totals }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
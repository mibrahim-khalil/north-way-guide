import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/cards/ProductCard";
import ProductListItem from "../components/cards/ProductListItem";
import { api } from "../utils/api";

const normalizeProduct = (p) => {
  const id = p?._id || p?.id;
  const image = (Array.isArray(p?.images) && p.images[0]) || p?.image || p?.imageUrl || "";
  const price = Number(p?.price ?? p?.unitPrice ?? p?.pricePKR ?? 0);
  const stock = Number(p?.stock ?? (p?.inStock ? 1 : 0));

  return {
    ...p,
    id,
    image,
    price,
    inStock: typeof p?.inStock === "boolean" ? p.inStock : stock > 0,
  };
};

export default function LocalProducts() {
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageSize = view === "grid" ? 12 : 10;

  useEffect(() => setPage(1), [view]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const params = {
          search: "",
          category: "",
          location: "",
          page,
          limit: pageSize,
          sort: "newest",
        };

        const res = await api.get("/products", { params });

        const data = res.data || {};
        const itemsRaw = data.items || data.products || data.data || data.rows || [];
        const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeProduct) : [];

        const totalCount = data.total ?? data.totalCount ?? data.count ?? items.length;

        if (!alive) return;
        setRows(items);
        setTotal(Number(totalCount || 0));
      } catch (err) {
        if (!alive) return;
        setRows([]);
        setTotal(0);
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => rows, [rows]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Local Products</h2>
          <p className="p">
            {loading ? "Loading..." : `Showing ${pageItems.length} of ${total} products`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={`btn ${view === "grid" ? "primary" : ""}`} onClick={() => setView("grid")}>
            Grid
          </button>
          <button className={`btn ${view === "list" ? "primary" : ""}`} onClick={() => setView("list")}>
            List
          </button>
        </div>
      </div>

      <hr className="sep" />

      {loading ? (
        <div className="card">
          <div className="cardBody">
            <p className="p">Loading products...</p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pageItems.map((p) => (
            <ProductListItem key={p.id} product={p} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button className="btn" disabled={page === 1 || loading} onClick={() => setPage((x) => x - 1)}>
          Prev
        </button>
        <span className="badge">
          Page {page} / {totalPages}
        </span>
        <button className="btn" disabled={page === totalPages || loading} onClick={() => setPage((x) => x + 1)}>
          Next
        </button>
      </div>
    </>
  );
}
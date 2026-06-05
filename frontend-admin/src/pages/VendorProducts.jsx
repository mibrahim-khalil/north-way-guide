import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { api } from "../utils/api";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const pickProduct = (p) => {
  const id = p?._id || p?.id;
  return {
    raw: p,
    id,
    status: p?.status,
    name: p?.name || "—",
    category: p?.category || "—",
    price: Number(p?.price ?? 0),
    stock: p?.stock,
    vendorId: p?.vendor?._id || p?.vendorId,
    vendorShop: p?.vendor?.shopName || p?.vendorShopName,
    createdAt: p?.createdAt,
  };
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 20.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ActionsMenu({ open, anchorRect, onClose, items }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose();
    const onClickAway = () => onClose();
    const onScroll = () => onClose();
    const onResize = () => onClose();

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClickAway);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClickAway);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const width = 260;
  const gap = 8;
  const left = clamp(anchorRect.right - width, 10, window.innerWidth - width - 10);
  const top = clamp(anchorRect.bottom + gap, 10, window.innerHeight - 10);

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top,
        left,
        width,
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(15,23,42,0.10)",
        borderRadius: 14,
        boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        overflow: "hidden",
        zIndex: 99999,
        backdropFilter: "blur(12px)",
      }}
    >
      {items.map((it, idx) => (
        <button
          key={idx}
          type="button"
          disabled={it.disabled}
          onClick={() => {
            if (it.disabled) return;
            it.onClick?.();
            onClose();
          }}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: it.disabled ? "not-allowed" : "pointer",
            fontWeight: 900,
            fontSize: 13,
            color: it.danger ? "#b91c1c" : "#0f172a",
            opacity: it.disabled ? 0.55 : 1,
            borderBottom: idx === items.length - 1 ? "none" : "1px solid rgba(15,23,42,0.06)",
          }}
          title={it.title || ""}
        >
          {it.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

export default function VendorProducts() {
  const { vendorId } = useParams();

  const [tab, setTab] = useState("PENDING");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/products", {
        params: {
          status: tab,
          ...(vendorId ? { vendorId } : {}),
        },
      });

      const data = res.data || {};
      const listRaw = data.items || data.products || data.rows || data.data || [];
      const list = Array.isArray(listRaw) ? listRaw.map(pickProduct) : [];
      setRows(list);
    } catch (err) {
      console.error(err);
      setRows([]);
      alert(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab, vendorId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((p) => {
      const hay = [p.id, p.name, p.category, p.vendorShop, p.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q]);

  const approve = async (row) => {
    const ok = window.confirm(`Approve product "${row.name}"?`);
    if (!ok) return;
    try {
      await api.patch(`/admin/products/${row.id}/approve`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to approve product");
    }
  };

  const reject = async (row) => {
    const ok = window.confirm(`Reject product "${row.name}"?`);
    if (!ok) return;
    try {
      await api.patch(`/admin/products/${row.id}/reject`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject product");
    }
  };

  const openMenu = (id, btnEl) => {
    if (!btnEl) return;
    setMenuFor(id);
    setMenuRect(btnEl.getBoundingClientRect());
  };
  const closeMenu = () => {
    setMenuFor(null);
    setMenuRect(null);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .evTableOuter{
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.55);
          overflow: hidden;
        }
        .evTableScroll{ overflow-x:auto; }
        .evTable{
          width:100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          font-size: 13px;
          min-width: 980px;
        }
        .evTable thead th{
          text-align:left;
          padding: 12px 12px;
          font-size: 12px;
          font-weight: 1000;
          color: rgba(15,23,42,0.82);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(15,23,42,0.10);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .evTable tbody td{
          padding: 12px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.40);
        }
        .evTable tbody tr:hover td{
          background: rgba(109,40,217,0.06);
        }
        .evTable tbody tr:last-child td{
          border-bottom: none;
        }
        .evTitle{
          font-weight: 1000;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .evSub{
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kebabBtn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.70);
          cursor:pointer;
        }
        .kebabBtn:hover{
          background: rgba(109,40,217,0.06);
          border-color: rgba(109,40,217,0.18);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Vendor Products</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Approve/Reject vendor products
            {vendorId ? (
              <>
                {" "}• vendorId: <b style={{ color: "var(--heading)" }}>{vendorId}</b>
              </>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="aBtn" to="/admin/manage-vendors">
            Back
          </Link>
          <button className="aBtn" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} className={`aBtn ${tab === t.key ? "primary" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
            <input className="hmInput" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
          </div>

          <div style={{ fontWeight: 900, color: "var(--muted)" }}>
            Results: <b style={{ color: "var(--heading)" }}>{filtered.length}</b>
            {loading ? " (loading...)" : ""}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          {loading ? (
            <div className="adminMuted">Loading...</div>
          ) : (
            <div className="evTableOuter">
              <div className="evTableScroll">
                <table className="evTable">
                  <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((p) => {
                      const menuItems =
                        p.status === "PENDING"
                          ? [
                              { label: "Approve", onClick: () => approve(p) },
                              { label: "Reject", danger: true, onClick: () => reject(p) },
                            ]
                          : [{ label: "Refresh list", onClick: () => load() }];

                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="evTitle">{p.name}</div>
                            <div className="evSub">id: {p.id}</div>
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{p.vendorShop || p.vendorId || "—"}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{p.category}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            PKR {Number(p.price || 0).toLocaleString("en-PK")}
                          </td>

                          <td>
                            <span className={`pill ${p.status === "APPROVED" ? "ok" : p.status === "REJECTED" ? "danger" : "warn"}`}>
                              {p.status}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="kebabBtn"
                              title="Actions"
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (menuFor === p.id) return closeMenu();
                                openMenu(p.id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === p.id}
                              anchorRect={menuFor === p.id ? menuRect : null}
                              onClose={closeMenu}
                              items={menuItems}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 18, color: "var(--muted)", fontWeight: 900 }}>
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
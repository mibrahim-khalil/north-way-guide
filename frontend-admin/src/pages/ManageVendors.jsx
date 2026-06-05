import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const pick = (v) => {
  const id = v?._id || v?.id;
  const payload = v?.payload || {};
  return {
    raw: v,
    id,
    status: v?.status,
    adminNote: v?.adminNote,
    shopName: payload?.shopName || v?.shopName || "—",
    city: payload?.city || v?.city || "—",
    phone: payload?.phone || v?.phone || "—",
    address: payload?.address || v?.address || "—",
    createdAt: v?.createdAt,
    userId: v?.user?._id || v?.userId || v?.ownerId,
    userEmail: v?.user?.email,
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

export default function ManageVendors() {
  const [tab, setTab] = useState("PENDING");
  const [q, setQ] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [menuFor, setMenuFor] = useState(null);
  const [menuRect, setMenuRect] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/vendor-applications", {
        params: { status: tab },
      });
      const data = res.data || {};
      const listRaw = data.items || data.applications || data.rows || data.data || [];
      const list = Array.isArray(listRaw) ? listRaw.map(pick) : [];
      setRows(list);
    } catch (err) {
      console.error(err);
      setRows([]);
      alert(err?.response?.data?.message || "Failed to load vendor applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((v) => {
      const hay = [v.id, v.shopName, v.city, v.phone, v.address, v.userEmail, v.status, v.adminNote]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q]);

  const approve = async (row) => {
    const ok = window.confirm(`Approve vendor "${row.shopName}"?`);
    if (!ok) return;
    try {
      await api.patch(`/admin/vendor-applications/${row.id}/approve`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to approve vendor");
    }
  };

  const reject = async (row) => {
    const adminNote = window.prompt(`Reject vendor "${row.shopName}"?\nOptional admin note:`, "");
    if (adminNote === null) return;
    try {
      await api.patch(`/admin/vendor-applications/${row.id}/reject`, { adminNote });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject vendor");
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
          <h2 style={{ margin: 0 }}>Manage Vendors</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Approve vendor applications.</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="aBtn" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <Link className="aBtn" to="/admin/vendor-products">
            Pending Products
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`aBtn ${tab === t.key ? "primary" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="cardBody" style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, opacity: 0.85 }}>Search</div>
            <input
              className="hmInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shop, city, phone, status..."
            />
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
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>City</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Admin Note</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => {
                      const isPending = v.status === "PENDING";

                      const menuItems = [
                        ...(isPending
                          ? [
                              { label: "Approve", onClick: () => approve(v) },
                              { label: "Reject", danger: true, onClick: () => reject(v) },
                            ]
                          : []),
                        { label: "Refresh list", onClick: () => load() },
                      ];

                      return (
                        <tr key={v.id}>
                          <td>
                            <div className="evTitle">{v.shopName}</div>
                            <div className="evSub">id: {v.id}</div>
                            {v.userEmail ? <div className="evSub">user: {v.userEmail}</div> : null}
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{v.city}</td>
                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>{v.phone}</td>

                          <td>
                            <span
                              className={`pill ${
                                v.status === "APPROVED" ? "ok" : v.status === "REJECTED" ? "danger" : "warn"
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>

                          <td style={{ fontWeight: 900, color: "rgba(100,116,139,0.95)" }}>
                            {v.adminNote || "—"}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="kebabBtn"
                              title="Actions"
                              onMouseDown={(ev) => ev.stopPropagation()}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (menuFor === v.id) return closeMenu();
                                openMenu(v.id, ev.currentTarget);
                              }}
                            >
                              <KebabIcon />
                            </button>

                            <ActionsMenu
                              open={menuFor === v.id}
                              anchorRect={menuFor === v.id ? menuRect : null}
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
                          No applications found.
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
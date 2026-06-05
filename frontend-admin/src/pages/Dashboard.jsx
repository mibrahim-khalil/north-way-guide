import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

function pickItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.applications)) return data.applications;
  return [];
}

function countByType(byType = [], key) {
  const hit = (byType || []).find((x) => String(x?._id) === String(key));
  return Number(hit?.count || 0);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [totals, setTotals] = useState({
    hotels: 0,
    spots: 0,
    transport: 0,
    guides: 0,
    vendorsApproved: 0,
  });

  const [pending, setPending] = useState({
    guides: 0,
    hotels: 0,
    transport: 0,
    vendors: 0,
    products: 0,
  });

  const [orders, setOrders] = useState({
    total: 0,
    placed: 0,
    unpaid: 0,
  });

  const refresh = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [
        hotelsRes,
        spotsRes,
        transportRes,
        guidesRes,

        summaryRes,
        vendorPendingRes,
        vendorApprovedRes,
        productsPendingRes,

        ordersRes,
      ] = await Promise.allSettled([
        api.get("/hotels"),
        api.get("/spots"),
        api.get("/transport"),
        api.get("/guides"),

        api.get("/admin/applications/summary"),
        api.get("/admin/vendor-applications", { params: { status: "PENDING" } }),
        api.get("/admin/vendor-applications", { params: { status: "APPROVED" } }),
        api.get("/admin/products", { params: { status: "PENDING" } }),

        api.get("/admin/orders"),
      ]);

      const hotelsItems = hotelsRes.status === "fulfilled" ? pickItems(hotelsRes.value.data) : [];
      const spotsItems = spotsRes.status === "fulfilled" ? pickItems(spotsRes.value.data) : [];
      const transportItems = transportRes.status === "fulfilled" ? pickItems(transportRes.value.data) : [];
      const guidesItems = guidesRes.status === "fulfilled" ? pickItems(guidesRes.value.data) : [];

      const summary = summaryRes.status === "fulfilled" ? (summaryRes.value.data || {}) : {};
      const byType = summary.byType || [];

      const vendorPendingItems =
        vendorPendingRes.status === "fulfilled" ? pickItems(vendorPendingRes.value.data) : [];
      const vendorApprovedItems =
        vendorApprovedRes.status === "fulfilled" ? pickItems(vendorApprovedRes.value.data) : [];
      const productsPendingItems =
        productsPendingRes.status === "fulfilled" ? pickItems(productsPendingRes.value.data) : [];

      setTotals({
        hotels: hotelsItems.length,
        spots: spotsItems.length,
        transport: transportItems.length,
        guides: guidesItems.length,
        vendorsApproved: vendorApprovedItems.length,
      });

      setPending({
        guides: countByType(byType, "GUIDE"),
        hotels: countByType(byType, "HOTEL"),
        transport: countByType(byType, "TRANSPORT"),
        vendors: vendorPendingItems.length,
        products: productsPendingItems.length,
      });

      if (ordersRes.status === "fulfilled") {
        const orderItems = pickItems(ordersRes.value.data);
        const placed = orderItems.filter((o) => o.status === "PLACED").length;
        const unpaid = orderItems.filter((o) => o?.payment?.status === "UNPAID").length;

        setOrders({
          total: orderItems.length,
          placed,
          unpaid,
        });
      } else {
        setOrders({ total: 0, placed: 0, unpaid: 0 });
      }

      const requiredFailures = [hotelsRes, spotsRes, transportRes, guidesRes, summaryRes].filter(
        (r) => r.status === "rejected"
      );

      if (requiredFailures.length) {
        const err = requiredFailures[0].reason;
        setPageError(err?.response?.data?.message || err?.message || "Some dashboard requests failed");
      }
    } catch (err) {
      console.error(err);
      setPageError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const kpis = useMemo(() => {
    return [
      { label: "Hotels", value: totals.hotels, icon: "🏨", to: "/admin/manage-hotels" },
      { label: "Spots", value: totals.spots, icon: "📍", to: "/admin/manage-spots" },
      { label: "Transport", value: totals.transport, icon: "🚌", to: "/admin/manage-transport" },
      {
        label: "Guides",
        value: totals.guides,
        icon: "🧭",
        to: "/admin/manage-guides",
        sub: `${pending.guides} pending`,
        warn: pending.guides > 0,
      },
      {
        label: "Vendors",
        value: totals.vendorsApproved,
        icon: "🛍",
        to: "/admin/manage-vendors",
        sub: `${pending.vendors} pending`,
        warn: pending.vendors > 0,
      },
      {
        label: "Products",
        value: "—",
        icon: "🧺",
        to: "/admin/vendor-products",
        sub: `${pending.products} pending`,
        warn: pending.products > 0,
      },
    ];
  }, [totals, pending]);

  const pendingCards = useMemo(() => {
    return [
      { label: "Guide Apps", value: pending.guides, to: "/admin/applications", warn: pending.guides > 0 },
      { label: "Hotel Apps", value: pending.hotels, to: "/admin/applications", warn: pending.hotels > 0 },
      { label: "Transport Apps", value: pending.transport, to: "/admin/applications", warn: pending.transport > 0 },
      { label: "Vendor Apps", value: pending.vendors, to: "/admin/manage-vendors", warn: pending.vendors > 0 },
      { label: "Products", value: pending.products, to: "/admin/vendor-products", warn: pending.products > 0 },
    ];
  }, [pending]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .dashTop{
          display:flex;
          justify-content: space-between;
          align-items: end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dashGrid2{
          display:grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 12px;
        }
        .dashKpiGrid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1100px){
          .dashGrid2{ grid-template-columns: 1fr; }
        }
        @media (max-width: 950px){
          .dashKpiGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 650px){
          .dashKpiGrid{ grid-template-columns: 1fr; }
        }

        .kpiCard{
          display:flex;
          align-items:center;
          gap: 12px;
          padding: 14px;
          text-decoration: none;
          color: inherit;
          border-radius: 16px;
          transition: .15s ease;
          position: relative;
          overflow: hidden;
        }
        .kpiCard:hover{
          transform: translateY(-1px);
          box-shadow: 0 20px 50px rgba(15,23,42,0.10);
        }
        .kpiIcon{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size: 18px;
          background: rgba(109,40,217,0.10);
          border: 1px solid rgba(15,23,42,0.08);
          flex-shrink: 0;
        }
        .kpiLabel{
          font-weight: 1000;
          color: var(--heading);
          font-size: 13px;
        }
        .kpiValue{
          font-weight: 1100;
          color: var(--heading);
          font-size: 20px;
          margin-top: 2px;
        }
        .kpiSub{
          font-weight: 900;
          color: var(--muted);
          font-size: 12px;
          margin-top: 4px;
        }
        .kpiArrow{
          margin-left:auto;
          font-weight: 1100;
          color: rgba(15,23,42,0.55);
        }
        .kpiWarn{
          border: 1px solid rgba(239,68,68,0.22) !important;
          background: rgba(239,68,68,0.06) !important;
        }

        .pendingGrid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        @media (max-width: 650px){
          .pendingGrid{ grid-template-columns: 1fr; }
        }
        .pendingItem{
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.60);
          display:flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .pendingLabel{
          font-weight: 1000;
          color: var(--heading);
          font-size: 13px;
        }
        .pendingValue{
          font-weight: 1100;
          font-size: 18px;
          color: var(--heading);
        }
        .pendingLink{
          font-weight: 1000;
          color: rgba(109,40,217,0.95);
          text-decoration: none;
          margin-left: auto;
        }

        .rowList{
          display:grid;
          gap: 10px;
          margin-top: 12px;
        }
        .rowItem{
          display:flex;
          justify-content: space-between;
          align-items:center;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.60);
        }
        .rowTitle{
          font-weight: 1000;
          color: var(--heading);
        }
        .rowVal{
          font-weight: 1100;
          color: var(--heading);
        }
      `}</style>

      {/* Top bar */}
      <div className="dashTop">
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Live overview of listings, approvals and orders.
          </div>
          {pageError ? (
            <div style={{ marginTop: 10, color: "crimson", fontWeight: 900 }}>
              {pageError}
            </div>
          ) : null}
        </div>

        <button className="aBtn" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPIs */}
      <div className="dashKpiGrid">
        {kpis.map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className={`aCard kpiCard ${k.warn ? "kpiWarn" : ""}`}
          >
            <div className="kpiIcon" aria-hidden>
              {k.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="kpiLabel">{k.label}</div>
              <div className="kpiValue">{k.value}</div>
              <div className="kpiSub">{k.sub || "Total records"}</div>
            </div>
            <div className="kpiArrow">→</div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="dashGrid2">
        {/* Quick Actions */}
        <div className="aCard" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Quick Actions</h3>
            <span className={`pill ${loading ? "warn" : "ok"}`}>
              {loading ? "Loading…" : "Live"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="aBtn" to="/admin/manage-hotels">Manage Hotels</Link>
            <Link className="aBtn" to="/admin/manage-spots">Manage Spots</Link>
            <Link className="aBtn" to="/admin/manage-transport">Manage Transport</Link>
            <Link className="aBtn" to="/admin/manage-guides">Manage Guides</Link>
            <Link className="aBtn" to="/admin/manage-vendors">Manage Vendors</Link>
            <Link className="aBtn" to="/admin/vendor-products">Approve Products</Link>
            <Link className="aBtn" to="/admin/manage-reviews">Moderate Reviews</Link>
            <Link className="aBtn" to="/admin/manage-events">Manage Events</Link>
          </div>

          <div className="pendingGrid">
            {pendingCards.map((p) => (
              <div
                key={p.label}
                className="pendingItem"
                style={{
                  borderColor: p.warn ? "rgba(239,68,68,0.22)" : "rgba(15,23,42,0.08)",
                  background: p.warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.60)",
                }}
              >
                <div>
                  <div className="pendingLabel">{p.label}</div>
                  <div className="adminMuted" style={{ fontWeight: 900, marginTop: 4 }}>
                    Pending approvals
                  </div>
                </div>

                <div className="pendingValue">{p.value}</div>
                <Link className="pendingLink" to={p.to}>Open →</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Info */}
        <div className="aCard" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Orders (Info)</h3>
            <span className="pill ok">Live</span>
          </div>

          <div className="rowList">
            <div className="rowItem">
              <div className="rowTitle">Total Orders</div>
              <div className="rowVal">{String(orders.total)}</div>
            </div>
            <div className="rowItem">
              <div className="rowTitle">PLACED</div>
              <div className="rowVal">{String(orders.placed)}</div>
            </div>
            <div className="rowItem">
              <div className="rowTitle">UNPAID</div>
              <div className="rowVal">{String(orders.unpaid)}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="aBtn" to="/admin/manage-orders">Open Orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
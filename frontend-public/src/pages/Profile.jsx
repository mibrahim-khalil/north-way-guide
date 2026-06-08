import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "./Profile.css";

import MyHotelEditModal from "../components/forms/MyHotelEditModal";
import MyGuideEditModal from "../components/forms/MyGuideEditModal";
import MyTransportRouteModal from "../components/forms/myTransportRouteModal";

import MyHotelBookingsSection from "../components/profile/MyHotelBookingsSection";
import MyHotelBookingsReceivedSection from "../components/profile/MyHotelBookingsReceivedSection";
import MyGuideBookingsSection from "../components/profile/MyGuideBookingsSection";
import MyGuideBookingsReceivedSection from "../components/profile/MyGuideBookingsReceivedSection";

import MyOrdersSection from "../components/profile/MyOrdersSection";
import MyTripPlansSection from "../components/profile/MyTripPlansSection";

const IconCalendar = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconBag = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const IconPlane = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const IconShop = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.2 7.8H3.8l-1.3 3.3c-.5 1.4.4 2.9 1.9 2.9h.1c1.2 0 2.2-1 2.2-2.2V11" />
    <path d="M21.5 11.1c-.5-1.4-1.9-2.2-3.3-2.2h-1.4V7.8" />
    <rect x="3" y="14" width="18" height="7" rx="1" />
  </svg>
);

const IconUser = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconInbox = ({ color = "currentColor" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </svg>
);

const IconSearch = ({ color = "currentColor" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const SERVICE_TABS = [
  { key: "GUIDE", label: "Guides" },
  { key: "HOTEL", label: "Hotels" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "PRODUCT_VENDOR", label: "Vendor / Shop" },
];

const APP_TYPE_TABS = [
  { key: "ALL", label: "All" },
  { key: "GUIDE", label: "Guide" },
  { key: "HOTEL", label: "Hotel" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "PRODUCT_VENDOR", label: "Vendor" },
];

const PURCHASE_TABS = [
  { key: "HOTEL", label: "Hotel Bookings" },
  { key: "GUIDE", label: "Guide Bookings" },
  { key: "ORDERS", label: "Product Orders" },
];

function chipStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return { background: "rgba(16,185,129,0.15)", color: "rgb(6,95,70)" };
  if (s === "REJECTED") return { background: "rgba(239,68,68,0.15)", color: "rgb(127,29,29)" };
  if (s === "PENDING") return { background: "rgba(59,130,246,0.15)", color: "rgb(30,64,175)" };
  return { background: "rgba(100,116,139,0.15)", color: "rgb(51,65,85)" };
}

function SegmentedTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="profileSeg">
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`profileSegBtn ${active ? "active" : ""}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function QuickCard({ icon, label, onClick, asLinkTo, active = false }) {
  const body = (
    <div className={`profileQuickCard ${active ? "active" : ""}`} onClick={onClick}>
      <div className="profileQuickBody">
        <div className="profileQuickIcon">{icon}</div>
        <div className="profileQuickLabel">{label}</div>
      </div>
    </div>
  );

  if (asLinkTo) {
    return (
      <Link to={asLinkTo} style={{ textDecoration: "none", color: "inherit" }}>
        {body}
      </Link>
    );
  }
  return body;
}

function Panel({ title, right, children }) {
  return (
    <div className="card">
      <div className="cardBody">
        <div className="profilePanelHead">
          <h3 className="profilePanelTitle">{title}</h3>
          {right}
        </div>
        <div className="profilePanelContent">{children}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || "PENDING").toUpperCase();
  return <span style={{ padding: "4px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12, ...chipStyle(s) }}>{s}</span>;
}

function StatusFilterPill({ label, value, active, onClick, tone }) {
  const tones = {
    neutral: { bg: "rgba(15,23,42,0.04)", bd: "rgba(15,23,42,0.08)", fg: "#0f172a" },
    green: { bg: "rgba(16,185,129,0.10)", bd: "rgba(16,185,129,0.25)", fg: "rgb(6,95,70)" },
    blue: { bg: "rgba(59,130,246,0.10)", bd: "rgba(59,130,246,0.25)", fg: "rgb(30,64,175)" },
    red: { bg: "rgba(239,68,68,0.10)", bd: "rgba(239,68,68,0.25)", fg: "rgb(127,29,29)" },
  };
  const t = tones[tone || "neutral"];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        border: `1px solid ${active ? "var(--ink)" : t.bd}`,
        background: active ? "var(--ink)" : t.bg,
        color: active ? "var(--canvas)" : t.fg,
        fontWeight: 900,
        fontSize: 13,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{label}</span>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 999,
          background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.65)",
          color: active ? "#fff" : "#0f172a",
          fontSize: 12,
          fontWeight: 1000,
        }}
      >
        {value}
      </span>
    </button>
  );
}

function ServiceTypeIcon({ type }) {
  const t = String(type || "").toUpperCase();
  const common = {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--hairline)",
    fontWeight: 1000,
    background: "var(--soft)",
    color: "var(--ink)",
  };

  if (t === "GUIDE") return <div style={common}>G</div>;
  if (t === "HOTEL") return <div style={common}>H</div>;
  if (t === "TRANSPORT") return <div style={common}>T</div>;
  if (t === "PRODUCT_VENDOR") return <div style={common}>V</div>;
  return <div style={common}>?</div>;
}

function GuideRow({ g, onViewTo, onEdit, onDeactivate, onActivate, mode }) {
  const thumb = g?.images?.[0];

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 260 }}>
          {thumb ? (
            <img src={thumb} alt={g?.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid var(--hairline)" }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--soft)", border: "1px solid var(--hairline)" }} />
          )}

          <div>
            <div style={{ fontWeight: 1000 }}>{g?.name}</div>
            <div className="p" style={{ fontSize: 13, margin: 0 }}>
              {g?.baseCity || "—"} • PKR <b>{g?.pricePerDay || 0}</b>/day
            </div>
            {mode === "inactive" ? (
              <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                <b>Status:</b> Inactive
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mode === "active" ? (
            <>
              <Link className="btn" to={onViewTo}>View</Link>
              <button className="btn primary" type="button" onClick={onEdit}>Edit</button>
              <button className="btn" type="button" onClick={onDeactivate} style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}>
                Deactivate
              </button>
            </>
          ) : (
            <>
              <button className="btn" type="button" onClick={onActivate} style={{ background: "rgb(16,185,129)", borderColor: "rgb(16,185,129)", color: "#fff" }}>
                Activate
              </button>
              <button className="btn primary" type="button" onClick={onEdit}>Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HotelRow({ h, mode, onViewTo, onEdit, onDeactivate, onActivate }) {
  const thumb = h?.images?.[0];

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 260 }}>
          {thumb ? (
            <img src={thumb} alt={h?.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid var(--hairline)" }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--soft)", border: "1px solid var(--hairline)" }} />
          )}

          <div>
            <div style={{ fontWeight: 1000 }}>{h?.name}</div>
            <div className="p" style={{ fontSize: 13, margin: 0 }}>
              {h?.city || "—"} • From PKR <b>{h?.priceFrom || 0}</b>/night
            </div>
            {mode === "inactive" ? (
              <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                <b>Status:</b> Inactive
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mode === "active" ? (
            <>
              <Link className="btn" to={onViewTo}>View</Link>
              <button className="btn primary" type="button" onClick={onEdit}>Edit</button>
              <button className="btn" type="button" onClick={onDeactivate} style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}>
                Deactivate
              </button>
            </>
          ) : (
            <>
              <button className="btn" type="button" onClick={onActivate} style={{ background: "rgb(16,185,129)", borderColor: "rgb(16,185,129)", color: "#fff" }}>
                Activate
              </button>
              <button className="btn primary" type="button" onClick={onEdit}>Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TransportRow({ r, mode, onEdit, onDeactivate, onActivate }) {
  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 1000 }}>{r.providerName || "—"}</div>
          <div className="p" style={{ fontSize: 13, margin: 0 }}>
            {r.from} → {r.to} • {r.type} • PKR <b>{r.type === "Flight" ? "—" : r.fare || 0}</b>
          </div>
          {mode === "inactive" ? (
            <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
              <b>Status:</b> Inactive
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn primary" type="button" onClick={onEdit}>Edit</button>
          <button
            className="btn"
            type="button"
            onClick={mode === "active" ? onDeactivate : onActivate}
            style={{
              background: mode === "active" ? "#ef4444" : "rgb(16,185,129)",
              borderColor: mode === "active" ? "#ef4444" : "rgb(16,185,129)",
              color: "#fff",
            }}
          >
            {mode === "active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, updateProfile } = useAuth();

  const isSeller = String(user?.accountType || "").toUpperCase() === "SELLER";

  const [view, setView] = useState(null);

  const [editingAccount, setEditingAccount] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const [buyerCounts, setBuyerCounts] = useState({ bookings: 0, orders: 0, trips: 0 });

  const [purchasesTab, setPurchasesTab] = useState("HOTEL");
  const [buyerShowAllPurchases, setBuyerShowAllPurchases] = useState(false);
  const [buyerShowAllTrips, setBuyerShowAllTrips] = useState(false);

  const [serviceTab, setServiceTab] = useState("GUIDE");
  const [inboxTab, setInboxTab] = useState("GUIDE");

  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [appType, setAppType] = useState("ALL");
  const [appStatus, setAppStatus] = useState("ALL");
  const [appQuery, setAppQuery] = useState("");

  const [myHotels, setMyHotels] = useState([]);
  const [myHotelsLoading, setMyHotelsLoading] = useState(false);

  const [myGuides, setMyGuides] = useState([]);
  const [myGuidesLoading, setMyGuidesLoading] = useState(false);

  const [myTransport, setMyTransport] = useState([]);
  const [myTransportLoading, setMyTransportLoading] = useState(false);
  const [transportApprovalStatus, setTransportApprovalStatus] = useState("UNKNOWN");

  const [editHotelOpen, setEditHotelOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  const [editGuideOpen, setEditGuideOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);

  const [tpOpen, setTpOpen] = useState(false);
  const [tpEditing, setTpEditing] = useState(null);

  const fetchBuyerStats = async () => {
    try {
      const [h, g, o, t] = await Promise.all([
        api.get("/my/bookings/hotel"),
        api.get("/my/bookings/guide"),
        api.get("/my/orders"),
        api.get("/trip-planner/saved"),
      ]);

      setBuyerCounts({
        bookings: (h.data.items?.length || 0) + (g.data.items?.length || 0),
        orders: o.data.items?.length || 0,
        trips: t.data.items?.length || 0,
      });
    } catch (e) {
      console.error("Buyer stats fail", e);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    setAppsLoading(true);
    try {
      const res = await api.get("/applications/my");
      setApps(res.data.applications || []);
    } catch {
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchMyHotels = async () => {
    if (!user) return;
    setMyHotelsLoading(true);
    try {
      const res = await api.get("/my/hotels");
      setMyHotels(res.data.items || []);
    } catch {
      setMyHotels([]);
    } finally {
      setMyHotelsLoading(false);
    }
  };

  const fetchMyGuides = async () => {
    if (!user) return;
    setMyGuidesLoading(true);
    try {
      const res = await api.get("/my/guides");
      setMyGuides(res.data.items || []);
    } catch {
      setMyGuides([]);
    } finally {
      setMyGuidesLoading(false);
    }
  };

  const fetchMyTransport = async () => {
    if (!user) return;
    setMyTransportLoading(true);
    try {
      const res = await api.get("/my/transport");
      setMyTransport(res.data.items || []);
      setTransportApprovalStatus(res.data.approvalStatus || "APPROVED");
    } catch (e) {
      setMyTransport([]);
      setTransportApprovalStatus(e?.response?.data?.approvalStatus || "UNKNOWN");
      toast(e?.response?.data?.message || "Failed to load my transport", 2500);
    } finally {
      setMyTransportLoading(false);
    }
  };

  const refreshAllSeller = async () => {
    await Promise.allSettled([fetchApplications(), fetchMyHotels(), fetchMyGuides(), fetchMyTransport()]);
  };

  const anyRefreshingSeller = appsLoading || myHotelsLoading || myGuidesLoading || myTransportLoading;

  useEffect(() => {
    setBuyerShowAllPurchases(false);
  }, [purchasesTab, view]);

  useEffect(() => {
    if (view !== "TRIPS") setBuyerShowAllTrips(false);
  }, [view]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true, state: { from: "/profile" } });
      return;
    }

    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    setView((prev) => (prev ? prev : isSeller ? "SERVICES" : "ACCOUNT"));

    if (isSeller) refreshAllSeller();
    else fetchBuyerStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, isSeller]);

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      toast("Profile updated", 2000);
      setEditingAccount(false);
      if (!isSeller) fetchBuyerStats();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to update profile", 2500);
    } finally {
      setSaving(false);
    }
  };

  const myActiveGuides = useMemo(() => myGuides.filter((g) => g?.isActive === true), [myGuides]);
  const myInactiveGuides = useMemo(() => myGuides.filter((g) => g?.isActive !== true), [myGuides]);

  const myActiveHotels = useMemo(() => myHotels.filter((h) => h?.isActive === true), [myHotels]);
  const myInactiveHotels = useMemo(() => myHotels.filter((h) => h?.isActive !== true), [myHotels]);

  const myActiveTransport = useMemo(() => myTransport.filter((r) => r?.isActive === true), [myTransport]);
  const myInactiveTransport = useMemo(() => myTransport.filter((r) => r?.isActive !== true), [myTransport]);

  const transportApproved = transportApprovalStatus === "APPROVED";

  const myVendorApprovedApp = useMemo(() => {
    return (apps || []).find((a) => a.serviceType === "PRODUCT_VENDOR" && a.status === "APPROVED") || null;
  }, [apps]);

  const appsByType = useMemo(() => {
    const groups = { GUIDE: [], HOTEL: [], TRANSPORT: [], PRODUCT_VENDOR: [] };
    for (const a of apps) if (groups[a.serviceType]) groups[a.serviceType].push(a);
    return groups;
  }, [apps]);

  const appCounts = useMemo(() => {
    const c = { GUIDE: 0, HOTEL: 0, TRANSPORT: 0, PRODUCT_VENDOR: 0 };
    for (const a of apps) c[a.serviceType] = (c[a.serviceType] || 0) + 1;
    return c;
  }, [apps]);

  const statusCounts = useMemo(() => {
    const x = { ALL: 0, APPROVED: 0, PENDING: 0, REJECTED: 0 };
    x.ALL = apps.length;
    for (const a of apps) {
      const s = String(a?.status || "").toUpperCase();
      if (x[s] != null) x[s] += 1;
    }
    return x;
  }, [apps]);

  const filteredApps = useMemo(() => {
    let list = appType === "ALL" ? apps : appsByType[appType] || [];
    if (appStatus !== "ALL") list = list.filter((a) => String(a?.status || "").toUpperCase() === appStatus);

    const q = String(appQuery || "").trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const st = String(a?.serviceType || "").toLowerCase();
        const status = String(a?.status || "").toLowerCase();
        const note = String(a?.adminNote || "").toLowerCase();
        return st.includes(q) || status.includes(q) || note.includes(q);
      });
    }
    return [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [apps, appsByType, appType, appStatus, appQuery]);

  const withdraw = async (app) => {
    const ok = confirm("Remove this rejected application?");
    if (!ok) return;
    try {
      await api.delete(`/applications/${app._id}`);
      toast("Application removed", 2000);
      fetchApplications();
    } catch (e) {
      toast(e?.response?.data?.message || "Withdraw failed", 3000);
    }
  };

  const deactivateGuide = async (g) => {
    const ok = confirm(`Deactivate "${g?.name}"? It will be hidden from public.`);
    if (!ok) return;
    try {
      await api.patch(`/my/guides/${g._id}/deactivate`);
      toast("Guide deactivated", 2000);
      fetchMyGuides();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to deactivate", 3000);
    }
  };

  const activateGuide = async (g) => {
    const ok = confirm(`Activate "${g?.name}"? It will be visible publicly.`);
    if (!ok) return;
    try {
      await api.patch(`/my/guides/${g._id}/activate`);
      toast("Guide activated", 2000);
      fetchMyGuides();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to activate", 3000);
    }
  };

  const deactivateHotel = async (h) => {
    const ok = confirm(`Deactivate "${h?.name}"? It will be hidden from public.`);
    if (!ok) return;
    try {
      await api.patch(`/my/hotels/${h._id}/deactivate`);
      toast("Hotel deactivated", 2000);
      fetchMyHotels();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to deactivate", 3000);
    }
  };

  const activateHotel = async (h) => {
    const ok = confirm(`Activate "${h?.name}"? It will be visible publicly.`);
    if (!ok) return;
    try {
      await api.patch(`/my/hotels/${h._id}/activate`);
      toast("Hotel activated", 2000);
      fetchMyHotels();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to activate", 3000);
    }
  };

  const deactivateTransport = async (r) => {
    const ok = confirm(`Deactivate route "${r.from} → ${r.to}"?`);
    if (!ok) return;
    try {
      await api.patch(`/my/transport/${r._id}/deactivate`);
      toast("Route deactivated", 2000);
      fetchMyTransport();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to deactivate", 3000);
    }
  };

  const activateTransport = async (r) => {
    const ok = confirm(`Activate route "${r.from} → ${r.to}"?`);
    if (!ok) return;
    try {
      await api.patch(`/my/transport/${r._id}/activate`);
      toast("Route activated", 2000);
      fetchMyTransport();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to activate", 3000);
    }
  };

  const saveTransport = async (payload) => {
    try {
      if (payload?._id) await api.put(`/my/transport/${payload._id}`, payload);
      else await api.post("/my/transport", payload);

      setTpOpen(false);
      setTpEditing(null);
      toast("Transport saved", 2000);
      fetchMyTransport();
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to save transport", 3000);
    }
  };

  if (loading) return null;
  if (!user) return null;
  if (!view) return null;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=111111&color=ffffff&size=128`;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const renderAccountPanel = () => (
    <Panel
      title="Account Information"
      right={
        editingAccount ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" type="submit" form="profileAccountForm" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn ghost"
              type="button"
              disabled={saving}
              onClick={() => {
                setEditingAccount(false);
                setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn primary" type="button" onClick={() => setEditingAccount(true)}>
            Edit
          </button>
        )
      }
    >
      <form id="profileAccountForm" onSubmit={save} style={{ display: "grid", gap: 2 }}>
        <div className="profileInlineRow">
          <span className="profileInlineLabel">Full Name</span>
          {editingAccount ? (
            <input className="profileInlineInput" value={form.name} onChange={onChange("name")} autoComplete="name" />
          ) : (
            <span className="profileInlineValue">{user?.name || "—"}</span>
          )}
        </div>

        <div className="profileInlineRow">
          <span className="profileInlineLabel">Email Address</span>
          <span className="profileInlineValue">{user?.email || "—"}</span>
        </div>

        <div className="profileInlineRow" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <span className="profileInlineLabel">Phone Number</span>
          {editingAccount ? (
            <input
              className="profileInlineInput"
              value={form.phone}
              onChange={onChange("phone")}
              placeholder="03xxxxxxxxx"
              autoComplete="tel"
            />
          ) : (
            <span className="profileInlineValue">{user?.phone || "—"}</span>
          )}
        </div>
      </form>
    </Panel>
  );

  const renderBuyerPurchases = () => (
    <Panel
      title="My Bookings / Orders"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" type="button" onClick={() => setBuyerShowAllPurchases((p) => !p)}>
            {buyerShowAllPurchases ? "Show Less" : "View All"}
          </button>
          <Link className="btn" to="/local-products">Shop Products</Link>
        </div>
      }
    >
      <SegmentedTabs tabs={PURCHASE_TABS} activeKey={purchasesTab} onChange={setPurchasesTab} />

      <div style={{ marginTop: 12 }}>
        {purchasesTab === "HOTEL" ? (
          <MyHotelBookingsSection hideHeader compact limit={buyerShowAllPurchases ? undefined : 3} headerLabel="Recent Hotel Bookings" onViewAll={() => setBuyerShowAllPurchases(true)} />
        ) : null}

        {purchasesTab === "GUIDE" ? (
          <MyGuideBookingsSection hideHeader compact limit={buyerShowAllPurchases ? undefined : 3} headerLabel="Recent Guide Bookings" onViewAll={() => setBuyerShowAllPurchases(true)} />
        ) : null}

        {purchasesTab === "ORDERS" ? (
          <MyOrdersSection hideHeader compact limit={buyerShowAllPurchases ? undefined : 3} headerLabel="Recent Orders" onViewAll={() => setBuyerShowAllPurchases(true)} />
        ) : null}
      </div>
    </Panel>
  );

  const renderBuyerTrips = () => (
    <Panel
      title="My Trip Plans"
      right={
        <button className="btn" type="button" onClick={() => setBuyerShowAllTrips((p) => !p)}>
          {buyerShowAllTrips ? "Show Less" : "View All"}
        </button>
      }
    >
      <MyTripPlansSection hideHeader compact limit={buyerShowAllTrips ? undefined : 3} headerLabel="Recent Trip Plans" onViewAll={() => setBuyerShowAllTrips(true)} />
    </Panel>
  );

  const renderBuyerPanel = () => {
    if (view === "ACCOUNT") return renderAccountPanel();
    if (view === "PURCHASES") return renderBuyerPurchases();
    if (view === "TRIPS") return renderBuyerTrips();
    return null;
  };

  const renderSellerInbox = () => (
    <Panel title="Bookings Received">
      <SegmentedTabs
        tabs={[
          { key: "GUIDE", label: "Guide Bookings" },
          { key: "HOTEL", label: "Hotel Bookings" },
        ]}
        activeKey={inboxTab}
        onChange={setInboxTab}
      />
      <div style={{ marginTop: 12 }}>
        {inboxTab === "GUIDE" ? <MyGuideBookingsReceivedSection /> : <MyHotelBookingsReceivedSection />}
      </div>
    </Panel>
  );

  const renderSellerPurchases = () => (
    <Panel
      title="Bookings / Orders"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" to="/hotels">Book a Hotel</Link>
          <Link className="btn" to="/guides">Hire a Guide</Link>
          <Link className="btn" to="/local-products">Shop Products</Link>
        </div>
      }
    >
      <SegmentedTabs tabs={PURCHASE_TABS} activeKey={purchasesTab} onChange={setPurchasesTab} />
      <div style={{ marginTop: 12 }}>
        {purchasesTab === "HOTEL" ? <MyHotelBookingsSection /> : null}
        {purchasesTab === "GUIDE" ? <MyGuideBookingsSection /> : null}
        {purchasesTab === "ORDERS" ? <MyOrdersSection /> : null}
      </div>
    </Panel>
  );

  const renderSellerApplications = () => (
    <Panel
      title="My Applications"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={refreshAllSeller} disabled={anyRefreshingSeller}>
            {anyRefreshingSeller ? "Refreshing..." : "Refresh"}
          </button>
          <Link className="btn" to="/register-service">Register a Service</Link>
        </div>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          border: "1px solid var(--hairline)",
          borderRadius: 12,
          padding: "10px 12px",
          background: "var(--soft)",
        }}
      >
        <IconSearch />
        <input
          value={appQuery}
          onChange={(e) => setAppQuery(e.target.value)}
          placeholder="Search (service type, status, admin note...)"
          style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}
        />
        {appQuery ? (
          <button className="btn" type="button" onClick={() => setAppQuery("")} style={{ padding: "6px 10px" }}>
            Clear
          </button>
        ) : null}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatusFilterPill label="All" value={statusCounts.ALL} active={appStatus === "ALL"} onClick={() => setAppStatus("ALL")} tone="neutral" />
        <StatusFilterPill label="Approved" value={statusCounts.APPROVED} active={appStatus === "APPROVED"} onClick={() => setAppStatus("APPROVED")} tone="green" />
        <StatusFilterPill label="Pending" value={statusCounts.PENDING} active={appStatus === "PENDING"} onClick={() => setAppStatus("PENDING")} tone="blue" />
        <StatusFilterPill label="Rejected" value={statusCounts.REJECTED} active={appStatus === "REJECTED"} onClick={() => setAppStatus("REJECTED")} tone="red" />
      </div>

      <div style={{ marginTop: 12 }}>
        <SegmentedTabs
          tabs={APP_TYPE_TABS.map((t) => ({
            key: t.key,
            label: t.key === "ALL" ? "All" : `${t.label} (${appCounts[t.key] || 0})`,
          }))}
          activeKey={appType}
          onChange={setAppType}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        {appsLoading ? <div className="p">Loading applications...</div> : null}

        {!appsLoading && filteredApps.length === 0 ? (
          <div className="card" style={{ boxShadow: "none", border: "1px dashed #cfcfcf", background: "var(--canvas)" }}>
            <div className="cardBody" style={{ padding: 16 }}>
              <div style={{ fontWeight: 1000 }}>No applications found</div>
              <div className="p" style={{ marginTop: 6 }}>Try changing filters or register a service.</div>
              <div style={{ marginTop: 10 }}>
                <Link className="btn primary" to="/register-service">Register a Service</Link>
              </div>
            </div>
          </div>
        ) : null}

        {!appsLoading && filteredApps.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 860, display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.6fr 1.4fr 0.8fr 0.6fr",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--soft)",
                  border: "1px solid var(--hairline)",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "var(--muted)",
                }}
              >
                <div>Service</div>
                <div>Status</div>
                <div>Admin Note</div>
                <div>Date</div>
                <div style={{ textAlign: "right" }}>Action</div>
              </div>

              {filteredApps.map((a) => {
                const statusUpper = String(a.status || "PENDING").toUpperCase();
                const isRejected = statusUpper === "REJECTED";

                return (
                  <div key={a._id} className="card" style={{ boxShadow: "none" }}>
                    <div className="cardBody" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 1.4fr 0.8fr 0.6fr", gap: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <ServiceTypeIcon type={a.serviceType} />
                        <div>
                          <div style={{ fontWeight: 1000 }}>{a.serviceType}</div>
                          <div className="p" style={{ fontSize: 12, marginTop: 4 }}>ID: {String(a._id).slice(-6).toUpperCase()}</div>
                        </div>
                      </div>

                      <div><StatusPill status={statusUpper} /></div>

                      <div className="p" style={{ margin: 0 }}>{a.adminNote ? a.adminNote : "—"}</div>

                      <div className="p" style={{ margin: 0, fontSize: 12 }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</div>

                      <div style={{ textAlign: "right" }}>
                        {isRejected ? (
                          <button
                            className="btn"
                            type="button"
                            style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                            onClick={() => withdraw(a)}
                          >
                            Withdraw
                          </button>
                        ) : (
                          <span className="p" style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );

  const renderSellerServices = () => (
    <Panel
      title="My Services (Approved Only)"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={() => setView("INBOX")}>Bookings Received</button>
          <button className="btn" type="button" onClick={refreshAllSeller} disabled={anyRefreshingSeller}>
            {anyRefreshingSeller ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      }
    >
      <SegmentedTabs tabs={SERVICE_TABS} activeKey={serviceTab} onChange={setServiceTab} />
      <div style={{ marginTop: 12 }}>
        <div className="p">Your seller services UI remains unchanged here.</div>
      </div>
    </Panel>
  );

  const renderSellerPanel = () => {
    if (view === "ACCOUNT") return renderAccountPanel();
    if (view === "SERVICES") return renderSellerServices();
    if (view === "INBOX") return renderSellerInbox();
    if (view === "APPLICATIONS") return renderSellerApplications();
    if (view === "PURCHASES") return renderSellerPurchases();
    if (view === "TRIPS") {
      return (
        <Panel title="My Trip Plans">
          <MyTripPlansSection />
        </Panel>
      );
    }
    return null;
  };

  const HeaderSummary = () => (
    <div className="card">
      <div className="cardBody">
        <div className="profileHeader">
          <div className="profileIdentity">
            <div className="profileAvatarWrap">
              <img src={avatarUrl} alt="Avatar" />
            </div>

            <div>
              <div className="profileNameRow">
                <h2 className="profileName">{user?.name}</h2>
                <span className={`profilePill ${isSeller ? "dark" : ""}`}>
                  {isSeller ? "Seller" : "Verified"}
                </span>
              </div>

              <div className="profileMeta">
                {user?.email} {user?.phone ? `• ${user.phone}` : ""}
              </div>

              <div className="profileSince">Member since {memberSince}</div>
            </div>
          </div>

          {!isSeller ? (
            <div className="profileStats">
              <div className="profileStat">
                <div className="profileStatValue">{buyerCounts.bookings}</div>
                <div className="profileStatLabel">Bookings</div>
              </div>
              <div className="profileStat">
                <div className="profileStatValue">{buyerCounts.orders}</div>
                <div className="profileStatLabel">Orders</div>
              </div>
              <div className="profileStat">
                <div className="profileStatValue">{buyerCounts.trips}</div>
                <div className="profileStatLabel">Trip Plans</div>
              </div>
              <button className="btn" type="button" onClick={fetchBuyerStats}>Refresh</button>
            </div>
          ) : (
            <div className="profileStats">
              <div className="profileStat">
                <div className="profileStatValue">{myActiveGuides.length}</div>
                <div className="profileStatLabel">Guides</div>
              </div>
              <div className="profileStat">
                <div className="profileStatValue">{myActiveHotels.length}</div>
                <div className="profileStatLabel">Hotels</div>
              </div>
              <div className="profileStat">
                <div className="profileStatValue">{myActiveTransport.length}</div>
                <div className="profileStatLabel">Routes</div>
              </div>
              <div className="profileStat">
                <div className="profileStatValue">{apps.length}</div>
                <div className="profileStatLabel">Apps</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="profilePage">
      <HeaderSummary />

      {!isSeller ? (
        <div className="profileQuickRail">
          <QuickCard icon={<IconUser />} label="Account" active={view === "ACCOUNT"} onClick={() => setView("ACCOUNT")} />
          <QuickCard icon={<IconCalendar />} label="Bookings / Orders" active={view === "PURCHASES"} onClick={() => setView("PURCHASES")} />
          <QuickCard icon={<IconPlane />} label="Trip Plans" active={view === "TRIPS"} onClick={() => setView("TRIPS")} />
          <QuickCard icon={<IconShop />} label="Go Shopping" asLinkTo="/local-products" />
        </div>
      ) : (
        <div className="profileQuickRail">
          <QuickCard icon={<IconUser />} label="Account" active={view === "ACCOUNT"} onClick={() => setView("ACCOUNT")} />
          <QuickCard icon={<IconCalendar />} label="My Services" active={view === "SERVICES"} onClick={() => setView("SERVICES")} />
          <QuickCard icon={<IconInbox />} label="Bookings Received" active={view === "INBOX"} onClick={() => setView("INBOX")} />
          <QuickCard icon={<IconBag />} label="My Applications" active={view === "APPLICATIONS"} onClick={() => setView("APPLICATIONS")} />
          <QuickCard icon={<IconBag />} label="Bookings / Orders" active={view === "PURCHASES"} onClick={() => setView("PURCHASES")} />
          <QuickCard icon={<IconPlane />} label="Trip Plans" active={view === "TRIPS"} onClick={() => setView("TRIPS")} />
          <QuickCard icon={<IconShop />} label="Register Service" asLinkTo="/register-service" />
        </div>
      )}

      <div>{!isSeller ? renderBuyerPanel() : renderSellerPanel()}</div>

      {isSeller ? (
        <>
          <MyHotelEditModal open={editHotelOpen} onClose={() => setEditHotelOpen(false)} hotel={editingHotel} onSaved={fetchMyHotels} />
          <MyGuideEditModal open={editGuideOpen} onClose={() => setEditGuideOpen(false)} guide={editingGuide} onSaved={fetchMyGuides} />
          <MyTransportRouteModal
            open={tpOpen}
            onClose={() => {
              setTpOpen(false);
              setTpEditing(null);
            }}
            initial={tpEditing}
            onSave={saveTransport}
          />
        </>
      ) : null}
    </div>
  );
}
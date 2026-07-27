// frontend-public/src/pages/TripPlanner.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

import "./TripPlanner.css";

const startLocations = [
  "Islamabad",
  "Rawalpindi",
  "Gilgit",
  "Skardu",
  "Hunza",
  "Chilas",
  "Astore",
  "Naran",
];

const travelModes = [
  { key: "ROAD", label: "Road" },
  // { key: "AIR", label: "Air" },
];

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
}

function pillStyle(kind) {
  if (kind === "ok")
    return {
      background: "rgba(16,185,129,0.15)",
      color: "rgb(6,95,70)",
    };
  if (kind === "warn")
    return {
      background: "rgba(245,158,11,0.15)",
      color: "rgb(146,64,14)",
    };
  if (kind === "bad")
    return {
      background: "rgba(239,68,68,0.15)",
      color: "rgb(127,29,29)",
    };
  return {
    background: "rgba(59,130,246,0.15)",
    color: "rgb(30,64,175)",
  };
}

// supports both full URLs and "/uploads/..", "../images/..", private_uploads
function toAbsUrl(u) {
  const url = String(u || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // api baseURL is like http://localhost:5000/api -> make http://localhost:5000
  const base = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  if (!base) return url;

  // absolute uploads paths
  if (url.startsWith("/uploads/")) return `${base}${url}`;
  if (url.startsWith("uploads/")) return `${base}/${url}`;

  // private_uploads support
  if (url.startsWith("/private_uploads/")) return `${base}${url}`;
  if (url.startsWith("private_uploads/")) return `${base}/${url}`;

  // relative public images (../images/)
  if (url.startsWith("../images/")) return url.replace("../images/", "/images/");
  if (url.startsWith("images/")) return `/${url}`;

  // plain filename fallback -> assume /uploads/
  if (!url.startsWith("/")) return `${base}/uploads/${url}`;

  return url;
}

// handles arrays of strings OR array of objects {url:".."}
function firstImage(images) {
  if (!Array.isArray(images)) return "";

  // try find string first
  const raw = images.find((x) => typeof x === "string" && x.trim()) || "";
  if (raw) return toAbsUrl(raw);

  // then try object {url: "..."}
  const obj = images.find(
    (x) => x && typeof x === "object" && typeof x.url === "string" && x.url.trim()
  );
  if (obj?.url) return toAbsUrl(obj.url);

  return "";
}

// activity image helper (places/spots)
function activityImage(a) {
  return firstImage(a?.images) || toAbsUrl(a?.image);
}

function ymdLocal(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* =========================
   Mode Icons (No library)
   ========================= */
function ModeIcon({ mode }) {
  const m = String(mode || "").toUpperCase();

  // Plane icon
  if (m === "AIR") {
    return (
      <svg className="tpModeIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.5 13.2 21.5 12 2.5 10.8 2 7.5l7.2 2.2L14 5.5c.3-.3.7-.5 1.2-.5h.8c.6 0 1.1.4 1.2 1l1.2 6.5-1.2 6.5c-.1.6-.6 1-1.2 1h-.8c-.5 0-.9-.2-1.2-.5l-4.8-4.2L2 16.5l.5-3.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Road icon
  if (m === "ROAD") {
    return (
      <svg className="tpModeIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 2h6l3 20h-4l-2-7h-0l-2 7H6L9 2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 6v3M12 12v3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Rest/Explore icon (pin)
  return (
    <svg className="tpModeIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function TripPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const todayMin = useMemo(() => ymdLocal(new Date()), []);
  const savedId = sp.get("savedId");

  const [form, setForm] = useState({
    budgetTotal: "",
    days: 10,
    travelers: 1,
    startLocation: "Islamabad",
    startDate: "",
    travelMode: "ROAD",
    primaryCircuit: "SKARDU_SIDE",
    transportType: "PUBLIC",
    scope: "SINGLE",
    roadOption: "KKH",
  });

  const [roadStatus, setRoadStatus] = useState(null);
  const [roadStatusLoading, setRoadStatusLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);

  const [itinerary, setItinerary] = useState(null);

  const [totalGen, setTotalGen] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [activeDay, setActiveDay] = useState(1);

  const onChange = (key) => (e) => {
    const v = e.target.value;
    setForm((p) => ({
      ...p,
      [key]:
        key === "days" || key === "travelers"
          ? Math.max(1, Number(v || 1))
          : v,
    }));
  };

  useEffect(() => {
    if (form.startDate && form.startDate < todayMin) {
      setForm((p) => ({ ...p, startDate: todayMin }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startDate, todayMin]);

  const month = useMemo(() => {
    if (!form.startDate) return null;
    const d = new Date(`${form.startDate}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d.getUTCMonth() + 1;
  }, [form.startDate]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await api.get("/trip-planner/stats");
      const n = Number(r?.data?.totalGenerations);
      if (Number.isFinite(n)) setTotalGen(n);
    } catch {
      // keep last
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadStats();
    }, 8000);
    return () => clearInterval(id);
  }, [loadStats]);

  useEffect(() => {
    const run = async () => {
      if (!savedId) return;
      try {
        const res = await api.get(`/trip-planner/saved/${savedId}`);
        setItinerary(res.data?.item?.itinerary || null);
        setShowDetails(false);
        toast("Loaded saved trip plan.", 1800);
      } catch (e) {
        toast(e?.response?.data?.message || "Failed to load saved trip", 2500);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId]);

  useEffect(() => {
    const run = async () => {
      if (form.travelMode !== "ROAD" || form.roadOption !== "BABUSAR" || !form.startDate) {
        setRoadStatus(null);
        return;
      }
      setRoadStatusLoading(true);
      try {
        const res = await api.get("/roads/status", {
          params: { roadKey: "BABUSAR", date: form.startDate },
        });
        setRoadStatus(res.data || null);
      } catch (e) {
        setRoadStatus(null);
        toast(e?.response?.data?.message || "Failed to check Babusar status", 2500);
      } finally {
        setRoadStatusLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.travelMode, form.roadOption, form.startDate]);

  const canGenerate = useMemo(() => {
    const b = Number(form.budgetTotal || 0);
    const notPast = !!form.startDate && form.startDate >= todayMin;
    return (
      b > 0 &&
      form.days >= 1 &&
      form.days <= 21 &&
      form.travelers >= 1 &&
      !!form.startDate &&
      notPast
    );
  }, [form.budgetTotal, form.days, form.travelers, form.startDate, todayMin]);

  const daysArr = useMemo(() => {
    const arr = Array.isArray(itinerary?.days) ? itinerary.days.slice() : [];
    arr.sort((a, b) => (a.day || 0) - (b.day || 0));
    return arr;
  }, [itinerary]);

  useEffect(() => {
    if (daysArr.length) setActiveDay(daysArr[0].day || 1);
  }, [daysArr.length]);

  const activeIndex = useMemo(() => daysArr.findIndex((d) => d.day === activeDay), [daysArr, activeDay]);
  const prevDay = activeIndex > 0 ? daysArr[activeIndex - 1]?.day : null;
  const nextDay = activeIndex >= 0 && activeIndex < daysArr.length - 1 ? daysArr[activeIndex + 1]?.day : null;

  const summary = useMemo(() => {
    const budget = Number(itinerary?.input?.budgetTotal || 0);
    const estTotal = Number(itinerary?.totals?.estTotal || 0);
    const remaining = budget - estTotal;
    return { budget, estTotal, remaining };
  }, [itinerary]);

  const generate = async () => {
    if (!user) {
      toast("Please login to use Trip Planner.", 2500);
      navigate("/login", { state: { from: "/trip-planner" } });
      return;
    }

    if (!canGenerate) {
      toast("Fill budget, valid start date (today or future), days (1–21), travelers.", 2500);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        budgetTotal: Number(form.budgetTotal),
        days: Number(form.days),
        travelers: Number(form.travelers),
        startLocation: form.startLocation,
        startDate: form.startDate,
        travelMode: form.travelMode,
        roadOption: form.travelMode === "ROAD" ? form.roadOption : "NONE",
        primaryCircuit: form.primaryCircuit,
        transportType: form.transportType,
        scope: form.scope,
      };

      const res = await api.post("/trip-planner/generate", payload);
      setItinerary(res.data?.itinerary || null);

      const n = Number(res.data?.stats?.totalGenerations);
      if (Number.isFinite(n)) setTotalGen(n);
      else loadStats();

      setShowDetails(false);
    } catch (e) {
      setItinerary(null);
      toast(e?.response?.data?.message || "Failed to generate itinerary", 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async () => {
    if (!user) {
      toast("Please login to save trip plans.", 2200);
      navigate("/login", { state: { from: "/trip-planner" } });
      return;
    }
    if (!itinerary) return;

    setSavingTrip(true);
    try {
      const title = `${itinerary?.input?.startLocation || "Trip"} ${itinerary?.input?.startDate || ""}`.trim();
      await api.post("/trip-planner/save", { title, itinerary });
      toast("Trip saved. Check Profile > My Trip Plans.", 2500);
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to save trip", 2500);
    } finally {
      setSavingTrip(false);
    }
  };

  const reset = () => {
    setForm({
      budgetTotal: "",
      days: 10,
      travelers: 1,
      startLocation: "Islamabad",
      startDate: "",
      travelMode: "ROAD",
      primaryCircuit: "SKARDU_SIDE",
      transportType: "PUBLIC",
      scope: "SINGLE",
      roadOption: "KKH",
    });
    setItinerary(null);
    setRoadStatus(null);
    setActiveDay(1);
    setShowDetails(false);
  };

  return (
    <div className="tpPage">
      {/* Counter styles kept inline */}
      <style>{`
        .tpLiveCounter {
          position: relative;
          width: 380px;
          max-width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          color: #fff;
          background: linear-gradient(135deg, #ef4444 0%, #f97316 45%, #eab308 100%);
          box-shadow: 0 14px 30px rgba(239,68,68,0.18);
          border: 1px solid rgba(255,255,255,0.18);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          white-space: nowrap;
        }
        .tpLiveCounter::after{
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), transparent 55%);
          transform: rotate(10deg);
          pointer-events: none;
        }
        .tpLiveLeft {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          position: relative;
          z-index: 1;
        }
        .tpLivePill {
          display:inline-flex;
          align-items:center;
          gap: 7px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: rgba(16,185,129,0.22);
          border: 1px solid rgba(16,185,129,0.45);
          color: #ecfdf5;
          flex: 0 0 auto;
        }
        .tpLiveDot{
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,0.55);
          animation: tpPulse 1.4s infinite;
        }
        @keyframes tpPulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
          70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .tpLiveText{
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }
        .tpLiveLabel{
          opacity: 0.95;
        }
        .tpLiveValue{
          font-size: 18px;
          font-weight: 1100;
        }
        .tpIconBtn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.20);
          color: #fff;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }
        .tpIconBtn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }
        .tpRefreshIcon {
          width: 18px;
          height: 18px;
        }
        .tpSpin {
          animation: tpSpin 0.9s linear infinite;
        }
        @keyframes tpSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top form card */}
      <div className="card">
        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ minWidth: 260 }}>
              <h2 style={{ margin: "0 0 6px" }}>AI Trip Planner</h2>
              <p className="p" style={{ margin: 0 }}>Generate your Trip plan with travel legs, hotels, and places.</p>
            </div>

            <div className="tpLiveCounter" title="Updates automatically every few seconds">
              <div className="tpLiveLeft">
                <span className="tpLivePill"><span className="tpLiveDot" />LIVE</span>
                <span className="tpLiveText">
                  <span className="tpLiveLabel">Total Trips Generated:</span>
                  <span className="tpLiveValue">{Number(totalGen).toLocaleString("en-PK")}</span>
                </span>
              </div>

              <button type="button" className="tpIconBtn" onClick={loadStats} disabled={statsLoading} title="Refresh">
                <svg className={`tpRefreshIcon ${statsLoading ? "tpSpin" : ""}`} viewBox="0 0 24 24" fill="none">
                  <path d="M20 12a8 8 0 0 1-14.7 4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12a8 8 0 0 1 14.7-4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <hr className="sep" />

          <div className="tpForm">
            <div className="tpField tpBudget">
              <label>Budget (PKR) *</label>
              <input className="input" value={form.budgetTotal} onChange={onChange("budgetTotal")} />
            </div>

            <div className="tpField tpDays">
              <label>Trip Days (1–21) *</label>
              <input className="input" type="number" min="1" max="21" value={form.days} onChange={onChange("days")} />
            </div>

            <div className="tpField tpTravelers">
              <label>Travelers *</label>
              <input className="input" type="number" min="1" max="20" value={form.travelers} onChange={onChange("travelers")} />
            </div>

            <div className="tpField tpDate">
              <label className="tpLabelRow">
                <span>Start Date *</span>
                <span className="tpMeta">Month: <b>{month || "—"}</b></span>
              </label>
              <input className="input" type="date" min={todayMin} value={form.startDate} onChange={onChange("startDate")} />
            </div>

            <div className="tpField tpStartLoc">
              <label>Start Location *</label>
              <select className="input" value={form.startLocation} onChange={onChange("startLocation")}>
                {startLocations.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            <div className="tpField tpMode">
              <label>Travel Mode *</label>
              <select className="input" value={form.travelMode} onChange={onChange("travelMode")}>
                {travelModes.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>

            <div className="tpField tpCircuit">
              <label>Primary Circuit *</label>
              <select className="input" value={form.primaryCircuit} onChange={onChange("primaryCircuit")}>
                <option value="SKARDU_SIDE">Baltistan Division</option>
                <option value="HUNZA_SIDE">Gilgit Division</option>
              </select>
            </div>

            <div className="tpField tpTransport">
              <label>Transport Type *</label>
              <select className="input" value={form.transportType} onChange={onChange("transportType")}>
                <option value="PUBLIC">Public Service ( e.g. buses )</option>
                <option value="OWN">Own Vehicle</option>
              </select>
            </div>

            <div className="tpField tpScope">
              <label>Trip Scope *</label>
              <select className="input" value={form.scope} onChange={onChange("scope")}>
                <option value="SINGLE">Single Side only</option>
                <option value="LOOP">Loop ( Skardu + Hunza )</option>
              </select>
            </div>

            <div className="tpField tpRoad">
              {form.travelMode === "ROAD" ? (
                <>
                  <label>Road Option *</label>
                  <select className="input" value={form.roadOption} onChange={onChange("roadOption")}>
                    <option value="KKH">KKH (All season)</option>
                    <option value="BABUSAR">Babusar (Seasonal)</option>
                  </select>

                  {form.roadOption === "BABUSAR" ? (
                    <div style={{ marginTop: 8 }} className="p">
                      {roadStatusLoading ? (
                        "Checking Babusar status..."
                      ) : roadStatus ? (
                        <>
                          Babusar:{" "}
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 900, ...(roadStatus.isOpen ? pillStyle("ok") : pillStyle("bad")) }}>
                            {roadStatus.isOpen ? "OPEN" : "CLOSED"}
                          </span>{" "}
                          • {roadStatus.reason} {roadStatus.isEstimated ? "(Estimated)" : "(Verified)"}
                        </>
                      ) : (
                        "Select date to check Babusar"
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="p" style={{ margin: 0 }}>Road options are only for Road mode.</div>
              )}
            </div>

            <div className="tpField tpActions">
              <button className="btn primary" type="button" onClick={generate} disabled={loading || !canGenerate}>
                {loading ? "Generating..." : "Generate Itinerary"}
              </button>
              <button className="btn" type="button" onClick={reset} disabled={loading}>
                Reset
              </button>
              {itinerary ? (
                <button className="btn" type="button" onClick={saveTrip} disabled={savingTrip || loading}>
                  {savingTrip ? "Saving..." : "Save Trip Plan"}
                </button>
              ) : null}
            </div>

            <div className="tpNote p">Tip: If you choose a GB city, plan starts from there.</div>
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="card">
        <div className="cardBody">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Itinerary</h2>
            {itinerary ? <span className="badge">Generated</span> : <span className="badge">Not generated</span>}
          </div>

          <hr className="sep" />

          {!itinerary ? (
            <div className="p">Generate to see plan.</div>
          ) : (
            <>
              {/* CRAZY SUMMARY UI */}
              {(() => {
                const budget = Number(summary.budget || 0);
                const total = Number(summary.estTotal || 0);
                const usedPct = budget > 0 ? Math.min(160, Math.round((total / budget) * 100)) : 0;
                const isOver = total > budget;

                return (
                  <div className="tpSummaryWrap">
                    <div className="tpSummaryHead">
                      <div className="tpSummaryTitle">Trip Summary</div>

                      <button
                        className="btn"
                        type="button"
                        onClick={() => setShowDetails((p) => !p)}
                        style={{ padding: "8px 12px", borderRadius: 999, fontWeight: 1000 }}
                      >
                        {showDetails ? "Hide Details" : "Show Details"}
                      </button>
                    </div>

                    <div className="tpSummaryBody">
                      <div className="tpKpiGrid">
                        <div className="tpKpi">
                          <div className="tpKpiLabel">Budget</div>
                          <div className="tpKpiValue">{money(budget)}</div>
                          <div className="tpKpiSub">Your selected total budget</div>
                        </div>

                        <div className="tpKpi">
                          <div className="tpKpiLabel">Estimated Total</div>
                          <div className="tpKpiValue">{money(total)}</div>
                          <div className="tpKpiSub">Travel + hotel + living (estimate)</div>
                        </div>

                        <div className="tpKpi">
                          <div className="tpKpiLabel">{isOver ? "Over Budget" : "Remaining"}</div>
                          <div className="tpKpiValue">{money(Math.abs(budget - total))}</div>
                          <div className="tpKpiSub">
                            <span className={`tpPill ${isOver ? "bad" : "ok"}`}>
                              {isOver ? "Needs adjustment" : "Good to go"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="tpMetaRow">
                        <span className={`tpPill ${isOver ? "bad" : "info"}`}>
                          Budget Used: <b>{usedPct}%</b>
                        </span>

                        <div className="tpChips">
                          <span className="tpChip">Plan: {itinerary?.ml?.planId || "—"}</span>
                          <span className="tpChip">Tier: {itinerary?.ml?.tier || "—"}</span>
                          <span className="tpChip">Pace: {itinerary?.ml?.pace || "—"}</span>
                          <span className="tpChip">BPPD: {Number(itinerary?.ml?.bppd || 0).toFixed(0)}</span>
                          <span className="tpChip">
                            Days: {itinerary?.input?.daysPlanned || daysArr.length} / req {itinerary?.input?.daysRequested || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="tpBarWrap" title="Budget usage">
                        <div className={`tpBarFill ${isOver ? "over" : ""}`} style={{ width: `${usedPct}%` }} />
                      </div>

                      {Array.isArray(itinerary?.warnings) && itinerary.warnings.length > 0 ? (
                        <div className="tpWarnBox">
                          <div className="tpWarnTitle">Warnings / Notes</div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {itinerary.warnings.map((w, idx) => (
                              <div key={idx} className="tpWarnItem">• {w}</div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {showDetails ? (
                        <div className="tpDetailsBox">
                          <div className="tpMetaGrid">
                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Start</div>
                              <div className="tpMetaVal">{itinerary?.input?.startLocation || "—"}</div>
                            </div>

                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Date</div>
                              <div className="tpMetaVal">{itinerary?.input?.startDate || "—"}</div>
                            </div>

                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Mode</div>
                              <div className="tpMetaVal">
                                {itinerary?.input?.travelMode || "—"}
                                {itinerary?.input?.travelMode === "ROAD" && itinerary?.input?.roadOption
                                  ? ` (${itinerary.input.roadOption})`
                                  : ""}
                              </div>
                            </div>

                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Transport</div>
                              <div className="tpMetaVal">{itinerary?.input?.transportType || "—"}</div>
                            </div>

                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Scope</div>
                              <div className="tpMetaVal">{itinerary?.input?.scopePlanned || "—"}</div>
                            </div>

                            <div className="tpMetaChip">
                              <div className="tpMetaKey">Circuit</div>
                              <div className="tpMetaVal">{itinerary?.input?.primaryCircuit || "—"}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}

              {/* Day navigation */}
              {daysArr.length > 0 ? (
                <div className="tpDayNav">
                  <button className="btn" type="button" disabled={!prevDay} onClick={() => prevDay && setActiveDay(prevDay)}>
                    Prev
                  </button>

                  <div className="tpDayNavBtns">
                    {daysArr.map((d) => (
                      <button
                        key={d.day}
                        type="button"
                        className={`tpDayBtn ${d.day === activeDay ? "active" : ""}`}
                        onClick={() => setActiveDay(d.day)}
                      >
                        Day {d.day}
                      </button>
                    ))}
                  </div>

                  <button className="btn" type="button" disabled={!nextDay} onClick={() => nextDay && setActiveDay(nextDay)}>
                    Next
                  </button>
                </div>
              ) : null}

              {/* Days */}
              <div className="tpDaysGrid">
                {daysArr.map((d) => {
                  const expanded = d.day === activeDay;
                  const leg = d.leg;

                  const subLineNode = leg ? (() => {
                    const mode = String(leg.mode || "").toUpperCase();

                    if (mode === "AIR") {
                      return (
                        <span className="tpSubLineRow">
                          <ModeIcon mode="AIR" />
                          <span>{leg.from} → {leg.to}</span>
                          <span className="tpSubSep">•</span>
                          <b>Flight</b>
                        </span>
                      );
                    }

                    const ro = String(leg.roadOption || "").toUpperCase();
                    const roadText = ro && ro !== "NONE" ? `(${ro})` : "";

                    return (
                      <span className="tpSubLineRow">
                        <ModeIcon mode="ROAD" />
                        <span>{leg.from} → {leg.to}</span>
                        <span className="tpSubSep">•</span>
                        <b>Road {roadText}</b>
                      </span>
                    );
                  })() : (
                    <span className="tpSubLineRow">
                      <ModeIcon mode="REST" />
                      <span>{d.baseCity || "—"}</span>
                      <span className="tpSubSep">•</span>
                      <b>Exploration / Rest Day</b>
                    </span>
                  );

                  return (
                    <div key={d.day} className={`card tpDayCard ${expanded ? "active" : ""}`}>
                      <div className="cardBody">
                        <button type="button" className="tpDayHeaderBtn" onClick={() => setActiveDay(d.day)}>
                          <div className="tpDayHeadBar">
                            <div className="tpDayHeadRow">
                              <div className="tpDayLeft">
                                <div className="tpDayNum">{d.day}</div>

                                <div className="tpDayText">
                                  <div className="tpDayTitleLine">{d.title || `Day ${d.day}`}</div>
                                  <div className="tpDaySubLine">{subLineNode}</div>
                                </div>
                              </div>

                              <div className="tpDayRight">
                                <span className="tpDayBadge">{d.baseCity || "—"}</span>
                                <span className="tpDayCostPill">{money(d.estCost || 0)}</span>
                                <span className={`tpDayChevron ${expanded ? "open" : ""}`}>▾</span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {expanded ? (
                          <div className="tpDaySections">
                            {/* Travel */}
                            {leg ? (
                              <div className="tpDaySection">
                                <div className="tpDaySectionTitle">Travel</div>
                                <div className="tpDayLine">
                                  <b>{leg.from}</b> → <b>{leg.to}</b> • {leg.mode}{" "}
                                  {leg.roadOption ? `(${leg.roadOption})` : ""}
                                  {leg.distanceKm ? ` • ${leg.distanceKm} km` : ""}
                                  {leg.driveHours ? ` • ${leg.driveHours} hrs` : ""}
                                  {leg.fuelEstimatePkr ? ` • Fuel: ${money(leg.fuelEstimatePkr)}` : ""}
                                </div>

                                {leg?.fareEstimate ? (
                                  <div className="tpDayLine" style={{ marginTop: 6 }}>
                                    <b>Estimated fare per person:</b>{" "}
                                    {money(leg.fareEstimate.minPkr)} to {money(leg.fareEstimate.maxPkr)}{" "}
                                    <span style={{ opacity: 0.75 }}>({leg.fareEstimate.source})</span>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {/* Cost Breakdown */}
                            {d?.costBreakdown ? (
                              <div className="tpDaySection">
                                <div className="tpDaySectionTitle">Cost Breakdown</div>
                                <div className="tpDayLine">
                                  Travel <b>{money(d.costBreakdown.travel || 0)}</b> • Hotel{" "}
                                  <b>{money(d.costBreakdown.hotel || 0)}</b> • Living{" "}
                                  <b>{money(d.costBreakdown.living || 0)}</b>
                                </div>
                              </div>
                            ) : null}

                            {/* Transport */}
                            <div className="tpDaySection">
                              <div className="tpDaySectionTitle">Public Transport</div>

                              {Array.isArray(d.transportOptions) && d.transportOptions.length > 0 ? (
                                <div style={{ display: "grid", gap: 8 }}>
                                  {d.transportOptions.map((t, idx) => (
                                    <div key={idx} className="tpDayLine">
                                      • <b>{t.providerName}</b>
                                      {t.type ? ` • ${t.type}` : ""}
                                      {t.type === "Flight" ? "" : ` • Fare: ${money(t.fare || 0)}`}
                                      {t.contactPhone ? ` • Phone: ${t.contactPhone}` : ""}
                                      {t.whatsapp ? ` • WhatsApp: ${t.whatsapp}` : ""}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="tpDayLine">
                                  No public transport options are available for this route right now.
                                  {leg?.fareEstimate ? (
                                    <>
                                      {" "}
                                      Estimated fare per person: <b>{money(leg.fareEstimate.minPkr)}</b> to{" "}
                                      <b>{money(leg.fareEstimate.maxPkr)}</b>.
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {/* Places */}
                            <div className="tpDaySection">
                              <div className="tpDaySectionTitle">Places to Visit</div>

                              {Array.isArray(d.activities) && d.activities.length > 0 ? (
                                <div style={{ display: "grid", gap: 10 }}>
                                  {d.activities.map((a, idx) => {
                                    const img = activityImage(a);
                                    const sid = a?._id || a?.id;

                                    return (
                                      <div key={sid || idx} className="tpSpotRow">
                                        {img ? (
                                          <img
                                            src={img}
                                            alt={a?.title}
                                            className="tpSpotImg"
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                          />
                                        ) : (
                                          <div className="tpSpotImgFallback" />
                                        )}

                                        <div style={{ flex: 1, minWidth: 220 }}>
                                          <div style={{ fontWeight: 900 }}>{a?.title || "—"}</div>
                                          <div className="tpSpotLinks">
                                            {a?.mapsUrl ? (
                                              <a href={a.mapsUrl} target="_blank" rel="noreferrer">Map</a>
                                            ) : null}
                                            {sid ? <Link to={`/tourist-spots/${sid}`}>More Info</Link> : null}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="tpDayLine">No recommended places are available for this stop yet.</div>
                              )}
                            </div>

                            {/* Hotels */}
                            <div className="tpDaySection">
                              <div className="tpDaySectionTitle">Suggested Hotels</div>

                              {Array.isArray(d.hotelOptions) && d.hotelOptions.length > 0 ? (
                                <div style={{ display: "grid", gap: 10 }}>
                                  {d.hotelOptions.map((h) => {
                                    const img = firstImage(h.images);
                                    return (
                                      <div key={h._id} className="tpHotelRow">
                                        {img ? (
                                          <img
                                            src={img}
                                            alt={h.name}
                                            className="tpHotelImg"
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                          />
                                        ) : (
                                          <div className="tpHotelImgFallback" />
                                        )}

                                        <div style={{ flex: 1, minWidth: 220 }}>
                                          <div style={{ fontWeight: 900 }}>{h.name}</div>
                                          <div className="p" style={{ fontSize: 12, marginTop: 4 }}>
                                            {h.city} • From <b>{money(h.priceFrom || 0)}</b>/night
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="tpDayLine">No hotel recommendations are available for this stop yet.</div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
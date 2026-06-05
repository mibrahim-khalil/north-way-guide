import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";

function iconUrl(code) {
  if (!code) return "";
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}
function iconSmallUrl(code) {
  if (!code) return "";
  return `https://openweathermap.org/img/wn/${code}.png`;
}
function fmtDate(yyyyMmDd) {
  if (!yyyyMmDd) return "—";
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? yyyyMmDd : d.toLocaleDateString();
}

/**
 * Theme from OpenWeather icon + description
 * icons: https://openweathermap.org/weather-conditions
 */
function themeFromWeather(desc = "", icon = "") {
  const d = String(desc || "").toLowerCase();
  const ic = String(icon || "");

  if (ic.startsWith("11") || d.includes("thunder")) return "storm";
  if (ic.startsWith("09") || ic.startsWith("10") || d.includes("rain") || d.includes("drizzle")) return "rain";
  if (ic.startsWith("13") || d.includes("snow")) return "snow";
  if (ic.startsWith("50") || d.includes("mist") || d.includes("fog") || d.includes("haze")) return "mist";
  if (ic.startsWith("02") || ic.startsWith("03") || ic.startsWith("04") || d.includes("cloud")) return "cloud";
  if (ic.startsWith("01") || d.includes("clear")) return "clear";
  return "default";
}

export default function Weather() {
  const [sp, setSp] = useSearchParams();
  const placeFromUrl = (sp.get("place") || "").trim();

  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [currentMap, setCurrentMap] = useState({});
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const [place, setPlace] = useState(placeFromUrl || localStorage.getItem("nw_weather_place") || "");
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const [err, setErr] = useState("");

  const placeNames = useMemo(() => (places || []).map((p) => p.name).filter(Boolean), [places]);
  const isValidPlace = useMemo(() => (!!place && placeNames.includes(place)), [place, placeNames]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoadingPlaces(true);
      setErr("");
      try {
        const res = await api.get("/weather/places");
        if (!alive) return;

        const items = res.data?.items || [];
        setPlaces(items);

        const saved = (localStorage.getItem("nw_weather_place") || "").trim();
        const urlP = (placeFromUrl || "").trim();
        const first = items?.[0]?.name || "";

        const next =
          (urlP && items.some((x) => x.name === urlP) ? urlP : "") ||
          (saved && items.some((x) => x.name === saved) ? saved : "") ||
          first;

        if (next && next !== place) setPlace(next);
      } catch (e) {
        if (!alive) return;
        setPlaces([]);
        setErr(e?.response?.data?.message || "Failed to load places.");
      } finally {
        if (alive) setLoadingPlaces(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!place) return;
    localStorage.setItem("nw_weather_place", place);
    setSp((p) => {
      p.set("place", place);
      return p;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  const loadBulkCurrent = async (names) => {
    if (!names?.length) return;
    setLoadingCurrent(true);
    try {
      const res = await api.post("/weather/current/bulk", { places: names });
      setCurrentMap(res.data?.items || {});
    } catch {
      setCurrentMap({});
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    if (!placeNames.length) return;
    loadBulkCurrent(placeNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeNames.join("|")]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!place) return;
      if (placeNames.length && !placeNames.includes(place)) return;

      setLoadingForecast(true);
      setErr("");
      try {
        const res = await api.get("/weather/forecast-daily", { params: { place } });
        if (!alive) return;
        setForecast(res.data || null);
      } catch (e) {
        if (!alive) return;
        setForecast(null);
        setErr(e?.response?.data?.message || "Failed to load forecast");
      } finally {
        if (alive) setLoadingForecast(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [place, placeNames.join("|")]);

  const selectedRow = currentMap?.[place];
  const selectedCurrent = selectedRow?.ok ? selectedRow.current : null;
  const selectedTheme = themeFromWeather(selectedCurrent?.desc, selectedCurrent?.icon);

  const days = forecast?.forecast?.days || [];

  const refreshAll = async () => {
    if (!placeNames.length) return;
    await loadBulkCurrent(placeNames);

    try {
      setLoadingForecast(true);
      const res = await api.get("/weather/forecast-daily", { params: { place } });
      setForecast(res.data || null);
    } catch (e) {
      setForecast(null);
      setErr(e?.response?.data?.message || "Failed to load forecast");
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 1150, margin: "0 auto" }}>
      <div className="cardBody">
        <style>{`
          .wGrid{
            display:grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }
          @media (max-width: 1100px){ .wGrid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
          @media (max-width: 760px){ .wGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 460px){ .wGrid{ grid-template-columns: 1fr; } }

          .wCardBtn{
            text-align:left;
            border: 1px solid rgba(15,23,42,0.10);
            border-radius: 16px;
            padding: 12px;
            cursor: pointer;
            display:grid;
            gap: 8px;
            position: relative;
            overflow: hidden;
            background: rgba(255,255,255,0.78);
          }
          .wCardBtn:hover{ background: rgba(255,255,255,0.92); }
          .wCardBtn.active{
            border-color: rgba(59,130,246,0.55);
            box-shadow: 0 0 0 4px rgba(59,130,246,0.10);
          }

          .wTopRow{
            display:flex;
            justify-content: space-between;
            align-items:center;
            gap: 10px;
          }

          .wPlaceName{ font-weight: 1100; color: var(--heading); }
          .wTemp{
            display:flex;
            align-items:center;
            gap: 6px;
            font-weight: 1100;
            color: var(--heading);
            white-space: nowrap;
          }

          .wDesc{
            font-size: 12px;
            font-weight: 900;
            color: rgba(100,116,139,0.95);
            min-height: 16px;
          }

          /* Clean theme gradients (NO patterns) */
          .wTheme-clear{ background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,237,213,0.78)); }
          .wTheme-cloud{ background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(226,232,240,0.78)); }
          .wTheme-mist{ background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(241,245,249,0.78)); }
          .wTheme-rain{ background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(219,234,254,0.78)); }
          .wTheme-snow{ background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(224,242,254,0.78)); }
          .wTheme-storm{ background: linear-gradient(135deg, rgba(255,255,255,0.90), rgba(203,213,225,0.78)); }
          .wTheme-default{ background: rgba(255,255,255,0.85); }

          /* Forecast cards */
          .wfGrid{
            display:grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
          }
          @media (max-width: 1100px){ .wfGrid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
          @media (max-width: 760px){ .wfGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 460px){ .wfGrid{ grid-template-columns: 1fr; } }

          .wfCard{
            border: 1px solid rgba(15,23,42,0.10);
            border-radius: 16px;
            overflow: hidden;
            background: rgba(255,255,255,0.78);
          }
          .wfCardBody{
            padding: 12px;
            text-align: center;
            display: grid;
            gap: 6px;
          }
          .wfDate{ font-weight: 1100; color: var(--heading); }
          .wfTempLine{
            font-size: 13px;
            font-weight: 1000;
            color: var(--heading);
          }
          .wfDesc{
            font-size: 12px;
            font-weight: 900;
            color: rgba(100,116,139,0.95);
            min-height: 16px;
          }
        `}</style>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>Weather (5-day Forecast)</h2>
            <p className="p" style={{ margin: 0 }}>
              Select a place to view forecast. (OpenWeather free API supports ~5 days)
            </p>
          </div>

          <button
            className="btn"
            type="button"
            onClick={refreshAll}
            disabled={loadingPlaces || loadingCurrent || loadingForecast}
          >
            {loadingCurrent || loadingForecast ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <hr className="sep" />

        {err ? (
          <div className="p" style={{ color: "crimson", fontWeight: 1000 }}>
            {err}
          </div>
        ) : null}

        {loadingPlaces ? (
          <div className="p">Loading places...</div>
        ) : places.length === 0 ? (
          <div className="p" style={{ color: "crimson", fontWeight: 1000 }}>
            No places configured. Admin must add places in Admin → Weather Updates (or Seed Defaults).
          </div>
        ) : (
          <>
            {/* Places cards */}
            <div className="wGrid">
              {places.map((p) => {
                const row = currentMap?.[p.name];
                const ok = row?.ok;
                const c = ok ? row.current : null;
                const theme = themeFromWeather(c?.desc, c?.icon) || "default";

                return (
                  <button
                    key={p._id || p.name}
                    type="button"
                    className={`wCardBtn wTheme-${theme} ${p.name === place ? "active" : ""}`}
                    onClick={() => setPlace(p.name)}
                    title={c?.desc || ""}
                  >
                    <div className="wTopRow">
                      <div className="wPlaceName">{p.name}</div>

                      <div className="wTemp">
                        {loadingCurrent ? (
                          "…"
                        ) : ok ? (
                          <>
                            {c?.icon ? <img src={iconSmallUrl(c.icon)} alt="" style={{ width: 22, height: 22 }} /> : null}
                            {typeof c?.temp === "number" ? `${Math.round(c.temp)}°C` : "—"}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    <div className="wDesc">
                      {loadingCurrent ? "Loading..." : ok ? (c?.desc || "—") : "Weather unavailable"}
                    </div>

                    <div className="p" style={{ fontSize: 12, margin: 0 }}>
                      Lat: <b>{p.lat}</b> • Lon: <b>{p.lon}</b>
                    </div>
                  </button>
                );
              })}
            </div>

            <hr className="sep" />

            {/* Selected place current */}
            {!isValidPlace ? (
              <div className="p" style={{ color: "crimson", fontWeight: 1000 }}>
                Selected place is not valid. Please choose again.
              </div>
            ) : (
              <>
                <div className={`card wTheme-${selectedTheme || "default"}`} style={{ boxShadow: "none" }}>
                  <div className="cardBody" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    {selectedCurrent?.icon ? (
                      <img src={iconUrl(selectedCurrent.icon)} alt="" style={{ width: 56, height: 56 }} />
                    ) : null}

                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ fontWeight: 1100, fontSize: 18 }}>
                        {place} — {typeof selectedCurrent?.temp === "number" ? `${Math.round(selectedCurrent.temp)}°C` : "—"}
                      </div>
                      <div className="p" style={{ margin: "6px 0 0", fontSize: 13 }}>
                        {selectedCurrent?.desc || "—"} • Humidity: {selectedCurrent?.humidity ?? "—"}% • Wind: {selectedCurrent?.windSpeed ?? "—"}
                      </div>
                    </div>

                    <span className="badge">
                      Updated: {selectedCurrent?.dt ? new Date(selectedCurrent.dt * 1000).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                <hr className="sep" />

                <h3 style={{ margin: "0 0 10px" }}>5-day Forecast</h3>

                {loadingForecast ? (
                  <div className="p">Loading forecast...</div>
                ) : days.length === 0 ? (
                  <div className="p">Forecast not available right now.</div>
                ) : (
                  <div className="wfGrid">
                    {days.slice(0, 5).map((d) => {
                      const t = themeFromWeather(d.desc, d.icon) || "default";
                      return (
                        <div key={d.date} className={`wfCard wTheme-${t}`}>
                          <div className="wfCardBody">
                            <div className="wfDate">{fmtDate(d.date)}</div>
                            {d.icon ? <img src={iconUrl(d.icon)} alt="" style={{ width: 52, height: 52, margin: "0 auto" }} /> : null}
                            <div className="wfTempLine">
                              {typeof d.min === "number" ? `${d.min}°` : "—"} / {typeof d.max === "number" ? `${d.max}°` : "—"}
                            </div>
                            <div className="wfDesc">{d.desc || "—"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
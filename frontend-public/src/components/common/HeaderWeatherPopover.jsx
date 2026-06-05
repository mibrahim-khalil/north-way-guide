import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

function iconUrl(code) {
  if (!code) return "";
  return `https://openweathermap.org/img/wn/${code}.png`;
}

export default function HeaderWeatherPopover() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [currentMap, setCurrentMap] = useState({});
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  // open popover -> fetch places
  useEffect(() => {
    if (!open) return;

    let alive = true;
    const run = async () => {
      setLoadingPlaces(true);
      try {
        const res = await api.get("/weather/places");
        if (!alive) return;
        setPlaces(res.data?.items || []);
      } catch {
        if (!alive) return;
        setPlaces([]);
      } finally {
        if (alive) setLoadingPlaces(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [open]);

  const placeNames = useMemo(() => (places || []).map((p) => p.name).filter(Boolean), [places]);

  // fetch current weather for all places shown
  useEffect(() => {
    if (!open) return;
    if (!placeNames.length) return;

    let alive = true;
    const run = async () => {
      setLoadingCurrent(true);
      try {
        const res = await api.post("/weather/current/bulk", { places: placeNames });
        if (!alive) return;
        setCurrentMap(res.data?.items || {});
      } catch {
        if (!alive) return;
        setCurrentMap({});
      } finally {
        if (alive) setLoadingCurrent(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [open, placeNames.join("|")]);

  const openWeather = (place) => {
    const p = String(place || "").trim();
    localStorage.setItem("nw_weather_place", p);
    setOpen(false);
    navigate(`/weather?place=${encodeURIComponent(p)}`);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Weather Icon Button */}
      <button
        type="button"
        className="headerIconBtn"
        aria-label="Weather"
        title="Weather"
        onClick={() => setOpen((p) => !p)}
      >
        <svg className="headerIconSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.6A3.5 3.5 0 0 0 7 18Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <>
          {/* Click outside closes */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />

          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              zIndex: 9999,
              width: 360,
              maxWidth: "92vw",
              borderRadius: 16,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 24px 70px rgba(2,6,23,0.20)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 1000 }}>Weather</div>
              <button className="btn" style={{ padding: "6px 10px" }} onClick={() => openWeather(placeNames[0] || "")}>
                Open Page
              </button>
            </div>

            <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }} />

            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              {loadingPlaces ? (
                <div className="p">Loading places...</div>
              ) : places.length === 0 ? (
                <div className="p">
                  No places configured. Admin must add places in <b>Weather Updates</b>.
                </div>
              ) : (
                places.slice(0, 8).map((p) => {
                  const row = currentMap?.[p.name];
                  const ok = row?.ok;
                  const temp = ok ? row?.current?.temp : null;
                  const icon = ok ? row?.current?.icon : "";
                  const desc = ok ? row?.current?.desc : "";

                  return (
                    <button
                      key={p._id || p.name}
                      type="button"
                      onClick={() => openWeather(p.name)}
                      style={{
                        textAlign: "left",
                        border: "1px solid rgba(15,23,42,0.10)",
                        background: "rgba(255,255,255,0.70)",
                        borderRadius: 14,
                        padding: 10,
                        cursor: "pointer",
                      }}
                      title={desc}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 1000 }}>{p.name}</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 1000 }}>
                          {loadingCurrent ? (
                            "..."
                          ) : ok ? (
                            <>
                              {icon ? <img src={iconUrl(icon)} alt="" style={{ width: 20, height: 20 }} /> : null}
                              {typeof temp === "number" ? `${Math.round(temp)}°C` : "—"}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>

                      <div className="p" style={{ fontSize: 12, marginTop: 6 }}>
                        {loadingCurrent ? "Loading..." : ok ? (desc || "—") : "Weather unavailable"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
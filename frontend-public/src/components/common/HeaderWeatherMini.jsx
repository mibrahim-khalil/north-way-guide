import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";

function iconUrl(code) {
  if (!code) return "";
  return `https://openweathermap.org/img/wn/${code}.png`;
}

export default function HeaderWeatherMini() {
  const [place] = useState(localStorage.getItem("nw_weather_place") || "Hunza");
  const [temp, setTemp] = useState(null);
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/weather/current", { params: { place } });
        if (!alive) return;
        setTemp(res.data?.current?.temp ?? null);
        setIcon(res.data?.current?.icon || "");
      } catch {
        if (!alive) return;
        setTemp(null);
        setIcon("");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [place]);

  return (
    <Link
      to="/weather"
      className="badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 1000,
        textDecoration: "none",
      }}
      title="Open Weather"
    >
      {loading ? (
        "Weather..."
      ) : (
        <>
          {icon ? <img src={iconUrl(icon)} alt="" style={{ width: 18, height: 18 }} /> : null}
          <span style={{ whiteSpace: "nowrap" }}>
            {place}: {typeof temp === "number" ? `${Math.round(temp)}°C` : "—"}
          </span>
        </>
      )}
    </Link>
  );
}
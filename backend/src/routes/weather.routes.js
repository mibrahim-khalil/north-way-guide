import { Router } from "express";
import WeatherPlace from "../models/WeatherPlace.js";

const router = Router();

const CACHE = new Map();
function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    CACHE.delete(key);
    return null;
  }
  return hit.data;
}
function cacheSet(key, data, ttlMs) {
  CACHE.set(key, { exp: Date.now() + ttlMs, data });
}

function apiKey() {
  return process.env.OPENWEATHER_API_KEY || "";
}

async function owFetchJson(url) {
  const key = apiKey();
  if (!key) {
    const err = new Error("Missing OPENWEATHER_API_KEY in backend .env");
    err.status = 500;
    throw err;
  }

  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text();
    const err = new Error(`OpenWeather error (${r.status}): ${txt}`);
    err.status = 502;
    throw err;
  }
  return r.json();
}

async function getCurrentByCoords(lat, lon, units = "metric") {
  const k = `cur:${lat},${lon},${units}`;
  const cached = cacheGet(k);
  if (cached) return cached;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey()}&units=${units}`;
  const j = await owFetchJson(url);

  const out = {
    temp: j?.main?.temp ?? null,
    feelsLike: j?.main?.feels_like ?? null,
    humidity: j?.main?.humidity ?? null,
    windSpeed: j?.wind?.speed ?? null,
    desc: j?.weather?.[0]?.description || "",
    icon: j?.weather?.[0]?.icon || "",
    dt: j?.dt || null,
  };

  cacheSet(k, out, 10 * 60 * 1000);
  return out;
}

function pickNoonIcon(items) {
  if (!items.length) return { icon: "", desc: "" };

  let best = items[0];
  let bestDiff = 999;

  for (const it of items) {
    const t = String(it.dt_txt || "");
    const hh = Number(t.slice(11, 13) || 0);
    const diff = Math.abs(12 - hh);
    if (diff < bestDiff) {
      best = it;
      bestDiff = diff;
    }
  }

  return {
    icon: best?.weather?.[0]?.icon || "",
    desc: best?.weather?.[0]?.description || "",
  };
}

async function getForecastDailyByCoords(lat, lon, units = "metric") {
  const k = `fc:${lat},${lon},${units}`;
  const cached = cacheGet(k);
  if (cached) return cached;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey()}&units=${units}`;
  const j = await owFetchJson(url);

  const list = Array.isArray(j?.list) ? j.list : [];
  const byDate = new Map();

  for (const it of list) {
    const dtTxt = String(it.dt_txt || "");
    const date = dtTxt.slice(0, 10);
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(it);
  }

  const days = [];
  for (const [date, items] of byDate.entries()) {
    const mins = items.map((x) => Number(x?.main?.temp_min)).filter(Number.isFinite);
    const maxs = items.map((x) => Number(x?.main?.temp_max)).filter(Number.isFinite);

    const min = mins.length ? Math.round(Math.min(...mins)) : null;
    const max = maxs.length ? Math.round(Math.max(...maxs)) : null;

    const { icon, desc } = pickNoonIcon(items);
    days.push({ date, min, max, icon, desc });
  }

  days.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const out = { city: { name: j?.city?.name || "" }, days };
  cacheSet(k, out, 45 * 60 * 1000);
  return out;
}

async function findPlaceByName(placeName) {
  const name = String(placeName || "").trim();
  if (!name) return null;

  return WeatherPlace.findOne({
    isActive: true,
    name: new RegExp(`^${name}$`, "i"),
  }).select("name lat lon");
}

router.get("/places", async (req, res) => {
  const items = await WeatherPlace.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("name lat lon");

  res.json({ items });
});

router.get("/current", async (req, res) => {
  try {
    const { place = "", units = "metric" } = req.query || {};
    const p = await findPlaceByName(place);

    if (!p) {
      return res.status(404).json({
        message: "Unknown place. Admin must add this place in Admin → Weather Updates.",
      });
    }

    const current = await getCurrentByCoords(p.lat, p.lon, units);
    res.json({ place: p.name, lat: p.lat, lon: p.lon, current });
  } catch (e) {
    res.status(e?.status || 502).json({ message: e?.message || "Weather failed" });
  }
});

router.post("/current/bulk", async (req, res) => {
  try {
    const { places = [], units = "metric" } = req.body || {};
    const list = Array.isArray(places) ? places.map((x) => String(x || "").trim()).filter(Boolean) : [];

    const items = {};
    for (const name of list.slice(0, 30)) {
      const p = await findPlaceByName(name);
      if (!p) {
        items[name] = { ok: false, message: "Unknown place" };
        continue;
      }
      const current = await getCurrentByCoords(p.lat, p.lon, units);
      items[name] = { ok: true, place: p.name, current };
    }

    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: e?.message || "Bulk current failed" });
  }
});

router.get("/forecast-daily", async (req, res) => {
  try {
    const { place = "", units = "metric" } = req.query || {};
    const p = await findPlaceByName(place);

    if (!p) {
      return res.status(404).json({
        message: "Unknown place. Admin must add this place in Admin → Weather Updates.",
      });
    }

    const forecast = await getForecastDailyByCoords(p.lat, p.lon, units);
    res.json({ place: p.name, lat: p.lat, lon: p.lon, forecast });
  } catch (e) {
    res.status(e?.status || 502).json({ message: e?.message || "Forecast failed" });
  }
});

export default router;
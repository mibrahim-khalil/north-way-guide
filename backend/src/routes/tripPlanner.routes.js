import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import Spot from "../models/Spot.js";
import RoadStatus from "../models/RoadStatus.js";
import Transport from "../models/Transport.js";
import Hotel from "../models/Hotel.js";

import AppStat from "../models/AppStat.js";
import SavedTrip from "../models/SavedTrip.js";

const router = Router();

/*  helpers  */

function parseDate(yyyyMmDd) {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function normCity(x) {
  return String(x || "").trim();
}

function normLower(x) {
  return String(x || "").trim().toLowerCase();
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tierFromBppd(bppd) {
  if (bppd < 5000) return "BUDGET";
  if (bppd < 12000) return "MID";
  return "LUX";
}

function paceFromDays(days) {
  if (days <= 4) return "FAST";
  if (days <= 8) return "NORMAL";
  return "RELAXED";
}

function minBppdFor({ travelMode, transportType }) {
  const mode = String(travelMode || "").toUpperCase();
  const tt = String(transportType || "").toUpperCase();
  if (mode === "AIR") return 15000;
  if (tt === "PUBLIC") return 4500;
  return 5500;
}


function fitSkeleton(seq, days) {
  if (!Array.isArray(seq) || seq.length === 0) return [];
  const d = Math.max(1, Number(days || 1));

  if (seq.length === d) return seq;

  if (seq.length > d) {
    if (d === 1) return [seq[seq.length - 1]];

    let suffixStart = seq.length - 1;

    for (let i = seq.length - 1; i > 0; i--) {
      const cur = seq[i];
      const prev = seq[i - 1];
      const curFrom = normCity(cur?.leg?.from || "");
      const prevBase = normCity(prev?.baseCity || "");

      if (!cur?.leg || !curFrom || !prevBase) break;
      if (curFrom !== prevBase) break;

      suffixStart = i - 1;
    }

    const suffix = seq.slice(suffixStart);
    const prefixLen = d - suffix.length;

    if (prefixLen <= 0) {
      return seq.slice(seq.length - d);
    }

    if (prefixLen > suffixStart) return seq.slice(0, d);

    return [...seq.slice(0, prefixLen), ...suffix];
  }

  // expand: add filler days before return day
  const last = seq[seq.length - 1];
  const beforeLast = seq[seq.length - 2] || last;
  const extraCount = d - seq.length;

  const filler = Array.from({ length: extraCount }, () => ({
    title: `${beforeLast.baseCity} Exploration`,
    baseCity: beforeLast.baseCity,
    leg: null,
  }));

  return [...seq.slice(0, seq.length - 1), ...filler, last];
}

function normalizeStart(city) {
  const c = normLower(city);
  if (c === "rawalpindi") return "Islamabad";
  return normCity(city || "Islamabad") || "Islamabad";
}

function isLocalBaseStartForCircuit(startCity, primaryCircuit) {
  const c = normLower(startCity);
  const circuit = String(primaryCircuit || "SKARDU_SIDE").toUpperCase();

  if (circuit === "SKARDU_SIDE") {
    return ["skardu", "shigar", "khaplu", "karmang", "astore"].includes(c);
  }
  return ["gilgit", "hunza", "nagar", "phander", "gahkuch", "jaglot"].includes(c);
}

/*  segments  */

const SEGMENTS = [
  { from: "Islamabad", to: "Besham", distanceKm: ~265, driveHours: 6.5, roadOption: "KKH" },
  { from: "Besham", to: "Chilas", distanceKm: ~335, driveHours: 8, roadOption: "KKH" },
  { from: "Chilas", to: "Gilgit", distanceKm: ~130, driveHours: 4.0, roadOption: "KKH" },
  { from: "Chilas", to: "Skardu", distanceKm: ~257, driveHours: 9.0, roadOption: "KKH" },

  { from: "Islamabad", to: "Naran", distanceKm: ~280, driveHours: 7.0, roadOption: "BABUSAR" },
  { from: "Naran", to: "Chilas", distanceKm: ~114, driveHours: 6.0, roadOption: "BABUSAR" },

  { from: "Chilas", to: "Raikot", distanceKm: ~75, driveHours: 2.5, roadOption: "KKH" },
  { from: "Jaglot", to: "Gilgit", distanceKm: ~45, driveHours: 1.5, roadOption: "KKH" },

  { from: "Gilgit", to: "Hunza", distanceKm: ~100, driveHours: 3.0, roadOption: "KKH" },
  { from: "Gilgit", to: "Nagar", distanceKm: ~65, driveHours: 2.5, roadOption: "KKH" },

  { from: "Gilgit", to: "Skardu", distanceKm: ~205, driveHours: 4.5, roadOption: "KKH" },
  { from: "Gilgit", to: "Astore", distanceKm: ~120, driveHours: 5.0, roadOption: "KKH" },

  { from: "Skardu", to: "Shigar", distanceKm: ~35, driveHours: 1.5, roadOption: "KKH" },
  { from: "Skardu", to: "Khaplu", distanceKm: ~103, driveHours: 5.0, roadOption: "KKH" },
  { from: "Skardu", to: "Karmang", distanceKm: ~129, driveHours: 4.5, roadOption: "KKH" },

  { from: "Skardu", to: "Astore", distanceKm: ~278, driveHours: 9.5, roadOption: "KKH" },
  { from: "Gilgit", to: "Phander", distanceKm: ~180, driveHours: 7.5, roadOption: "KKH" },

  { from: "Hunza", to: "Khunjerab", distanceKm: ~150, driveHours: 3.0, roadOption: "KKH" },
];

function findSegment(from, to, roadOption) {
  const f = normCity(from);
  const t = normCity(to);
  const r = String(roadOption || "").toUpperCase();

  let seg = SEGMENTS.find((s) => s.from === f && s.to === t && (!r || s.roadOption === r));
  if (seg) return seg;

  seg = SEGMENTS.find((s) => s.from === t && s.to === f && (!r || s.roadOption === r));
  if (seg) return { ...seg, from: f, to: t };

  seg = SEGMENTS.find((s) => s.from === f && s.to === t);
  if (seg) return seg;

  seg = SEGMENTS.find((s) => s.from === t && s.to === f);
  if (seg) return { ...seg, from: f, to: t };

  return null;
}

function fuelEstimatePkr(distanceKm) {
  const petrolPrice = 300;
  const kmPerLiter = 12;
  const liters = Number(distanceKm || 0) / kmPerLiter;
  return Math.round(liters * petrolPrice);
}

/*  fares fallback */

const PUBLIC_FARES = {
  "Islamabad|Besham": [1500, 2000],
  "Islamabad|Naran": [2000, 2500],
  "Islamabad|Chilas": [2300, 2600],
  "Islamabad|Gilgit": [3200, 3500],
  "Islamabad|Hunza": [3000, 3200],
  "Islamabad|Skardu": [3500, 4000],
  "Islamabad|Astore": [3500, 3700],

  "Chilas|Raikot": [1500, 2500],
  "Chilas|Gilgit": [1000, 1500],
  "Jaglot|Gilgit": [500, 700],
  "Gilgit|Hunza": [500, 1000],
  "Gilgit|Nagar": [500, 1000],
  "Gilgit|Skardu": [1500, 2500],
  "Gilgit|Astore": [1500, 2500],
  "Skardu|Shigar": [500, 700],
  "Skardu|Khaplu": [1000, 1800],
  "Skardu|Karmang": [1000, 2500],
  "Skardu|Astore": [4000, 5500],
  "Gilgit|Phander": [2000, 3500],

  "Besham|Chilas": [2000, 3200],
  "Naran|Chilas": [2500, 4500],
  "Chilas|Skardu": [2000, 3500],
};

function fareKey(a, b) {
  return `${normCity(a)}|${normCity(b)}`;
}

function lookupPublicFareRange(from, to) {
  const k1 = fareKey(from, to);
  const k2 = fareKey(to, from);
  return PUBLIC_FARES[k1] || PUBLIC_FARES[k2] || null;
}

function bestProviderFare(transportOptions) {
  const fares = (transportOptions || [])
    .map((x) => Number(x?.fare || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!fares.length) return null;
  return Math.min(...fares);
}

function estimatePublicLegCostPkr({ from, to, travelers, transportOptions }) {
  const providerMin = bestProviderFare(transportOptions);
  if (providerMin) {
    return {
      costTotal: Math.round(providerMin * travelers),
      estimate: { source: "DB_MIN", minPkr: Math.round(providerMin), maxPkr: Math.round(providerMin) },
    };
  }

  const r = lookupPublicFareRange(from, to);
  if (!r) return { costTotal: 0, estimate: null };

  const [min, max] = r;
  const avg = (min + max) / 2;

  return {
    costTotal: Math.round(avg * travelers),
    estimate: { source: "TABLE", minPkr: Math.round(min), maxPkr: Math.round(max) },
  };
}

/*  db picks - */

function spotCityAliases(baseCity) {
  const c = normLower(baseCity);

  if (c === "skardu")
    return ["Skardu", "Shigar", "Khaplu", "Kachura", "Katpana", "Deosai", "Satpara", "Kharmang"];

  if (c === "chilas")
    return ["Chilas", "Diamer", "Raikot", "Fairy Meadows", "Thalichi"];

  if (c === "gilgit") return ["Gilgit", "Jutial", "Danyore", "Jaglot"];
  if (c === "hunza") return ["Hunza", "Karimabad", "Aliabad", "Gulmit", "Passu", "Attabad"];
  if (c === "naran") return ["Naran", "Kaghan", "Balakot"];
  if (c === "besham") return ["Besham", "Shangla"];
  if (c === "astore") return ["Astore", "Rama", "Minimarg", "Deosai"];

  return [baseCity];
}

// Block generic "city name" spots showing in other cities
const GENERIC_CITY_TITLES = new Set(
  ["islamabad", "rawalpindi", "lahore", "besham", "chilas", "skardu", "gilgit", "hunza", "naran", "astore"]
);

function seasonMatchStage(month) {
  return {
    $or: [
      { bestMonths: { $exists: false } },
      { bestMonths: { $size: 0 } },
      { bestMonths: month },
    ],
  };
}

async function pickSpots({ baseCity, month, usedTitleSet }) {
  const aliases = spotCityAliases(baseCity).filter(Boolean);
  const baseCityLower = normLower(baseCity);

  const rxList = aliases.map((x) => new RegExp(`^${escapeRegex(x)}$`, "i"));

  // STRICT pool: match only by baseCity aliases (no random other region)
  const strictPool = await Spot.aggregate([
    {
      $match: {
        isActive: true,
        ...seasonMatchStage(month),
        $or: rxList.map((rx) => ({ baseCity: rx })),
      },
    },
    { $sample: { size: 25 } },
    {
      $project: {
        _id: 1,
        title: 1,
        mapsUrl: 1,
        images: 1,
        image: 1,
        baseCity: 1,
        location: 1,
        region: 1,
      },
    },
  ]);

  // FALLBACK pool: still within aliases, but using region/location 
  const fallbackPool = await Spot.aggregate([
    {
      $match: {
        isActive: true,
        ...seasonMatchStage(month),
        $or: rxList.flatMap((rx) => [{ region: rx }, { location: rx }]),
      },
    },
    { $sample: { size: 25 } },
    {
      $project: {
        _id: 1,
        title: 1,
        mapsUrl: 1,
        images: 1,
        image: 1,
        baseCity: 1,
        location: 1,
        region: 1,
      },
    },
  ]);

  const combined = [...strictPool, ...fallbackPool];

  const picked = [];
  for (const s of combined) {
    const title = String(s.title || "").trim();
    const key = title.toLowerCase();
    if (!key) continue;
    if (usedTitleSet.has(key)) continue;

    if (GENERIC_CITY_TITLES.has(key) && key !== baseCityLower) continue;

    usedTitleSet.add(key);

    picked.push({
      _id: s._id,
      title,
      mapsUrl: s.mapsUrl || "",
      images: Array.isArray(s.images) ? s.images : [],
      image: s.image || "",
      baseCity: s.baseCity || "",
      location: s.location || "",
      region: s.region || "",
    });

    if (picked.length >= 3) break;
  }

  return picked;
}

async function findTransportOptions(from, to) {
  let items = await Transport.find({ from, to, isActive: true })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("providerName contactPhone whatsapp bookingUrl type fare");

  // fallback: reverse direction
  if (!items.length) {
    items = await Transport.find({ from: to, to: from, isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("providerName contactPhone whatsapp bookingUrl type fare");
  }

  return items;
}

function hotelCityAliases(city) {
  const c = normLower(city);
  if (c === "hunza") return ["Hunza", "Karimabad", "Aliabad", "Gulmit", "Passu"];
  if (c === "skardu") return ["Skardu", "Shigar", "Khaplu"];
  if (c === "gilgit") return ["Gilgit", "Jutial", "Danyore"];
  if (c === "naran") return ["Naran", "Kaghan"];
  if (c === "rawalpindi") return ["Rawalpindi", "Islamabad"];
  return [city];
}

async function suggestHotelsByTier({ city, tier }) {
  const aliases = hotelCityAliases(city).filter(Boolean);
  const or = aliases.map((x) => ({ city: new RegExp(escapeRegex(x), "i") }));

  const list = await Hotel.find({
    isActive: true,
    $or: or,
  })
    .sort({ priceFrom: 1 })
    .limit(12)
    .select("name city priceFrom images");

  if (!list.length) return [];
  if (tier === "BUDGET") return list.slice(0, 3);
  if (tier === "LUX") return list.slice(-3).reverse();

  const midStart = Math.max(0, Math.floor(list.length / 2) - 1);
  return list.slice(midStart, midStart + 3);
}

/*  road status  */

async function checkRoadOpen(roadKey, dateObj) {
  const doc = await RoadStatus.findOne({
    roadKey,
    from: { $lte: dateObj },
    to: { $gte: dateObj },
  }).sort({ updatedAt: -1 });

  if (doc) return { isOpen: doc.isOpen, source: "DB", reason: doc.reason || "" };

  const m = dateObj.getUTCMonth() + 1;
  if (roadKey === "BABUSAR") {
    const open = m >= 5 && m <= 10;
    return { isOpen: open, source: "SEASONAL", reason: open ? "Seasonal estimate" : "Seasonal closure (winter)" };
  }

  return { isOpen: true, source: "FALLBACK", reason: "Assumed open (fallback)" };
}

/* ML */

async function predictPlanML(payload) {
  const base = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const r = await fetch(`${base}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`ML service error (${r.status}): ${t}`);
  }

  return r.json();
}

/* itinerary templates */

function buildSkeleton({ days, startLocation, travelMode, roadOption, primaryCircuit, scope }) {
  const mode = String(travelMode || "").toUpperCase();
  const isRoad = mode === "ROAD";
  const road = isRoad ? String(roadOption || "").toUpperCase() : "NONE";

  const start = normalizeStart(startLocation);
  const wantsSkardu = String(primaryCircuit || "SKARDU_SIDE").toUpperCase() === "SKARDU_SIDE";

  // local base only if circuit matches
  if (isRoad && isLocalBaseStartForCircuit(start, primaryCircuit)) {
    const base = wantsSkardu ? "Skardu" : "Hunza";
    const seq = [
      { title: `${base} City`, baseCity: base, leg: null },
      { title: `${base} Exploration`, baseCity: base, leg: null },
      { title: `Return to ${start}`, baseCity: start, leg: null },
    ];
    return fitSkeleton(seq, days);
  }

  // AIR
  if (mode === "AIR") {
    const target = wantsSkardu ? "Skardu" : "Gilgit";
    const seq = [
      { title: `${start} to ${target} (Flight)`, baseCity: target, leg: { from: start, to: target, mode: "AIR", roadOption: "NONE" } },
      { title: `${target} City`, baseCity: target, leg: null },
      { title: `${target} Exploration`, baseCity: target, leg: null },
      { title: `${target} to ${start} (Flight back)`, baseCity: start, leg: { from: target, to: start, mode: "AIR", roadOption: "NONE" } },
    ];
    return fitSkeleton(seq, days);
  }

  // ROAD Babusar Skardu template (keeps return chain)
  if (isRoad && road === "BABUSAR" && wantsSkardu) {
    const seq = [
      { title: `${start} to Naran (Stay)`, baseCity: "Naran", leg: { from: start, to: "Naran", mode, roadOption: road } },
      { title: `Naran to Chilas (Stay)`, baseCity: "Chilas", leg: { from: "Naran", to: "Chilas", mode, roadOption: road } },
      { title: `Chilas to Skardu (Stay)`, baseCity: "Skardu", leg: { from: "Chilas", to: "Skardu", mode, roadOption: road } },
      { title: `Skardu City`, baseCity: "Skardu", leg: null },
      { title: `Shigar Day Trip`, baseCity: "Skardu", leg: { from: "Skardu", to: "Shigar", mode, roadOption: road } },
      { title: `Khaplu Day Trip`, baseCity: "Skardu", leg: { from: "Skardu", to: "Khaplu", mode, roadOption: road } },
      { title: `Skardu to Chilas (Stay)`, baseCity: "Chilas", leg: { from: "Skardu", to: "Chilas", mode, roadOption: road } },
      { title: `Chilas to Naran (Stay)`, baseCity: "Naran", leg: { from: "Chilas", to: "Naran", mode, roadOption: road } },
      { title: `Naran to ${start} (Return)`, baseCity: start, leg: { from: "Naran", to: start, mode, roadOption: road } },
    ];
    return fitSkeleton(seq, days);
  }

  // Default KKH skardu
  if (isRoad && wantsSkardu) {
    const seq = [
      { title: `${start} to Besham (Stay)`, baseCity: "Besham", leg: { from: start, to: "Besham", mode, roadOption: road } },
      { title: `Besham to Chilas (Stay)`, baseCity: "Chilas", leg: { from: "Besham", to: "Chilas", mode, roadOption: road } },
      { title: `Chilas to Skardu (Stay)`, baseCity: "Skardu", leg: { from: "Chilas", to: "Skardu", mode, roadOption: road } },
      { title: `Skardu City`, baseCity: "Skardu", leg: null },
      { title: `Shigar Day Trip`, baseCity: "Skardu", leg: { from: "Skardu", to: "Shigar", mode, roadOption: road } },
      { title: `Skardu to Chilas (Stay)`, baseCity: "Chilas", leg: { from: "Skardu", to: "Chilas", mode, roadOption: road } },
      { title: `Chilas to Besham (Stay)`, baseCity: "Besham", leg: { from: "Chilas", to: "Besham", mode, roadOption: road } },
      { title: `Besham to ${start} (Return)`, baseCity: start, leg: { from: "Besham", to: start, mode, roadOption: road } },
    ];
    return fitSkeleton(seq, days);
  }

  // Hunza default
  const seq = [
    { title: `${start} to Besham (Stay)`, baseCity: "Besham", leg: { from: start, to: "Besham", mode, roadOption: road } },
    { title: `Besham to Gilgit (Stay)`, baseCity: "Gilgit", leg: { from: "Besham", to: "Gilgit", mode, roadOption: road } },
    { title: `Gilgit to Hunza (Stay)`, baseCity: "Hunza", leg: { from: "Gilgit", to: "Hunza", mode, roadOption: road } },
    { title: `Hunza Exploration`, baseCity: "Hunza", leg: null },
    { title: `Khunjerab Border Day Trip`, baseCity: "Hunza", leg: { from: "Hunza", to: "Khunjerab", mode, roadOption: road } },
    { title: `Hunza to Gilgit`, baseCity: "Gilgit", leg: { from: "Hunza", to: "Gilgit", mode, roadOption: road } },
    { title: `Gilgit to Besham (Stay)`, baseCity: "Besham", leg: { from: "Gilgit", to: "Besham", mode, roadOption: road } },
    { title: `Besham to ${start} (Return)`, baseCity: start, leg: { from: "Besham", to: start, mode, roadOption: road } },
  ];
  return fitSkeleton(seq, days);
}

/*  public endpoints  */

router.get("/stats", async (req, res) => {
  const doc = await AppStat.findOneAndUpdate(
    { key: "trip_planner_generations" },
    { $setOnInsert: { value: 0 } },
    { returnDocument: "after", upsert: true }
  ).select("value");

  res.json({ totalGenerations: doc?.value || 0 });
});

/*  auth endpoints  */

router.post("/save", requireAuth, async (req, res) => {
  const { itinerary, title } = req.body || {};
  if (!itinerary || !Array.isArray(itinerary?.days)) {
    return res.status(400).json({ message: "Invalid itinerary" });
  }

  const doc = await SavedTrip.create({
    userId: req.auth.userId,
    title: String(title || "").slice(0, 120),
    itinerary,
  });

  res.json({ ok: true, id: doc._id });
});

router.get("/saved", requireAuth, async (req, res) => {
  const items = await SavedTrip.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 })
    .select("title createdAt itinerary");

  const out = items.map((x) => ({
    _id: x._id,
    title: x.title,
    createdAt: x.createdAt,
    summary: {
      startLocation: x.itinerary?.input?.startLocation || "—",
      startDate: x.itinerary?.input?.startDate || "—",
      daysPlanned: x.itinerary?.input?.daysPlanned || (x.itinerary?.days || []).length,
      estTotal: x.itinerary?.totals?.estTotal || 0,
    },
  }));

  res.json({ items: out });
});

router.get("/saved/:id", requireAuth, async (req, res) => {
  const doc = await SavedTrip.findOne({ _id: req.params.id, userId: req.auth.userId });
  if (!doc) return res.status(404).json({ message: "Saved trip not found" });
  res.json({ item: doc });
});

router.delete("/saved/:id", requireAuth, async (req, res) => {
  const doc = await SavedTrip.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
  if (!doc) return res.status(404).json({ message: "Saved trip not found" });
  res.json({ ok: true });
});

/*  main generate trip olan  */

router.post("/generate", requireAuth, async (req, res) => {
  try {
    const {
      budgetTotal,
      days,
      travelers,
      startLocation,
      startDate,
      travelMode,
      roadOption = "NONE",
      primaryCircuit = "SKARDU_SIDE",
      transportType = "PUBLIC",
      scope = "SINGLE",
    } = req.body || {};

    const budget = Number(budgetTotal || 0);
    const daysRequested = Number(days || 0);
    const t = Number(travelers || 0);

    if (budget <= 0 || daysRequested < 1 || daysRequested > 21 || t < 1) {
      return res.status(400).json({ message: "Invalid budget/days/travelers" });
    }

    const dateObj = parseDate(startDate);
    if (!dateObj) return res.status(400).json({ message: "Invalid startDate" });

    const todayUtc = startOfTodayUtc();
    if (dateObj.getTime() < todayUtc.getTime()) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    const month = dateObj.getUTCMonth() + 1;

    const mode = String(travelMode || "").toUpperCase();
    if (!["ROAD", "AIR"].includes(mode)) return res.status(400).json({ message: "Invalid travelMode" });

    let road = mode === "ROAD" ? String(roadOption || "").toUpperCase() : "NONE";
    if (mode === "ROAD" && !["KKH", "BABUSAR"].includes(road)) {
      return res.status(400).json({ message: "Invalid roadOption" });
    }
    if (mode === "AIR") road = "NONE";

    const warnings = [];
    const startNorm = normalizeStart(startLocation);
    const startLower = normLower(startNorm);

    if (mode === "ROAD") {
      if (startLower === "naran" && road !== "BABUSAR") {
        warnings.push("Start location is Naran. Using BABUSAR corridor for routing.");
        road = "BABUSAR";
      }
      if (startLower === "besham" && road !== "KKH") {
        warnings.push("Start location is Besham. Using KKH for routing.");
        road = "KKH";
      }
    }

    if (mode === "ROAD" && road === "BABUSAR") {
      const s = await checkRoadOpen("BABUSAR", dateObj);
      if (!s.isOpen) {
        warnings.push(`Babusar CLOSED (${s.reason}). Switching to KKH.`);
        road = "KKH";
      } else {
        warnings.push(`Babusar looks OPEN (${s.source}).`);
      }
    }

    const ttUpper = String(transportType || "PUBLIC").toUpperCase();

    let plannedDays = daysRequested;
    let scopePlanned = String(scope || "SINGLE").toUpperCase();

    const minBppd = minBppdFor({ travelMode: mode, transportType: ttUpper });
    const maxDaysPossible = Math.max(3, Math.floor(budget / (t * minBppd)));

    if (plannedDays > maxDaysPossible) {
      warnings.push(`Budget is low for ${daysRequested} days. Planned ${maxDaysPossible} days to fit budget.`);
      plannedDays = maxDaysPossible;
    }

    if (scopePlanned === "LOOP" && plannedDays < 12) {
      warnings.push("Loop needs about 12 or more days. Switching scope to SINGLE to fit your budget/time.");
      scopePlanned = "SINGLE";
    }

    const bppd = budget / (t * plannedDays);
    const tier = tierFromBppd(bppd);
    const pace = paceFromDays(plannedDays);

    const mlPayload = {
      budget_total: Math.round(budget),
      days: plannedDays,
      travelers: t,
      month,
      travel_mode: mode,
      road_option: road,
      primary_circuit: String(primaryCircuit || "SKARDU_SIDE"),
      transport_type: ttUpper,
      scope: scopePlanned,
      bppd: Number(bppd.toFixed(2)),
      tier,
      pace,
    };

    const ml = await predictPlanML(mlPayload);
    const planId = ml?.planId || "PLAN_SKARDU_KKH_SHORT";

    const skeleton = buildSkeleton({
      days: plannedDays,
      startLocation: startNorm,
      travelMode: mode,
      roadOption: road,
      primaryCircuit,
      scope: scopePlanned,
    });

    // Update global counter
    let totalGenerations = 0;
    try {
      const stat = await AppStat.findOneAndUpdate(
        { key: "trip_planner_generations" },
        { $inc: { value: 1 } },
        { returnDocument: "after", upsert: true }
      ).select("value");

      totalGenerations = stat?.value || 0;
    } catch (e) {
      console.error("Trip planner stat increment failed:", e?.message || e);
      totalGenerations = 0;
    }

    const usedTitleSet = new Set();
    const daysOut = [];

    let computedTotal = 0;

    for (let i = 0; i < skeleton.length; i++) {
      const s = skeleton[i];
      const baseCity = s.baseCity;

      const acts = await pickSpots({ baseCity, month, usedTitleSet });

      let segment = null;
      let fuelPkr = 0;
      let transportOptions = [];
      let travelLegCost = 0;
      let fareEstimate = null;

      const legMode = String(s?.leg?.mode || "").toUpperCase();

      if (s.leg?.from && s.leg?.to && legMode === "ROAD") {
        if (ttUpper === "PUBLIC") {
          transportOptions = await findTransportOptions(s.leg.from, s.leg.to);
          const est = estimatePublicLegCostPkr({
            from: s.leg.from,
            to: s.leg.to,
            travelers: t,
            transportOptions,
          });
          travelLegCost = est.costTotal;
          fareEstimate = est.estimate;
        }

        segment = findSegment(s.leg.from, s.leg.to, road);

        if (ttUpper === "OWN" && segment) {
          fuelPkr = fuelEstimatePkr(segment.distanceKm);
          travelLegCost = fuelPkr;
        }
      }

      const hotelOptions =
        ["Islamabad", "Rawalpindi"].includes(baseCity) ? [] : await suggestHotelsByTier({ city: baseCity, tier });

      const living = Math.round((tier === "BUDGET" ? 1800 : tier === "MID" ? 3200 : 5200) * t);
      const hotel =
        ["Islamabad", "Rawalpindi"].includes(baseCity)
          ? 0
          : Math.round((tier === "BUDGET" ? 2500 : tier === "MID" ? 6500 : 14000) * Math.max(1, Math.ceil(t / 2)));

      const estCost = Math.max(0, Math.round(living + hotel + travelLegCost));
      computedTotal += estCost;

      daysOut.push({
        day: i + 1,
        baseCity,
        title: s.title,
        leg: s.leg
          ? {
              ...s.leg,
              distanceKm: segment?.distanceKm || null,
              driveHours: segment?.driveHours || null,
              fuelEstimatePkr: fuelPkr || 0,
              fareEstimate,
            }
          : null,
        activities: acts,
        transportOptions,
        hotelOptions,
        estCost,
        costBreakdown: { living, hotel, travel: travelLegCost },
      });
    }

    if (computedTotal > budget) {
      warnings.push(`Estimated cost PKR ${computedTotal} is above your budget PKR ${budget}. Reduce days or increase budget.`);
    }

    return res.json({
      stats: { totalGenerations },
      itinerary: {
        input: {
          budgetTotal: budget,
          daysRequested,
          daysPlanned: skeleton.length,
          travelers: t,
          startLocation: startNorm,
          startDate,
          travelMode: mode,
          roadOption: road,
          primaryCircuit,
          transportType: ttUpper,
          scopeRequested: String(scope || "SINGLE").toUpperCase(),
          scopePlanned,
        },
        ml: { planId, tier, pace, bppd: Number(bppd.toFixed(2)) },
        warnings,
        totals: { estTotal: computedTotal },
        days: daysOut,
      },
    });
  } catch (err) {
    console.error("TRIP PLANNER ERROR:", err);
    return res.status(500).json({ message: err.message || "Trip planner failed" });
  }
});

export default router;
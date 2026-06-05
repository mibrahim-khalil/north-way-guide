import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import WeatherPlace from "../models/WeatherPlace.js";

const router = Router();
router.use(requireAuth, requireAdmin);

function validLatLon(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  if (la < -90 || la > 90) return false;
  if (lo < -180 || lo > 180) return false;
  return true;
}

const DEFAULT_PLACES = [
  { name: "Hunza", lat: 36.3167, lon: 74.65, sortOrder: 10 },
  { name: "Skardu", lat: 35.2971, lon: 75.6333, sortOrder: 20 },
  { name: "Gilgit", lat: 35.9208, lon: 74.3083, sortOrder: 30 },
  { name: "Astore", lat: 35.3667, lon: 74.9, sortOrder: 40 },
  { name: "Ghizer", lat: 36.1726, lon: 73.7691, sortOrder: 50 },
  { name: "Shigar", lat: 35.4238, lon: 75.7446, sortOrder: 60 },
  { name: "Khaplu", lat: 35.1404, lon: 76.336, sortOrder: 70 },
  { name: "Nagar", lat: 36.26, lon: 74.52, sortOrder: 80 },
  { name: "Chilas", lat: 35.419, lon: 74.097, sortOrder: 90 },
];

router.get("/", async (req, res) => {
  const items = await WeatherPlace.find({}).sort({ sortOrder: 1, name: 1 });
  res.json({ items });
});

router.post("/seed-defaults", async (req, res) => {
  const ops = DEFAULT_PLACES.map((p) => ({
    updateOne: {
      filter: { name: p.name },
      update: { $set: { ...p, isActive: true } },
      upsert: true,
    },
  }));

  await WeatherPlace.bulkWrite(ops);
  const items = await WeatherPlace.find({}).sort({ sortOrder: 1, name: 1 });
  res.json({ ok: true, items });
});

router.post("/", async (req, res) => {
  const { name, lat, lon, sortOrder = 0, isActive = true } = req.body || {};
  if (!name) return res.status(400).json({ message: "name is required" });
  if (!validLatLon(lat, lon)) return res.status(400).json({ message: "Invalid lat/lon" });

  const created = await WeatherPlace.create({
    name: String(name).trim(),
    lat: Number(lat),
    lon: Number(lon),
    sortOrder: Number(sortOrder || 0),
    isActive: Boolean(isActive),
  });

  res.status(201).json({ item: created });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const { name, lat, lon, sortOrder, isActive } = req.body || {};
  const patch = {};

  if (name !== undefined) patch.name = String(name).trim();
  if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder || 0);
  if (isActive !== undefined) patch.isActive = Boolean(isActive);

  if (lat !== undefined || lon !== undefined) {
    const doc = await WeatherPlace.findById(id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    const finalLat = lat !== undefined ? Number(lat) : doc.lat;
    const finalLon = lon !== undefined ? Number(lon) : doc.lon;

    if (!validLatLon(finalLat, finalLon)) return res.status(400).json({ message: "Invalid lat/lon" });

    patch.lat = finalLat;
    patch.lon = finalLon;
  }

  const updated = await WeatherPlace.findByIdAndUpdate(id, patch, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ item: updated });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await WeatherPlace.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ ok: true });
});

export default router;
import { Router } from "express";
import RoadStatus from "../models/RoadStatus.js";

const router = Router();

function parseDate(yyyyMmDd) {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function seasonalFallback(roadKey, dateObj) {
  const m = dateObj.getUTCMonth() + 1; // 1..12
  if (roadKey === "BABUSAR") {
    // approx open May-Oct, closed Nov-Apr
    const open = m >= 5 && m <= 10;
    return {
      isOpen: open,
      reason: open ? "Seasonal estimate" : "Seasonal closure (winter)",
      sourceName: "Seasonal rule (fallback)",
      sourceUrl: "",
      isEstimated: true,
    };
  }
  return {
    isOpen: true,
    reason: "Assumed open (fallback)",
    sourceName: "Fallback",
    sourceUrl: "",
    isEstimated: true,
  };
}


router.get("/status", async (req, res) => {
  const roadKey = String(req.query.roadKey || "").toUpperCase();
  const dateStr = String(req.query.date || "");

  if (!["BABUSAR", "KKH"].includes(roadKey)) {
    return res.status(400).json({ message: "Invalid roadKey" });
  }

  const dateObj = parseDate(dateStr);
  if (!dateObj) return res.status(400).json({ message: "Invalid date" });

  const doc = await RoadStatus.findOne({
    roadKey,
    from: { $lte: dateObj },
    to: { $gte: dateObj },
  })
    .sort({ updatedAt: -1 })
    .select("roadKey from to isOpen reason note sourceName sourceUrl updatedAt");

  if (!doc) {
    const fb = seasonalFallback(roadKey, dateObj);
    return res.json({
      roadKey,
      date: dateStr,
      ...fb,
      lastUpdatedAt: null,
    });
  }

  return res.json({
    roadKey,
    date: dateStr,
    isOpen: doc.isOpen,
    reason: doc.reason || "",
    note: doc.note || "",
    sourceName: doc.sourceName || "",
    sourceUrl: doc.sourceUrl || "",
    lastUpdatedAt: doc.updatedAt,
    isEstimated: false,
    from: doc.from,
    to: doc.to,
  });
});

export default router;
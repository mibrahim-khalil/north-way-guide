import { Router } from "express";
import mongoose from "mongoose";
import Guide from "../models/Guide.js";
import GuideBooking from "../models/GuideBooking.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

function toMidnightUTC(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== "string") return null;
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function diffDays(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return aFrom < bTo && aTo > bFrom;
}


router.get("/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query || {};

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const s = toMidnightUTC(String(startDate || ""));
  const e = toMidnightUTC(String(endDate || ""));

  if (!s || !e) return res.status(400).json({ message: "Invalid startDate or endDate" });

  const todayUtc = startOfTodayUtc();
  if (s.getTime() < todayUtc.getTime()) {
    return res.json({ available: false, reason: "PAST_DATE", note: "" });
  }

  const days = diffDays(s, e);
  if (days < 1) return res.json({ available: false, reason: "INVALID_RANGE", note: "" });

  const guide = await Guide.findById(id);
  if (!guide || guide.isActive === false) {
    return res.json({ available: false, reason: "GUIDE_INACTIVE", note: "" });
  }

  const blockedHit = (guide.unavailableRanges || []).find((r) => {
    if (!r?.from || !r?.to) return false;
    return rangesOverlap(s, e, new Date(r.from), new Date(r.to));
  });

  if (blockedHit) {
    return res.json({
      available: false,
      reason: "BLOCKED_BY_OWNER",
      note: String(blockedHit.note || ""),
    });
  }

  const conflict = await GuideBooking.findOne({
    guideId: guide._id,
    status: { $ne: "CANCELLED" },
    startDate: { $lt: e },
    endDate: { $gt: s },
  }).select("_id");

  if (conflict) {
    return res.json({ available: false, reason: "ALREADY_BOOKED", note: "" });
  }

  return res.json({ available: true, reason: "OK", note: "" });
});

import Review from "../models/Review.js";

router.get("/", async (req, res) => {
  try {
    const guides = await Guide.find({ isActive: true }).sort({ createdAt: -1 });

    const guidesWithRatings = await Promise.all(
      guides.map(async (guide) => {
        const reviews = await Review.find({
          targetType: "GUIDE",
          targetId: guide._id,
          status: "APPROVED",
        });

        const ratingCount = reviews.length;

        const ratingAvg =
          ratingCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
            : 0;

        return {
          ...guide.toObject(),
          ratingAvg,
          ratingCount,
        };
      })
    );

    res.json({ items: guidesWithRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const item = await Guide.findById(id);
  if (!item || item.isActive === false) return res.status(404).json({ message: "Not found" });

  res.json({ item });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const body = req.body || {};
  if (!body.ownerUserId) body.ownerUserId = req.auth.userId;
  const created = await Guide.create(body);
  res.status(201).json({ item: created });
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Guide.findByIdAndUpdate(id, req.body, { returnDocument: "after", runValidators: true });
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ item: updated });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Guide.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ ok: true });
});

export default router;
import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";

const router = Router();

function toObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

async function recomputeRatingIfNeeded(targetType, targetId) {
  if (!["HOTEL", "GUIDE"].includes(targetType)) return;

  const tid = toObjectId(targetId);
  if (!tid) return;

  const stats = await Review.aggregate([
    { $match: { targetType, targetId: tid, status: "APPROVED" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = stats?.[0]?.avg ? Number(stats[0].avg) : 0;
  const count = stats?.[0]?.count ? Number(stats[0].count) : 0;

  const rating = count ? Math.round(avg * 10) / 10 : 0;

  if (targetType === "HOTEL") {
    await Hotel.findByIdAndUpdate(tid, { rating });
  }
  if (targetType === "GUIDE") {
    await Guide.findByIdAndUpdate(tid, { rating });
  }
}


router.get("/", async (req, res) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    return res.status(400).json({ message: "targetType and targetId are required" });
  }

  const tid = toObjectId(targetId);
  if (!tid) return res.status(400).json({ message: "Invalid targetId" });

  const items = await Review.find({
    targetType,
    targetId: tid,
    status: "APPROVED",
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 });

  const avg = items.length ? items.reduce((s, r) => s + (r.rating || 0), 0) / items.length : 0;

  res.json({
    items,
    summary: {
      count: items.length,
      avg: items.length ? Math.round(avg * 10) / 10 : 0,
    },
  });
});


router.get("/me", requireAuth, async (req, res) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    return res.status(400).json({ message: "targetType and targetId are required" });
  }

  const tid = toObjectId(targetId);
  if (!tid) return res.status(400).json({ message: "Invalid targetId" });

  const item = await Review.findOne({
    userId: req.auth.userId,
    targetType,
    targetId: tid,
  }).sort({ createdAt: -1 });

  res.json({ item: item || null });
});


router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const { targetType, targetId, rating, comment = "" } = req.body || {};

  if (!targetType || !targetId) return res.status(400).json({ message: "targetType and targetId are required" });
  const tid = toObjectId(targetId);
  if (!tid) return res.status(400).json({ message: "Invalid targetId" });

  const r = Number(rating || 0);
  if (r < 1 || r > 5) return res.status(400).json({ message: "rating must be between 1 and 5" });

  const existing = await Review.findOne({
    userId: req.auth.userId,
    targetType,
    targetId: tid,
  });

  if (existing) {
    existing.rating = r;
    existing.comment = comment;
    existing.status = "PENDING";
    existing.adminNote = "";
    await existing.save();
    return res.json({ item: existing, updated: true });
  }

  const created = await Review.create({
    userId: req.auth.userId,
    targetType,
    targetId: tid,
    rating: r,
    comment,
    status: "PENDING",
    adminNote: "",
  });

  res.status(201).json({ item: created, created: true });
});


router.put("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const { rating, comment = "" } = req.body || {};
  const r = Number(rating || 0);
  if (r < 1 || r > 5) return res.status(400).json({ message: "rating must be between 1 and 5" });

  const item = await Review.findOne({ _id: req.params.id, userId: req.auth.userId });
  if (!item) return res.status(404).json({ message: "Review not found" });

  item.rating = r;
  item.comment = comment;
  item.status = "PENDING";
  item.adminNote = "";
  await item.save();

  res.json({ item });
});


router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Review.findOne({ _id: req.params.id, userId: req.auth.userId });
  if (!item) return res.status(404).json({ message: "Review not found" });

  const { targetType, targetId, status } = item;

  await Review.deleteOne({ _id: item._id });

  if (status === "APPROVED") {
    await recomputeRatingIfNeeded(targetType, targetId);
  }

  res.json({ ok: true });
});

export default router;
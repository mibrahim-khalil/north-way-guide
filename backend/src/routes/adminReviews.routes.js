import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";
import mongoose from "mongoose";

const router = Router();
router.use(requireAuth, requireAdmin);

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

  if (targetType === "HOTEL") await Hotel.findByIdAndUpdate(tid, { rating });
  if (targetType === "GUIDE") await Guide.findByIdAndUpdate(tid, { rating });
}


router.get("/", async (req, res) => {
  const { status, targetType } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (targetType) filter.targetType = targetType;

  const items = await Review.find(filter)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json({ items });
});


router.patch("/:id/approve", async (req, res) => {
  const item = await Review.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Review not found" });

  item.status = "APPROVED";
  item.adminNote = "";
  await item.save();

  await recomputeRatingIfNeeded(item.targetType, item.targetId);

  res.json({ item });
});


router.patch("/:id/reject", async (req, res) => {
  const { adminNote = "" } = req.body || {};

  const item = await Review.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Review not found" });

  item.status = "REJECTED";
  item.adminNote = adminNote;
  await item.save();

  await recomputeRatingIfNeeded(item.targetType, item.targetId);

  res.json({ item });
});


router.delete("/:id", async (req, res) => {
  const item = await Review.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Review not found" });

  const { targetType, targetId, status } = item;

  await Review.deleteOne({ _id: item._id });

  if (status === "APPROVED") {
    await recomputeRatingIfNeeded(targetType, targetId);
  }

  res.json({ ok: true });
});

export default router;
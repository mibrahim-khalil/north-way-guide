import { Router } from "express";
import mongoose from "mongoose";
import Spot from "../models/Spot.js";
import Review from "../models/Review.js"; 
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();


router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = await Spot.find({}).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", async (req, res) => {
  try {
    const spots = await Spot.find({ isActive: true }).sort({ createdAt: -1 });

    const spotsWithRatings = await Promise.all(
      spots.map(async (spot) => {
        const reviews = await Review.find({
          targetType: "SPOT",
          targetId: spot._id,
          status: "APPROVED",
        });

        const ratingCount = reviews.length;

        const ratingAvg =
          ratingCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
            : 0;

        return {
          ...spot.toObject(),
          ratingAvg,
          ratingCount,
        };
      })
    );

    res.json({ items: spotsWithRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const spot = await Spot.findById(id);

    if (!spot || spot.isActive === false) {
      return res.status(404).json({ message: "Not found" });
    }

    const reviews = await Review.find({
      targetType: "SPOT",
      targetId: spot._id,
      status: "APPROVED",
    });

    const ratingCount = reviews.length;

    const ratingAvg =
      ratingCount > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
        : 0;

    res.json({
      item: {
        ...spot.toObject(),
        ratingAvg,
        ratingCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const created = await Spot.create(req.body);
    res.status(201).json({ item: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const updated = await Spot.findByIdAndUpdate(
      id,
      req.body,
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const updated = await Spot.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
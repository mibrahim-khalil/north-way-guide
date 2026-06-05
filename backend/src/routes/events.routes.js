import { Router } from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { type = "upcoming" } = req.query;
    const limit = Math.min(Number(req.query.limit || 20), 50);

    const now = new Date();
    const baseFilter = { isActive: true, isPublished: true };

    const filter =
      type === "past"
        ? { ...baseFilter, startDate: { $lt: now } }
        : { ...baseFilter, startDate: { $gte: now } };

    const sort = type === "past" ? { startDate: -1 } : { startDate: 1 };

    const items = await Event.find(filter).sort(sort).limit(limit);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch events error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const item = await Event.findOne({ _id: id, isActive: true, isPublished: true });
    if (!item) return res.status(404).json({ message: "Event not found" });

    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch event error" });
  }
});

export default router;
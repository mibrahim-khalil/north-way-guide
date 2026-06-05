import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import Event from "../models/Event.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  try {
    const items = await Event.find({ isActive: true }).sort({ startDate: -1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch admin events error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description = "",
      location = "",
      mapUrl = "",
      startDate,
      endDate = null,
      image = "",
      isPublished = true,
    } = req.body || {};

    if (!title) return res.status(400).json({ message: "title is required" });
    if (!startDate) return res.status(400).json({ message: "startDate is required" });

    const created = await Event.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      location: String(location || "").trim(),
      mapUrl: String(mapUrl || "").trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      image: String(image || "").trim(),
      isPublished: Boolean(isPublished),
      isActive: true,
    });

    res.status(201).json({ item: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create event error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const { title, description, location, mapUrl, startDate, endDate, image, isPublished } = req.body || {};
    const patch = {};

    if (title !== undefined) patch.title = String(title).trim();
    if (description !== undefined) patch.description = String(description || "").trim();
    if (location !== undefined) patch.location = String(location || "").trim();
    if (mapUrl !== undefined) patch.mapUrl = String(mapUrl || "").trim();
    if (image !== undefined) patch.image = String(image || "").trim();
    if (isPublished !== undefined) patch.isPublished = Boolean(isPublished);

    if (startDate !== undefined) patch.startDate = new Date(startDate);
    if (endDate !== undefined) patch.endDate = endDate ? new Date(endDate) : null;

    const updated = await Event.findOneAndUpdate({ _id: id, isActive: true }, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update event error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await Event.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete event error" });
  }
});

export default router;
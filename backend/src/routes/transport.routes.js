import { Router } from "express";
import mongoose from "mongoose";
import Transport from "../models/Transport.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  const items = await Transport.find({}).sort({ createdAt: -1 });
  res.json({ items });
});

router.get("/", async (req, res) => {
  const items = await Transport.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ items });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const item = await Transport.findById(id);
  if (!item || item.isActive === false) return res.status(404).json({ message: "Not found" });

  res.json({ item });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const created = await Transport.create(req.body);
    res.status(201).json({ item: created });
  } catch (err) {
    console.error("TRANSPORT CREATE ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    const updated = await Transport.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ item: updated });
  } catch (err) {
    console.error("TRANSPORT UPDATE ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Transport.findByIdAndUpdate(id, { isActive: false }, { returnDocument: "after" });
  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ ok: true });
});

export default router;
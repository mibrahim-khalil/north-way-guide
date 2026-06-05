import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import Report from "../models/Report.js";

const router = Router();
router.use(requireAuth, requireAdmin);


router.get("/", async (req, res) => {
  try {
    const { kind, status } = req.query;

    const filter = { isActive: true };
    if (kind) filter.kind = String(kind).trim();
    if (status) filter.status = String(status).trim();

    const items = await Report.find(filter)
      .populate("reporterUserId", "name email phone role")
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch admin reports error" });
  }
});


router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const { status } = req.body || {};
    const allowed = ["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const updated = await Report.findOneAndUpdate(
      { _id: id, isActive: true },
      { status },
      { returnDocument: "after" }
    ).populate("reporterUserId", "name email phone role");

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ item: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update report status error" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await Report.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete report error" });
  }
});

export default router;
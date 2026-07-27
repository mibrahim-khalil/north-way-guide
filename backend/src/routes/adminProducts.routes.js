import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";   
import requireAdmin from "../middleware/requireAdmin.js";
import LocalProduct from "../models/LocalProduct.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const items = await LocalProduct.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});

router.patch("/:id/approve", async (req, res) => {
  const item = await LocalProduct.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Product not found" });

  item.status = "APPROVED";
  item.adminNote = "";
  await item.save();
  res.json({ item });
});

router.patch("/:id/reject", async (req, res) => {
  const { adminNote = "" } = req.body || {};

  const item = await LocalProduct.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Product not found" });

  item.status = "REJECTED";
  item.adminNote = adminNote;
  await item.save();
  res.json({ item });
});

export default router;
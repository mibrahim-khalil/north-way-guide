import { Router } from "express";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import ProductOrder from "../models/ProductOrder.js";

const router = Router();
const proofsDir = path.join(process.cwd(), "private_uploads", "payment_proofs");


router.get("/", requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const { status } = req.query;

  const filter = { userId };
  if (status) filter.status = status;

  const items = await ProductOrder.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});


router.get("/:id", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const item = await ProductOrder.findOne({ _id: req.params.id, userId });
  if (!item) return res.status(404).json({ message: "Order not found" });

  res.json({ item });
});


router.get("/:id/proofs/:proofId", requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const { id, proofId } = req.params;

  const order = await ProductOrder.findOne({ _id: id, userId });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const proof = (order.payment?.proofs || []).find((p) => String(p._id) === String(proofId));
  if (!proof) return res.status(404).json({ message: "Proof not found" });

  const filePath = path.join(proofsDir, proof.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

  return res.download(filePath, proof.originalName);
});

export default router;
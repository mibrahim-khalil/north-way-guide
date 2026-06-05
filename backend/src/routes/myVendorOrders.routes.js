import { Router } from "express";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import ServiceApplication from "../models/ServiceApplication.js";
import ProductOrder from "../models/ProductOrder.js";
import LocalProduct from "../models/LocalProduct.js";

const router = Router();
const proofsDir = path.join(process.cwd(), "private_uploads", "payment_proofs");

async function ensureVendorApproved(userId) {
  const ok = await ServiceApplication.exists({
    userId,
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  });
  return Boolean(ok);
}

function toVendorView(orderDoc, vendorUserId) {
  const o = orderDoc.toObject();

  const vendorItems = (o.items || []).filter((it) => String(it.vendorUserId) === String(vendorUserId));
  const vendorSubtotal = vendorItems.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0);

  const payment = {
    status: o?.payment?.status || "UNPAID",
    methodCode: o?.payment?.methodCode || "",
    methodLabel: o?.payment?.methodLabel || "",
    transactionId: o?.payment?.transactionId || "",
    adminNote: o?.payment?.adminNote || "",
    proofs: (o?.payment?.proofs || []).map((p) => ({
      _id: p._id,
      originalName: p.originalName,
      mimeType: p.mimeType,
      size: p.size,
      uploadedAt: p.uploadedAt,
    })),
  };

  return { ...o, items: vendorItems, vendorSubtotal, payment };
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const isVendor = await ensureVendorApproved(userId);
  if (!isVendor) return res.status(403).json({ message: "Vendor not approved yet." });

  const { status } = req.query;

  const filter = {
    "items.vendorUserId": userId,
    "payment.status": { $in: ["SUBMITTED", "PAID", "REJECTED"] },
  };
  if (status) filter.status = status;

  const orders = await ProductOrder.find(filter).sort({ createdAt: -1 });
  res.json({ items: orders.map((o) => toVendorView(o, userId)) });
});

// vendor downloads proof
router.get("/:id/proofs/:proofId", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const isVendor = await ensureVendorApproved(userId);
  if (!isVendor) return res.status(403).json({ message: "Vendor not approved yet." });

  const { id, proofId } = req.params;

  const order = await ProductOrder.findOne({ _id: id, "items.vendorUserId": userId });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const proof = (order.payment?.proofs || []).find((p) => String(p._id) === String(proofId));
  if (!proof) return res.status(404).json({ message: "Proof not found" });

  const filePath = path.join(proofsDir, proof.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

  return res.download(filePath, proof.originalName);
});

// vendor verifies payment
router.patch("/:id/payment/verify", requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const { decision, note = "" } = req.body || {};
  const dec = String(decision || "").toUpperCase();
  if (!["PAID", "REJECTED"].includes(dec)) return res.status(400).json({ message: "Invalid decision" });

  const isVendor = await ensureVendorApproved(userId);
  if (!isVendor) return res.status(403).json({ message: "Vendor not approved yet." });

  const order = await ProductOrder.findOne({ _id: req.params.id, "items.vendorUserId": userId });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const proofs = order.payment?.proofs || [];
  if (!Array.isArray(proofs) || proofs.length === 0) {
    return res.status(400).json({ message: "No payment proof uploaded yet." });
  }

  order.payment.status = dec;
  order.payment.verifiedAt = new Date();
  order.payment.verifiedByUserId = userId;
  order.payment.adminNote = String(note || "");

  if (dec === "PAID") {
    if (order.status === "PLACED") order.status = "CONFIRMED";
  } else {
    order.status = "CANCELLED";
    for (const it of order.items || []) {
      await LocalProduct.updateOne({ _id: it.productId }, { $inc: { stock: Number(it.quantity || 0) } });
    }
  }

  await order.save();
  res.json({ item: toVendorView(order, userId) });
});

// vendor updates status
router.patch("/:id/status", requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const { status } = req.body || {};
  const allowed = ["PLACED", "CONFIRMED", "CANCELLED", "FULFILLED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const isVendor = await ensureVendorApproved(userId);
  if (!isVendor) return res.status(403).json({ message: "Vendor not approved yet." });

  const order = await ProductOrder.findOne({ _id: req.params.id, "items.vendorUserId": userId });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const payStatus = String(order?.payment?.status || "UNPAID").toUpperCase();
  if ((status === "CONFIRMED" || status === "FULFILLED") && payStatus !== "PAID") {
    return res.status(400).json({ message: "Cannot confirm/fulfill until payment is PAID." });
  }

  order.status = status;
  await order.save();

  res.json({ item: toVendorView(order, userId) });
});

export default router;
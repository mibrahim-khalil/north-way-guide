import { Router } from "express";
import path from "path";
import fs from "fs";

import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import HotelBooking from "../models/HotelBooking.js";
import ProductOrder from "../models/ProductOrder.js";
import LocalProduct from "../models/LocalProduct.js";
import GuideBooking from "../models/GuideBooking.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const proofsDir = path.join(process.cwd(), "private_uploads", "payment_proofs");

router.get("/pending", async (req, res) => {
  const hotelBookings = await HotelBooking.find({ "payment.status": "SUBMITTED" }).sort({ createdAt: -1 });
  const productOrders = await ProductOrder.find({ "payment.status": "SUBMITTED" }).sort({ createdAt: -1 });
  const guideBookings = await GuideBooking.find({ "payment.status": "SUBMITTED" }).sort({ createdAt: -1 });
  res.json({ hotelBookings, productOrders, guideBookings });
});

router.get("/proofs/:targetType/:targetId/:proofId", async (req, res) => {
  const { targetType, targetId, proofId } = req.params;

  if (!["HOTEL_BOOKING", "PRODUCT_ORDER", "GUIDE_BOOKING"].includes(targetType)) {
    return res.status(400).json({ message: "Invalid targetType" });
  }

  const doc =
    targetType === "HOTEL_BOOKING"
      ? await HotelBooking.findById(targetId)
      : targetType === "PRODUCT_ORDER"
      ? await ProductOrder.findById(targetId)
      : await GuideBooking.findById(targetId);

  if (!doc) return res.status(404).json({ message: "Not found" });

  const proof = (doc.payment?.proofs || []).find((p) => String(p._id) === String(proofId));
  if (!proof) return res.status(404).json({ message: "Proof not found" });

  const filePath = path.join(proofsDir, proof.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

  res.download(filePath, proof.originalName);
});

router.patch("/verify", async (req, res) => {
  const { targetType, targetId, decision, adminNote = "" } = req.body || {};

  if (!["HOTEL_BOOKING", "PRODUCT_ORDER", "GUIDE_BOOKING"].includes(targetType)) {
    return res.status(400).json({ message: "Invalid targetType" });
  }
  if (!["PAID", "REJECTED"].includes(decision)) {
    return res.status(400).json({ message: "Invalid decision" });
  }

  if (targetType === "HOTEL_BOOKING") {
    const booking = await HotelBooking.findById(targetId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.payment.status = decision;
    booking.payment.verifiedAt = new Date();
    booking.payment.verifiedByUserId = req.auth.userId;
    booking.payment.adminNote = adminNote;

    if (decision === "PAID") booking.status = "CONFIRMED";
    await booking.save();
    return res.json({ item: booking });
  }

  if (targetType === "GUIDE_BOOKING") {
    const booking = await GuideBooking.findById(targetId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.payment.status = decision;
    booking.payment.verifiedAt = new Date();
    booking.payment.verifiedByUserId = req.auth.userId;
    booking.payment.adminNote = adminNote;

    if (decision === "PAID") booking.status = "CONFIRMED";
    await booking.save();
    return res.json({ item: booking });
  }

  const order = await ProductOrder.findById(targetId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.payment.status = decision;
  order.payment.verifiedAt = new Date();
  order.payment.verifiedByUserId = req.auth.userId;
  order.payment.adminNote = adminNote;

  if (decision === "PAID") {
    order.status = "CONFIRMED";
    await order.save();
    return res.json({ item: order });
  }

  order.status = "CANCELLED";
  await order.save();

  for (const it of order.items || []) {
    await LocalProduct.updateOne({ _id: it.productId }, { $inc: { stock: Number(it.quantity || 0) } });
  }

  return res.json({ item: order });
});

export default router;
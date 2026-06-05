import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import HotelBooking from "../models/HotelBooking.js";
import ProductOrder from "../models/ProductOrder.js";
import GuideBooking from "../models/GuideBooking.js";

const router = Router();

const ALLOWED_METHODS = ["BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "NAYAPAY"];

const uploadDir = path.join(process.cwd(), "private_uploads", "payment_proofs");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `pay_${Date.now()}_${Math.random().toString(16).slice(2)}${ext || ".bin"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function methodLabel(code) {
  if (code === "EASYPAISA") return "Easypaisa";
  if (code === "JAZZCASH") return "JazzCash";
  if (code === "NAYAPAY") return "NayaPay";
  return "Bank Transfer";
}

router.post(
  "/submit",
  requireAuth,
  requireVerifiedEmail,
  upload.single("proof"),
  async (req, res) => {
    const userId = req.auth.userId;
    const { targetType, targetId, methodCode, transactionId = "" } = req.body || {};

    if (!["HOTEL_BOOKING", "PRODUCT_ORDER", "GUIDE_BOOKING"].includes(targetType)) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ message: "Invalid targetType" });
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ message: "Invalid targetId" });
    }

    if (!ALLOWED_METHODS.includes(methodCode)) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ message: "Invalid methodCode" });
    }

    const f = req.file;
    if (!f) return res.status(400).json({ message: "proof file is required" });

    const proofDoc = {
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    };

    if (targetType === "HOTEL_BOOKING") {
      const booking = await HotelBooking.findOne({ _id: targetId, userId });
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (booking.payment.status === "PAID") {
        return res.status(400).json({ message: "Payment already verified for this booking." });
      }

      booking.payment.methodCode = methodCode;
      booking.payment.methodLabel = methodLabel(methodCode);
      booking.payment.transactionId = String(transactionId || "");
      booking.payment.proofs.push(proofDoc);
      booking.payment.status = "SUBMITTED";
      booking.payment.submittedAt = new Date();
      booking.payment.adminNote = "";

      await booking.save();
      return res.json({ item: booking });
    }

    if (targetType === "GUIDE_BOOKING") {
      const booking = await GuideBooking.findOne({ _id: targetId, userId });
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (booking.payment.status === "PAID") {
        return res.status(400).json({ message: "Payment already verified for this booking." });
      }

      booking.payment.methodCode = methodCode;
      booking.payment.methodLabel = methodLabel(methodCode);
      booking.payment.transactionId = String(transactionId || "");
      booking.payment.proofs.push(proofDoc);
      booking.payment.status = "SUBMITTED";
      booking.payment.submittedAt = new Date();
      booking.payment.adminNote = "";

      await booking.save();
      return res.json({ item: booking });
    }

    const order = await ProductOrder.findOne({ _id: targetId, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.payment.status === "PAID") {
      return res.status(400).json({ message: "Payment already verified for this order." });
    }

    order.payment.methodCode = methodCode;
    order.payment.methodLabel = methodLabel(methodCode);
    order.payment.transactionId = String(transactionId || "");
    order.payment.proofs.push(proofDoc);
    order.payment.status = "SUBMITTED";
    order.payment.submittedAt = new Date();
    order.payment.adminNote = "";

    await order.save();
    return res.json({ item: order });
  }
);

export default router;
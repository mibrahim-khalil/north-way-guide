import { Router } from "express";
import path from "path";
import fs from "fs";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import HotelBooking from "../models/HotelBooking.js";

const router = Router();
router.use(requireAuth, requireVerifiedEmail);

const proofsDir = path.join(process.cwd(), "private_uploads", "payment_proofs");

function decisionLabel(x) {
  const s = String(x || "").toUpperCase();
  return s === "PAID" ? "PAID" : "REJECTED";
}


router.get("/", async (req, res) => {
  const { status } = req.query;

  const filter = { hotelOwnerUserId: req.auth.userId };
  if (status) filter.status = status;

  const items = await HotelBooking.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});


router.get("/:id/proofs/:proofId", async (req, res) => {
  const { id, proofId } = req.params;

  const booking = await HotelBooking.findOne({
    _id: id,
    hotelOwnerUserId: req.auth.userId,
  });

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const proof = (booking.payment?.proofs || []).find((p) => String(p._id) === String(proofId));
  if (!proof) return res.status(404).json({ message: "Proof not found" });

  const filePath = path.join(proofsDir, proof.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

  return res.download(filePath, proof.originalName);
});


router.patch("/:id/payment/verify", async (req, res) => {
  const { decision, note = "" } = req.body || {};
  const dec = decisionLabel(decision);

  const booking = await HotelBooking.findOne({
    _id: req.params.id,
    hotelOwnerUserId: req.auth.userId,
  });

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const proofs = booking.payment?.proofs || [];
  if (!Array.isArray(proofs) || proofs.length === 0) {
    return res.status(400).json({ message: "No payment proof uploaded yet." });
  }

  booking.payment.status = dec;
  booking.payment.verifiedAt = new Date();
  booking.payment.verifiedByUserId = req.auth.userId;
  booking.payment.adminNote = String(note || ""); 

  if (dec === "PAID") {
    if (booking.status === "PLACED") booking.status = "CONFIRMED";
  } else {
    booking.status = "CANCELLED";
  }

  await booking.save();
  return res.json({ item: booking });
});


router.patch("/:id/status", async (req, res) => {
  const { status } = req.body || {};
  const allowed = ["PLACED", "CONFIRMED", "CANCELLED", "FULFILLED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const item = await HotelBooking.findOne({
    _id: req.params.id,
    hotelOwnerUserId: req.auth.userId,
  });

  if (!item) return res.status(404).json({ message: "Booking not found" });

  const payStatus = String(item?.payment?.status || "UNPAID").toUpperCase();

  if ((status === "CONFIRMED" || status === "FULFILLED") && payStatus !== "PAID") {
    return res.status(400).json({
      message: "Cannot confirm/fulfill booking until payment is verified (PAID).",
    });
  }

  item.status = status;
  await item.save();

  res.json({ item });
});

export default router;
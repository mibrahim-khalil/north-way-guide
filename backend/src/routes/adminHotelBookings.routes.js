import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import HotelBooking from "../models/HotelBooking.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  const { status, paymentStatus } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter["payment.status"] = paymentStatus;

  const items = await HotelBooking.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});

router.get("/:id", async (req, res) => {
  const item = await HotelBooking.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Booking not found" });
  res.json({ item });
});

router.patch("/:id/status", async (req, res) => {
  const { status } = req.body || {};
  const allowed = ["PLACED", "CONFIRMED", "CANCELLED", "FULFILLED"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const item = await HotelBooking.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Booking not found" });

  const payStatus = String(item?.payment?.status || "UNPAID").toUpperCase();

  if ((status === "CONFIRMED" || status === "FULFILLED") && payStatus !== "PAID") {
    return res.status(400).json({ message: "Cannot confirm/fulfill until payment is verified (PAID)." });
  }

  item.status = status;
  await item.save();

  res.json({ item });
});

export default router;
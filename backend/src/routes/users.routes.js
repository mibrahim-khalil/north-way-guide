import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/User.js";

const router = Router();

function normalizePhone(v) {
  return String(v || "").replace(/\D/g, "");
}
function isValidPkPhone11(v) {
  return /^[0-9]{11}$/.test(v);
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.userId).select("name email phone role accountType createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

router.put("/me", requireAuth, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const phone = normalizePhone(req.body?.phone);

  if (!name) return res.status(400).json({ message: "Name is required" });

  if (!phone) return res.status(400).json({ message: "Phone is required" });
  if (!isValidPkPhone11(phone)) return res.status(400).json({ message: "Phone must be exactly 11 digits" });

  const exists = await User.findOne({ phone, _id: { $ne: req.auth.userId } });
  if (exists) return res.status(409).json({ message: "Phone already registered" });

  const user = await User.findByIdAndUpdate(
    req.auth.userId,
    { name, phone },
    { new: true }
  ).select("name email phone role accountType createdAt");

  res.json({ user });
});

export default router;
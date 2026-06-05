import { Router } from "express";
import bcrypt from "bcrypt";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import User from "../models/User.js";

const router = Router();

router.use(requireAuth, requireAdmin);


router.get("/", async (req, res) => {
  const user = await User.findById(req.auth.userId).select("name email phone role isEmailVerified createdAt");
  if (!user) return res.status(404).json({ message: "Admin not found" });
  res.json({ user });
});


router.patch("/", async (req, res) => {
  const { name, phone } = req.body || {};

  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ message: "Admin not found" });

  if (name !== undefined) user.name = String(name || "").trim();
  if (phone !== undefined) user.phone = String(phone || "").trim();

  if (!user.name) return res.status(400).json({ message: "Name is required" });

  await user.save();

  const safe = await User.findById(user._id).select("name email phone role isEmailVerified createdAt");
  res.json({ user: safe });
});


router.patch("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ message: "Admin not found" });

  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  res.json({ ok: true });
});

export default router;
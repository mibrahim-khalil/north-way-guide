import User from "../models/User.js";

export default async function requireVerifiedEmail(req, res, next) {
  const user = await User.findById(req.auth.userId).select("isEmailVerified");
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  if (!user.isEmailVerified) return res.status(403).json({ message: "Please verify your email first." });
  next();
}
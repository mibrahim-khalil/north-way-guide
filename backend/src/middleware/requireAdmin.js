export default function requireAdmin(req, res, next) {
  if (req.auth?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}
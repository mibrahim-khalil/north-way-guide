import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload; // { userId, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}
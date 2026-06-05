import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `img_${Date.now()}${ext || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

router.post(
  "/image",
  requireAuth,
  requireVerifiedEmail,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const base = `${req.protocol}://${req.get("host")}`;
    const url = `${base}/uploads/${req.file.filename}`;

    res.json({ url });
  }
);

export default router;
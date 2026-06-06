import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";

const router = Router();

// Cloudinary config (reads from Render env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage (no saving to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.mimetype);
    if (!ok) return cb(new Error("Only image files are allowed (jpg, png, webp, avif)"));
    cb(null, true);
  },
});

router.post(
  "/image",
  requireAuth,
  requireVerifiedEmail,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      // convert buffer -> base64 data uri
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "north-way-guide/uploads",
        resource_type: "image",
      });

      // return Cloudinary URL
      return res.json({
        url: result.secure_url,
        publicId: result.public_id, // optional (useful for delete later)
      });
    } catch (err) {
      console.error("CLOUDINARY UPLOAD ERROR:", err);
      return res.status(500).json({ message: "Image upload failed" });
    }
  }
);

export default router;
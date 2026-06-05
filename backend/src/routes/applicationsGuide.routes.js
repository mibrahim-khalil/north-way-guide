import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import ServiceApplication from "../models/ServiceApplication.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "private_uploads", "guide_docs");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `guide_${Date.now()}_${Math.random().toString(16).slice(2)}${ext || ".bin"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

router.post(
  "/guide",
  requireAuth,
  requireVerifiedEmail,
  upload.array("documents", 5), 
  async (req, res) => {
    try {
      const payloadRaw = req.body?.payload;
      if (!payloadRaw) return res.status(400).json({ message: "Missing payload" });

      let payload;
      try {
        payload = JSON.parse(payloadRaw);
      } catch {
        return res.status(400).json({ message: "Invalid payload JSON" });
      }

      if (!payload?.name || !payload?.baseCity) {
        return res.status(400).json({ message: "Guide name and base city are required" });
      }

      const files = req.files || [];
      if (files.length < 1) {
        return res.status(400).json({ message: "Please upload at least 1 government document." });
      }

      const existing = await ServiceApplication.findOne({
        userId: req.auth.userId,
        serviceType: "GUIDE",
        status: "PENDING",
      });

      if (existing) {
        // show newly uploaded files
        for (const f of files) {
          try { fs.unlinkSync(f.path); } catch {}
        }
        return res.status(409).json({ message: "You already have a pending GUIDE request." });
      }

      const documents = files.map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      }));

      const doc = await ServiceApplication.create({
        userId: req.auth.userId,
        serviceType: "GUIDE",
        payload,
        documents,
      });

      res.status(201).json({ application: doc });
    } catch (err) {
      console.error("GUIDE APPLICATION ERROR:", err);
      res.status(400).json({ message: err.message });
    }
  }
);

export default router;
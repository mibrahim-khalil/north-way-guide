import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import Report from "../models/Report.js";

const router = Router();


router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const {
      kind,
      topic,
      subject,
      message,
      referenceId = "",
      againstUserLabel = "",
      attachments = [],
    } = req.body || {};

    if (!kind || !["COMPLAINT", "SUGGESTION"].includes(kind)) {
      return res.status(400).json({ message: "Invalid kind" });
    }
    if (!topic) return res.status(400).json({ message: "topic is required" });
    if (!subject) return res.status(400).json({ message: "subject is required" });
    if (!message) return res.status(400).json({ message: "message is required" });

    const created = await Report.create({
      kind: String(kind).trim(),
      topic: String(topic).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      referenceId: String(referenceId || "").trim(),
      againstUserLabel: String(againstUserLabel || "").trim(),
      attachments: Array.isArray(attachments) ? attachments.map(String) : [],
      reporterUserId: req.auth.userId,
      status: "OPEN",
      isActive: true,
    });

    res.status(201).json({ item: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create report error" });
  }
});


router.get("/my", requireAuth, async (req, res) => {
  try {
    const items = await Report.find({ reporterUserId: req.auth.userId, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch my reports error" });
  }
});

export default router;
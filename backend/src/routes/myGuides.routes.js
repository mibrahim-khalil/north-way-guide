import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import ServiceApplication from "../models/ServiceApplication.js";
import Guide from "../models/Guide.js";

const router = Router();

async function getGuideApprovalState(userId) {
  const hasApproved = await ServiceApplication.exists({
    userId,
    serviceType: "GUIDE",
    status: "APPROVED",
  });

  if (hasApproved) return { approved: true, approvalStatus: "APPROVED" };

  const latest = await ServiceApplication.findOne({ userId, serviceType: "GUIDE" })
    .sort({ createdAt: -1 })
    .select("status");

  if (!latest) return { approved: false, approvalStatus: "NONE" };
  return { approved: false, approvalStatus: latest.status || "PENDING" };
}

async function requireGuideApproved(req, res, next) {
  const state = await getGuideApprovalState(req.auth.userId);
  if (!state.approved) {
    return res.status(403).json({
      message:
        state.approvalStatus === "NONE"
          ? "No guide application found. Please register guide service first."
          : "Guide service is not approved yet.",
      approvalStatus: state.approvalStatus,
    });
  }
  next();
}

// GET /api/my/guides
router.get("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;
  const state = await getGuideApprovalState(userId);

  if (!state.approved) {
    return res.json({ items: [], approvalStatus: state.approvalStatus });
  }

  let items = await Guide.find({ ownerUserId: userId }).sort({ createdAt: -1 });

  if (items.length === 0) {
    const app = await ServiceApplication.findOne({
      userId,
      serviceType: "GUIDE",
      status: "APPROVED",
    })
      .sort({ createdAt: -1 })
      .select("payload createdEntityType createdEntityId");

    const p = app?.payload || null;

    if (p?.name && p?.baseCity) {
      const update = {
        ownerUserId: userId,
        name: p.name,
        baseCity: p.baseCity,
        phone: p.phone || "",
        bio: p.bio || "",
        languages: Array.isArray(p.languages) ? p.languages : [],
        specialties: Array.isArray(p.specialties) ? p.specialties : [],
        pricePerDay: Number(p.pricePerDay || 0),
        images: Array.isArray(p.images) ? p.images : [],
        unavailableRanges: Array.isArray(p.unavailableRanges) ? p.unavailableRanges : [],
        isActive: true,
      };

      const guide = await Guide.findOneAndUpdate({ ownerUserId: userId }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      });

      if (app && (!app.createdEntityType || !app.createdEntityId)) {
        app.createdEntityType = "GUIDE";
        app.createdEntityId = guide._id;
        await app.save();
      }
    }

    items = await Guide.find({ ownerUserId: userId }).sort({ createdAt: -1 });
  }

  return res.json({ items, approvalStatus: "APPROVED" });
});

// PUT /api/my/guides/:id
router.put("/:id", requireAuth, requireVerifiedEmail, requireGuideApproved, async (req, res) => {
  const userId = req.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const guide = await Guide.findOne({ _id: req.params.id, ownerUserId: userId });
  if (!guide) return res.status(404).json({ message: "Guide not found" });

  const allowed = [
    "name",
    "baseCity",
    "phone",
    "bio",
    "languages",
    "specialties",
    "pricePerDay",
    "images",
    "unavailableRanges",
  ];

  for (const k of allowed) {
    if (req.body?.[k] !== undefined) guide[k] = req.body[k];
  }

  await guide.save();
  res.json({ item: guide });
});

router.patch("/:id/deactivate", requireAuth, requireVerifiedEmail, requireGuideApproved, async (req, res) => {
  const userId = req.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const guide = await Guide.findOne({ _id: req.params.id, ownerUserId: userId });
  if (!guide) return res.status(404).json({ message: "Guide not found" });

  guide.isActive = false;
  await guide.save();
  res.json({ item: guide });
});

router.patch("/:id/activate", requireAuth, requireVerifiedEmail, requireGuideApproved, async (req, res) => {
  const userId = req.auth.userId;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const guide = await Guide.findOne({ _id: req.params.id, ownerUserId: userId });
  if (!guide) return res.status(404).json({ message: "Guide not found" });

  guide.isActive = true;
  await guide.save();
  res.json({ item: guide });
});

export default router;
import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import ServiceApplication from "../models/ServiceApplication.js";

const router = Router();

const ALLOWED_TYPES = ["HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"];

router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { serviceType, payload } = req.body || {};
    if (!serviceType || !payload) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!ALLOWED_TYPES.includes(serviceType)) {
      return res.status(400).json({ message: "Invalid serviceType" });
    }

    const existing = await ServiceApplication.findOne({
      userId: req.auth.userId,
      serviceType,
      status: "PENDING",
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "You already have a pending request for this service type." });
    }

    if (serviceType === "HOTEL") {
      if (!payload?.name || !payload?.city) {
        return res.status(400).json({ message: "Hotel name and city are required" });
      }
      if (!Array.isArray(payload.rooms) || payload.rooms.length < 1) {
        return res.status(400).json({ message: "Please add at least 1 room category." });
      }

      for (const r of payload.rooms) {
        if (!r?.name) return res.status(400).json({ message: "Each room must have a name." });
        if (Number(r?.pricePerNight || 0) <= 0) {
          return res.status(400).json({ message: "Each room must have a valid price." });
        }
      }
    }

    if (serviceType === "TRANSPORT") {
      if (!payload?.providerName) {
        return res.status(400).json({ message: "Transport provider name is required" });
      }
      if (!Array.isArray(payload.routes) || payload.routes.length < 1) {
        return res.status(400).json({ message: "Add at least 1 transport route." });
      }

      for (const r of payload.routes) {
        if (!r?.from || !r?.to) {
          return res.status(400).json({ message: "Each route must have From and To." });
        }
        if (!["Local", "Private", "Flight"].includes(r?.type)) {
          return res.status(400).json({ message: "Invalid route type." });
        }
      }
    }

    const doc = await ServiceApplication.create({
      userId: req.auth.userId,
      serviceType,
      payload,
    });

    res.status(201).json({ application: doc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  const applications = await ServiceApplication.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 });

  res.json({ applications });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const app = await ServiceApplication.findOne({
    _id: req.params.id,
    userId: req.auth.userId,
  });

  if (!app) return res.status(404).json({ message: "Application not found" });

  if (app.status !== "REJECTED") {
    return res.status(400).json({
      message: "You can only withdraw/remove an application after it is rejected.",
    });
  }

  await ServiceApplication.deleteOne({ _id: app._id });
  res.json({ ok: true });
});

export default router;
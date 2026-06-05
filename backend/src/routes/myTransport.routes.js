import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import ServiceApplication from "../models/ServiceApplication.js";
import Transport from "../models/Transport.js";

const router = Router();

async function getTransportApprovalState(userId) {
  const hasApproved = await ServiceApplication.exists({
    userId,
    serviceType: "TRANSPORT",
    status: "APPROVED",
  });

  if (hasApproved) return { approved: true, approvalStatus: "APPROVED" };

  const latest = await ServiceApplication.findOne({ userId, serviceType: "TRANSPORT" })
    .sort({ createdAt: -1 })
    .select("status");

  if (!latest) return { approved: false, approvalStatus: "NONE" };

  return { approved: false, approvalStatus: latest.status || "PENDING" };
}

async function requireTransportApproved(req, res, next) {
  const state = await getTransportApprovalState(req.auth.userId);

  if (!state.approved) {
    return res.status(403).json({
      message:
        state.approvalStatus === "NONE"
          ? "No transport application found. Please register transport service first."
          : "Transport service is not approved yet.",
      approvalStatus: state.approvalStatus,
    });
  }

  next();
}

// GET /api/my/transport
router.get("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;
  const state = await getTransportApprovalState(userId);

  if (!state.approved) {
    return res.json({ items: [], approvalStatus: state.approvalStatus });
  }

  const items = await Transport.find({ ownerUserId: userId }).sort({ createdAt: -1 });
  return res.json({ items, approvalStatus: "APPROVED" });
});

// POST /api/my/transport
router.post("/", requireAuth, requireVerifiedEmail, requireTransportApproved, async (req, res) => {
  const b = req.body || {};

  if (!b.providerName || !b.from || !b.to) {
    return res.status(400).json({ message: "providerName, from, and to are required." });
  }

  if (!["Local", "Private", "Flight"].includes(b.type || "Local")) {
    return res.status(400).json({ message: "Invalid type." });
  }

  const created = await Transport.create({
    ownerUserId: req.auth.userId,

    providerName: b.providerName,
    contactPhone: b.contactPhone || "",
    whatsapp: b.whatsapp || "",
    bookingUrl: b.bookingUrl || "",
    officeCity: b.officeCity || "",
    officeAddress: b.officeAddress || "",
    officeMapsUrl: b.officeMapsUrl || "",

    from: b.from,
    to: b.to,
    type: b.type || "Local",
    fare: b.type === "Flight" ? 0 : Number(b.fare || 0),
    availability: b.availability || "Daily",
    notes: b.notes || "",

    isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
  });

  res.status(201).json({ item: created });
});

// PUT /api/my/transport/:id
router.put("/:id", requireAuth, requireVerifiedEmail, requireTransportApproved, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const existing = await Transport.findOne({ _id: id, ownerUserId: req.auth.userId });
  if (!existing) return res.status(404).json({ message: "Not found" });

  const body = req.body || {};

  const providerKeys = [
    "providerName",
    "contactPhone",
    "whatsapp",
    "bookingUrl",
    "officeCity",
    "officeAddress",
    "officeMapsUrl",
  ];
  const routeKeys = ["from", "to", "type", "fare", "availability", "notes"];

  const providerUpdate = {};
  for (const k of providerKeys) if (body[k] !== undefined) providerUpdate[k] = body[k];

  const routeUpdate = {};
  for (const k of routeKeys) if (body[k] !== undefined) routeUpdate[k] = body[k];

  const nextType = routeUpdate.type ?? existing.type;
  if (nextType === "Flight") routeUpdate.fare = 0;
  if (routeUpdate.fare !== undefined) routeUpdate.fare = Number(routeUpdate.fare || 0);

  if (Object.keys(providerUpdate).length > 0) {
    await Transport.updateMany(
      { ownerUserId: req.auth.userId, providerName: existing.providerName },
      providerUpdate
    );
  }

  const updated = await Transport.findOneAndUpdate(
    { _id: id, ownerUserId: req.auth.userId },
    routeUpdate,
    { returnDocument: "after", runValidators: true }
  );

  res.json({ item: updated });
});

router.patch(
  "/:id/deactivate",
  requireAuth,
  requireVerifiedEmail,
  requireTransportApproved,
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await Transport.findOneAndUpdate(
      { _id: id, ownerUserId: req.auth.userId },
      { isActive: false },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ item: updated });
  }
);

// PATCH activate
router.patch(
  "/:id/activate",
  requireAuth,
  requireVerifiedEmail,
  requireTransportApproved,
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await Transport.findOneAndUpdate(
      { _id: id, ownerUserId: req.auth.userId },
      { isActive: true },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json({ item: updated });
  }
);

export default router;
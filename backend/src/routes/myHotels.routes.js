import { Router } from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import Hotel from "../models/Hotel.js";
import ServiceApplication from "../models/ServiceApplication.js";

const router = Router();

async function getHotelApprovalState(userId) {
  const approvedExists = await ServiceApplication.exists({
    userId,
    serviceType: "HOTEL",
    status: "APPROVED",
  });

  if (approvedExists) return { approved: true, approvalStatus: "APPROVED" };

  const latest = await ServiceApplication.findOne({ userId, serviceType: "HOTEL" })
    .sort({ createdAt: -1 })
    .select("status");

  if (!latest) return { approved: false, approvalStatus: "NONE" };
  return { approved: false, approvalStatus: latest.status || "PENDING" };
}

router.get("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const state = await getHotelApprovalState(userId);

  if (!state.approved) {
    return res.json({ items: [], approvalStatus: state.approvalStatus });
  }

  let items = await Hotel.find({ ownerUserId: userId }).sort({ createdAt: -1 });

  if (items.length === 0) {
    const approvedApps = await ServiceApplication.find({
      userId,
      serviceType: "HOTEL",
      status: "APPROVED",
    }).sort({ createdAt: -1 });

    for (const app of approvedApps) {
      const p = app.payload || {};
      if (!p?.name || !p?.city) continue;

      const rooms = Array.isArray(p.rooms) ? p.rooms : [];
      const prices = rooms
        .map((r) => Number(r?.pricePerNight || 0))
        .filter((n) => n > 0);

      const priceFrom =
        prices.length > 0
          ? Math.min(...prices)
          : Number(p.priceFrom || p.pricePerNight || 0);

      const update = {
        ownerUserId: userId,
        name: p.name,
        city: p.city,
        address: p.address || "",
        description: p.description || "",
        mapsUrl: p.mapsUrl || "",
        images: Array.isArray(p.images) ? p.images : [],
        amenities: Array.isArray(p.amenities) ? p.amenities : [],
        rooms,
        priceFrom,
        isActive: true,
      };

      const hotel = await Hotel.findOneAndUpdate(
        { ownerUserId: userId, name: p.name, city: p.city },
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      if (!app.createdEntityType || !app.createdEntityId) {
        app.createdEntityType = "HOTEL";
        app.createdEntityId = hotel._id;
        await app.save();
      }
    }

    items = await Hotel.find({ ownerUserId: userId }).sort({ createdAt: -1 });
  }

  return res.json({ items, approvalStatus: "APPROVED" });
});

router.put("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const allowed = [
    "name",
    "city",
    "address",
    "mapsUrl",
    "description",
    "images",
    "amenities",
    "rooms",
    "priceFrom",
  ];

  const update = {};
  for (const k of allowed) {
    if (k in (req.body || {})) update[k] = req.body[k];
  }

  const updated = await Hotel.findOneAndUpdate(
    { _id: id, ownerUserId: req.auth.userId },
    update,
    { returnDocument: "after", runValidators: true }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ item: updated });
});

router.patch("/:id/deactivate", requireAuth, requireVerifiedEmail, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const updated = await Hotel.findOneAndUpdate(
    { _id: id, ownerUserId: req.auth.userId },
    { isActive: false },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ item: updated });
});

router.patch("/:id/activate", requireAuth, requireVerifiedEmail, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const updated = await Hotel.findOneAndUpdate(
    { _id: id, ownerUserId: req.auth.userId },
    { isActive: true },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });

  res.json({ item: updated });
});

export default router;
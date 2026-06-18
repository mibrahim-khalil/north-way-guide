import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import ServiceApplication from "../models/ServiceApplication.js";
import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";
import Transport from "../models/Transport.js";
import path from "path";
import fs from "fs";

const router = Router();

function normalizeImages(payload = {}) {
  const p = payload || {};

  // preferred: images array
  if (Array.isArray(p.images)) {
    const cleaned = p.images.map((x) => String(x || "").trim()).filter(Boolean);
    if (cleaned.length) return cleaned;
  }

  // fallback: older / alternate fields
  const single = p.imageUrl || p.image || p.photoUrl || p.coverImage || "";

  if (typeof single === "string" && single.trim()) return [single.trim()];

  return [];
}

router.get("/applications/summary", requireAuth, requireAdmin, async (req, res) => {
  const byType = await ServiceApplication.aggregate([
    { $match: { status: "PENDING" } },
    { $group: { _id: "$serviceType", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const totalPending = byType.reduce((sum, x) => sum + x.count, 0);
  res.json({ totalPending, byType });
});

router.get("/applications", requireAuth, requireAdmin, async (req, res) => {
  const { status, serviceType } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;

  const applications = await ServiceApplication.find(filter)
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  res.json({ applications });
});

router.get("/applications/:id/documents/:docId", requireAuth, requireAdmin, async (req, res) => {
  const appDoc = await ServiceApplication.findById(req.params.id);
  if (!appDoc) return res.status(404).json({ message: "Application not found" });

  const doc = (appDoc.documents || []).find((d) => String(d._id) === String(req.params.docId));
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const filePath = path.join(process.cwd(), "private_uploads", "guide_docs", doc.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing on server" });

  res.download(filePath, doc.originalName);
});

router.patch("/applications/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body || {};
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appDoc = await ServiceApplication.findById(req.params.id);
    if (!appDoc) return res.status(404).json({ message: "Not found" });

    const p = appDoc.payload || {};
    let createdEntity = null;

    if (status === "APPROVED") {
      if (appDoc.serviceType === "GUIDE") {
        if (!p.name || !p.baseCity) {
          return res.status(400).json({ message: "Guide payload must include name and baseCity." });
        }

        const update = {
          ownerUserId: appDoc.userId,
          name: p.name,
          baseCity: p.baseCity,
          phone: p.phone || "",
          bio: p.bio || "",
          languages: Array.isArray(p.languages) ? p.languages : [],
          specialties: Array.isArray(p.specialties) ? p.specialties : [],
          pricePerDay: Number(p.pricePerDay || 0),
          images: normalizeImages(p),
          isActive: true,
        };

        if (appDoc.createdEntityType === "GUIDE" && appDoc.createdEntityId) {
          createdEntity = await Guide.findByIdAndUpdate(appDoc.createdEntityId, update, { new: true });
        }

        if (!createdEntity) {
          createdEntity = await Guide.findOneAndUpdate(
            { ownerUserId: appDoc.userId },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        }

        appDoc.createdEntityType = "GUIDE";
        appDoc.createdEntityId = createdEntity._id;
      }

      if (appDoc.serviceType === "HOTEL") {
        if (!p.name || !p.city) {
          return res.status(400).json({ message: "Hotel payload must include name and city." });
        }

        const rooms = Array.isArray(p.rooms) ? p.rooms : [];
        const prices = rooms
          .map((r) => Number(r?.pricePerNight || 0))
          .filter((n) => n > 0);

        const priceFrom = prices.length ? Math.min(...prices) : Number(p.priceFrom || 0);

        const update = {
          ownerUserId: appDoc.userId,
          name: p.name,
          city: p.city,
          address: p.address || "",
          description: p.description || "",
          mapsUrl: p.mapsUrl || "",
          images: normalizeImages(p),
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          rooms,
          priceFrom,
          isActive: true,
        };

        if (appDoc.createdEntityType === "HOTEL" && appDoc.createdEntityId) {
          createdEntity = await Hotel.findByIdAndUpdate(appDoc.createdEntityId, update, { new: true });
        }

        if (!createdEntity) {
          createdEntity = await Hotel.create({ ...update, rating: 0 });
          appDoc.createdEntityType = "HOTEL";
          appDoc.createdEntityId = createdEntity._id;
        }
      }

      if (appDoc.serviceType === "TRANSPORT") {
        if (!p.providerName) {
          return res.status(400).json({ message: "Transport payload must include providerName." });
        }

        const routes = Array.isArray(p.routes) ? p.routes : [];
        if (!routes.length) {
          return res.status(400).json({ message: "Transport payload must include at least 1 route." });
        }

        const providerFields = {
          ownerUserId: appDoc.userId,
          providerName: p.providerName,
          contactPhone: p.contactPhone || "",
          whatsapp: p.whatsapp || "",
          bookingUrl: p.bookingUrl || "",
          officeCity: p.officeCity || "",
          officeAddress: p.officeAddress || "",
          officeMapsUrl: p.officeMapsUrl || "",
          isActive: true,
        };

        const upserted = [];

        for (const r of routes) {
          if (!r?.from || !r?.to) continue;

          const filter = {
            ownerUserId: appDoc.userId,
            providerName: p.providerName,
            from: r.from,
            to: r.to,
            type: r.type || "Local",
          };

          const update = {
            ...providerFields,
            from: r.from,
            to: r.to,
            type: r.type || "Local",
            fare: r.type === "Flight" ? 0 : Number(r.fare || 0),
            availability: r.availability || "Daily",
            notes: r.notes || "",
            isActive: true,
          };

          const doc = await Transport.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          });

          upserted.push(doc);
        }

        createdEntity = { type: "TRANSPORT", routesCreatedOrUpdated: upserted.length };

        appDoc.createdEntityType = "TRANSPORT";
        appDoc.createdEntityId = upserted[0]?._id || null;
      }
    }

    if (status === "REJECTED") {
      if (appDoc.createdEntityType === "GUIDE" && appDoc.createdEntityId) {
        await Guide.findByIdAndUpdate(appDoc.createdEntityId, { isActive: false });
      }

      if (appDoc.createdEntityType === "HOTEL" && appDoc.createdEntityId) {
        await Hotel.findByIdAndUpdate(appDoc.createdEntityId, { isActive: false });
      }

      if (appDoc.createdEntityType === "TRANSPORT") {
        const providerName = p?.providerName;
        const filter = providerName
          ? { ownerUserId: appDoc.userId, providerName }
          : { ownerUserId: appDoc.userId };

        await Transport.updateMany(filter, { isActive: false });
      }
    }

    appDoc.status = status;
    appDoc.adminNote = adminNote || "";
    await appDoc.save();

    res.json({ application: appDoc, createdEntity });
  } catch (err) {
    console.error("ADMIN APPLICATION PATCH ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
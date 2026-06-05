import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import ServiceApplication from "../models/ServiceApplication.js";

const router = Router();

function pickVendorPayload(payload = {}) {
  const p = payload || {};
  return {
    shopName: String(p.shopName || "").trim(),
    city: String(p.city || "").trim(),
    phone: String(p.phone || "").trim(),
    address: String(p.address || "").trim(),
    googleMapUrl: String(p.googleMapUrl || "").trim(), 
  };
}


router.get("/vendor/me", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const item = await ServiceApplication.findOne({
    userId,
    serviceType: "PRODUCT_VENDOR",
  }).sort({ createdAt: -1 });

  res.json({ item: item || null });
});


router.post("/vendor", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;
  const { payload = {}, documents = [] } = req.body || {};

  const approved = await ServiceApplication.findOne({
    userId,
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  });

  if (approved) {
    return res.status(400).json({ message: "You are already an approved vendor." });
  }

  const cleanPayload = pickVendorPayload(payload);

  if (!cleanPayload.shopName || !cleanPayload.city) {
    return res.status(400).json({ message: "shopName and city are required" });
  }

  const app = await ServiceApplication.create({
    userId,
    serviceType: "PRODUCT_VENDOR",
    payload: cleanPayload,
    documents,
    status: "PENDING",
    adminNote: "",
    createdEntityType: "",
    createdEntityId: null,
  });

  res.json({ item: app });
});


router.put("/vendor/me", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;
  const { payload = {}, documents } = req.body || {};

  const app = await ServiceApplication.findOne({
    userId,
    serviceType: "PRODUCT_VENDOR",
  }).sort({ createdAt: -1 });

  if (!app) return res.status(404).json({ message: "Vendor application not found" });

  if (app.status === "APPROVED") {
    return res.status(400).json({ message: "Already approved. No need to update application." });
  }

  const cleanPayload = pickVendorPayload(payload);

  if (!cleanPayload.shopName || !cleanPayload.city) {
    return res.status(400).json({ message: "shopName and city are required" });
  }

  app.payload = cleanPayload;
  if (documents !== undefined) app.documents = documents;

  app.status = "PENDING";
  app.adminNote = "";

  await app.save();
  res.json({ item: app });
});

export default router;
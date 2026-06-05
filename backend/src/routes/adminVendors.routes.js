import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import ServiceApplication from "../models/ServiceApplication.js";
import LocalProduct from "../models/LocalProduct.js";

const router = Router();

router.use(requireAuth, requireAdmin);


router.get("/vendor-applications", async (req, res) => {
  const { status } = req.query;

  const filter = { serviceType: "PRODUCT_VENDOR" };
  if (status) filter.status = status;

  const items = await ServiceApplication.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});


router.get("/vendors", async (req, res) => {
  const items = await ServiceApplication.find({
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  }).sort({ createdAt: -1 });

  res.json({ items });
});


router.patch("/vendor-applications/:id/approve", async (req, res) => {
  const app = await ServiceApplication.findOne({
    _id: req.params.id,
    serviceType: "PRODUCT_VENDOR",
  });

  if (!app) return res.status(404).json({ message: "Vendor application not found" });

  app.status = "APPROVED";
  app.adminNote = "";
  app.createdEntityType = "PRODUCT_VENDOR";
  app.createdEntityId = app.userId;

  await app.save();
  res.json({ item: app });
});


router.patch("/vendor-applications/:id/reject", async (req, res) => {
  const { adminNote = "" } = req.body || {};

  const app = await ServiceApplication.findOne({
    _id: req.params.id,
    serviceType: "PRODUCT_VENDOR",
  });

  if (!app) return res.status(404).json({ message: "Vendor application not found" });

  app.status = "REJECTED";
  app.adminNote = adminNote;

  await app.save();
  res.json({ item: app });
});


router.patch("/vendors/:id", async (req, res) => {
  const { payload = {} } = req.body || {};

  const app = await ServiceApplication.findOne({
    _id: req.params.id,
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  });

  if (!app) return res.status(404).json({ message: "Approved vendor not found" });

  app.payload = { ...(app.payload || {}), ...payload };
  await app.save();

  res.json({ item: app });
});


router.delete("/vendors/:id", async (req, res) => {
  const app = await ServiceApplication.findOne({
    _id: req.params.id,
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  });

  if (!app) return res.status(404).json({ message: "Approved vendor not found" });

  app.status = "REJECTED";
  app.adminNote = "Vendor removed by admin";
  await app.save();

  await LocalProduct.updateMany(
    { vendorUserId: app.userId },
    { isActive: false, status: "REJECTED", adminNote: "Vendor removed by admin" }
  );

  res.json({ ok: true });
});

export default router;
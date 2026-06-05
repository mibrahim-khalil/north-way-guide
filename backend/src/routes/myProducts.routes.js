import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import LocalProduct from "../models/LocalProduct.js";
import ServiceApplication from "../models/ServiceApplication.js";

const router = Router();

async function ensureVendorApproved(userId) {
  const ok = await ServiceApplication.findOne({
    userId,
    serviceType: "PRODUCT_VENDOR",
    status: "APPROVED",
  });
  return !!ok;
}


router.get("/", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const items = await LocalProduct.find({ vendorUserId: userId }).sort({ createdAt: -1 });
  res.json({ items });
});

router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const isApprovedVendor = await ensureVendorApproved(userId);
  if (!isApprovedVendor) {
    return res.status(403).json({ message: "Vendor not approved yet." });
  }

  const count = await LocalProduct.countDocuments({ vendorUserId: userId });
  if (count >= 25) {
    return res.status(400).json({ message: "You can add maximum 25 products." });
  }

  const {
    name,
    description = "",
    price,
    category,
    images = [],
    stock = 0,
    locationName = "",
    googleMapUrl = "",
  } = req.body || {};

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "name, price, category are required" });
  }

  const item = await LocalProduct.create({
    vendorUserId: userId,
    name,
    description,
    price: Number(price),
    category,
    images,
    stock: Number(stock),
    locationName,
    googleMapUrl,
    status: "PENDING",
    adminNote: "",
    isActive: true,
  });

  res.json({ item });
});

router.put("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const isApprovedVendor = await ensureVendorApproved(userId);
  if (!isApprovedVendor) {
    return res.status(403).json({ message: "Vendor not approved yet." });
  }

  const item = await LocalProduct.findOne({ _id: req.params.id, vendorUserId: userId });
  if (!item) return res.status(404).json({ message: "Product not found" });

  const allowed = [
    "name",
    "description",
    "price",
    "category",
    "images",
    "stock",
    "locationName",
    "googleMapUrl",
    "isActive",
  ];

  let changed = false;
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      item[k] = req.body[k];
      changed = true;
    }
  }

  if (changed && item.status === "APPROVED") {
    item.status = "PENDING";
    item.adminNote = "";
  }

  await item.save();
  res.json({ item });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.auth.userId;

  const item = await LocalProduct.findOneAndDelete({ _id: req.params.id, vendorUserId: userId });
  if (!item) return res.status(404).json({ message: "Product not found" });

  res.json({ ok: true });
});

export default router;
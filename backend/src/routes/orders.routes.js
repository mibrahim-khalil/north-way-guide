import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireVerifiedEmail from "../middleware/requireVerifiedEmail.js";
import LocalProduct from "../models/LocalProduct.js";
import ProductOrder from "../models/ProductOrder.js";

const router = Router();

const ALLOWED_METHODS = ["BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "NAYAPAY", "COD"];

function labelFor(code) {
  if (code === "EASYPAISA") return "Easypaisa";
  if (code === "JAZZCASH") return "JazzCash";
  if (code === "NAYAPAY") return "NayaPay";
  if (code === "COD") return "Cash on Delivery";
  return "Bank Transfer";
}

router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
  const userId = req.auth.userId;

  const { items = [], shipping = {}, paymentMethod = "BANK_TRANSFER" } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items are required" });
  }

  const methodCode = ALLOWED_METHODS.includes(paymentMethod)
    ? paymentMethod
    : paymentMethod === "ONLINE"
    ? "BANK_TRANSFER"
    : "BANK_TRANSFER";

  const normalized = items.map((it) => ({
    productId: it.productId,
    quantity: Math.max(1, Number(it.quantity || 1)),
  }));

  const ids = normalized.map((x) => x.productId);

  const products = await LocalProduct.find({
    _id: { $in: ids },
    status: "APPROVED",
    isActive: true,
  });

  if (products.length !== ids.length) {
    return res.status(400).json({ message: "One or more products are not available" });
  }

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const reserved = [];

  try {
    for (const it of normalized) {
      const p = byId.get(String(it.productId));
      if (!p) throw new Error("Product not found");

      const updated = await LocalProduct.findOneAndUpdate(
        { _id: p._id, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity } },
        { new: true }
      );

      if (!updated) throw new Error(`Insufficient stock for: ${p.name}`);
      reserved.push({ productId: p._id, quantity: it.quantity });
    }

    const byVendor = new Map(); 
    for (const it of normalized) {
      const p = byId.get(String(it.productId));
      const unitPrice = Number(p.price || 0);
      const lineTotal = unitPrice * it.quantity;

      const orderItem = {
        productId: p._id,
        vendorUserId: p.vendorUserId,

        name: p.name,
        category: p.category,
        image: (p.images && p.images[0]) || "",

        unitPrice,
        quantity: it.quantity,
        lineTotal,

        productLocationName: p.locationName || "",
        productGoogleMapUrl: p.googleMapUrl || "",
      };

      const key = String(p.vendorUserId);
      if (!byVendor.has(key)) byVendor.set(key, []);
      byVendor.get(key).push(orderItem);
    }

    const createdOrders = [];

    for (const [vendorId, vendorItems] of byVendor.entries()) {
      const subtotal = vendorItems.reduce((sum, x) => sum + x.lineTotal, 0);
      const total = subtotal;

      const order = await ProductOrder.create({
        userId,
        items: vendorItems,
        subtotal,
        total,
        status: "PLACED",
        payment: {
          methodCode,
          methodLabel: labelFor(methodCode),
          status: methodCode === "COD" ? "PAID" : "UNPAID",
          provider: "",
          transactionId: "",
          proofs: [],
          submittedAt: null,
          verifiedAt: methodCode === "COD" ? new Date() : null,
          verifiedByUserId: methodCode === "COD" ? userId : null,
          adminNote: "",
        },
        shipping: {
          fullName: shipping.fullName || "",
          phone: shipping.phone || "",
          address: shipping.address || "",
          city: shipping.city || "",
          googleMapUrl: shipping.googleMapUrl || "",
          note: shipping.note || "",
        },
      });

      
      if (methodCode === "COD") {
        order.status = "CONFIRMED";
        await order.save();
      }

      createdOrders.push(order);
    }

    return res.json({
      items: createdOrders,
      item: createdOrders[0] || null, 
      meta: { split: createdOrders.length > 1, count: createdOrders.length },
    });
  } catch (err) {
    for (const r of reserved) {
      await LocalProduct.updateOne({ _id: r.productId }, { $inc: { stock: r.quantity } });
    }
    return res.status(400).json({ message: err.message || "Failed to place order" });
  }
});

export default router;
import mongoose from "mongoose";

const proofSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "LocalProduct", required: true },
    vendorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },
    image: { type: String, default: "" },

    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },

    productLocationName: { type: String, default: "", trim: true },
    productGoogleMapUrl: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const productOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["PLACED", "CANCELLED", "CONFIRMED", "FULFILLED"],
      default: "PLACED",
      index: true,
    },

    payment: {
      methodCode: {
        type: String,
        // keep older ones too if you already have data:
        enum: ["BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "NAYAPAY", "COD", "STRIPE_CARD"],
        default: "BANK_TRANSFER",
      },
      methodLabel: { type: String, default: "" },

      status: {
        type: String,
        enum: ["UNPAID", "SUBMITTED", "PAID", "REJECTED", "REFUNDED"],
        default: "UNPAID",
        index: true,
      },

      provider: { type: String, default: "" },
      transactionId: { type: String, default: "" },

      proofs: { type: [proofSchema], default: [] },

      submittedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

      adminNote: { type: String, default: "" },
    },

    shipping: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      googleMapUrl: { type: String, default: "", trim: true },
      note: { type: String, default: "", trim: true },
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

productOrderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ProductOrder", productOrderSchema);
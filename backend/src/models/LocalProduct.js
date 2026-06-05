import mongoose from "mongoose";

const localProductSchema = new mongoose.Schema(
  {
    vendorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },

    images: { type: [String], default: [] },

    stock: { type: Number, default: 0, min: 0 },

    locationName: { type: String, default: "", trim: true },
    googleMapUrl: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminNote: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

localProductSchema.index({ name: 1 });
localProductSchema.index({ category: 1 });
localProductSchema.index({ vendorUserId: 1, createdAt: -1 });

export default mongoose.model("LocalProduct", localProductSchema);
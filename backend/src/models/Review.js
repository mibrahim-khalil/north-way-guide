import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    targetType: {
      type: String,
      enum: ["HOTEL", "GUIDE", "SPOT", "PRODUCT"],
      required: true,
      index: true,
    },

    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
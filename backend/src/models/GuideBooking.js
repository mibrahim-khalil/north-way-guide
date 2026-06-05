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

const guideBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "Guide", required: true, index: true },
    guideOwnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true }, // exclusive
    days: { type: Number, required: true, min: 1 },

    travelers: { type: Number, required: true, min: 1, default: 1 },

    meetingCity: { type: String, default: "", trim: true },
    meetingPoint: { type: String, default: "", trim: true },

    contact: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
    },

    note: { type: String, default: "", trim: true },

    pricePerDay: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "CANCELLED", "FULFILLED"],
      default: "PLACED",
      index: true,
    },

    payment: {
      methodCode: {
        type: String,
        enum: ["BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "NAYAPAY", "COD"],
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

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

guideBookingSchema.index({ userId: 1, createdAt: -1 });
guideBookingSchema.index({ status: 1, createdAt: -1 });
guideBookingSchema.index({ guideId: 1, startDate: 1, endDate: 1 });

export default mongoose.model("GuideBooking", guideBookingSchema);
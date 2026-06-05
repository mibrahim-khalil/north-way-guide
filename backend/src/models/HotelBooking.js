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

const hotelBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    hotelOwnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    room: {
      roomId: { type: String, default: "" },
      roomIndex: { type: Number, default: -1 },
      roomName: { type: String, required: true, trim: true },
      capacity: { type: Number, default: 2 },
      pricePerNight: { type: Number, required: true, min: 0 },
    },

    checkInDate: { type: Date, required: true, index: true },
    checkOutDate: { type: Date, required: true, index: true },
    guests: { type: Number, required: true, min: 1 },

    nights: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },

    contact: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
    },

    note: { type: String, default: "", trim: true },

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

      proofs: { type: [proofSchema], default: [] }, // uploaded images

      submittedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

      adminNote: { type: String, default: "" },
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

hotelBookingSchema.index({ userId: 1, createdAt: -1 });
hotelBookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("HotelBooking", hotelBookingSchema);
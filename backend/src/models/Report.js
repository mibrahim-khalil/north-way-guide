import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["COMPLAINT", "SUGGESTION"],
      required: true,
      trim: true,
    },
    topic: { type: String, required: true, trim: true },

    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    // optional fields
    referenceId: { type: String, default: "", trim: true }, // order/booking/payment id etc.
    againstUserLabel: { type: String, default: "", trim: true }, // email/name/phone etc.

    attachments: [{ type: String, trim: true }], // image URLs

    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"],
      default: "OPEN",
    },

    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
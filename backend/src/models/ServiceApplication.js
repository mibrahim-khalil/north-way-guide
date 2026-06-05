import mongoose from "mongoose";

const appDocSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const serviceApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    serviceType: {
      type: String,
      enum: ["HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"],
      required: true,
    },

    payload: { type: Object, required: true },

    documents: { type: [appDocSchema], default: [] },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    adminNote: { type: String, default: "" },

    createdEntityType: {
      type: String,
      enum: ["", "HOTEL", "GUIDE", "TRANSPORT", "PRODUCT_VENDOR"],
      default: "",
    },
    createdEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceApplication", serviceApplicationSchema);
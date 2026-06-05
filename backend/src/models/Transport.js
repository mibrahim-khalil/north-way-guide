import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    providerName: { type: String, required: true, trim: true },
    contactPhone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    bookingUrl: { type: String, default: "" },
    officeCity: { type: String, default: "" },
    officeAddress: { type: String, default: "" },
    officeMapsUrl: { type: String, default: "" },

    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },

    type: { type: String, enum: ["Local", "Private", "Flight"], default: "Local" },

    fare: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ["Daily", "On Demand", "Seasonal", "Limited"],
      default: "Daily",
    },

    notes: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Transport", transportSchema);
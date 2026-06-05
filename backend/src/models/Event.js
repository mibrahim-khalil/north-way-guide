import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    location: { type: String, default: "", trim: true },

    mapUrl: { type: String, default: "", trim: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },

    image: { type: String, default: "" },

    isPublished: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1 });
eventSchema.index({ isPublished: 1, isActive: 1 });

export default mongoose.model("Event", eventSchema);
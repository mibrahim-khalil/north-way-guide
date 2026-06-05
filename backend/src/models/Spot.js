import mongoose from "mongoose";

const spotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true }, // you can keep as display location
    description: { type: String, default: "" },
    mapsUrl: { type: String, default: "" },
    images: [{ type: String }],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },


    region: {
      type: String,
      trim: true,
      default: "UNKNOWN",
      index: true,
    },

    baseCity: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    category: {
      type: String,
      enum: ["VIEWPOINT", "LAKE", "VALLEY", "FORT", "MARKET", "HIKE", "MEADOW", "GLACIER", "MUSEUM", "OTHER"],
      default: "OTHER",
      index: true,
    },

    bestMonths: {
      type: [Number],
      default: [], // if empty => all-year or unknown
      validate: {
        validator: (arr) => (arr || []).every((m) => Number(m) >= 1 && Number(m) <= 12),
        message: "bestMonths must be 1..12",
      },
      index: true,
    },

    avgVisitHours: { type: Number, default: 2 }, // e.g. 1..8
    costLevel: {
      type: String,
      enum: ["FREE", "LOW", "MEDIUM", "HIGH"],
      default: "LOW",
      index: true,
    },
    entryFeePkr: { type: Number, default: 0 },

    difficulty: {
      type: String,
      enum: ["EASY", "MODERATE", "HARD"],
      default: "EASY",
      index: true,
    },

    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

spotSchema.index({ isActive: 1, baseCity: 1 });
spotSchema.index({ isActive: 1, region: 1, category: 1 });

export default mongoose.model("Spot", spotSchema);
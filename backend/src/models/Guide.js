import mongoose from "mongoose";

const guideSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    baseCity: { type: String, required: true, trim: true },

    phone: { type: String, default: "" },
    bio: { type: String, default: "" },

    languages: { type: [String], default: [] },
    specialties: { type: [String], default: [] },

    pricePerDay: { type: Number, default: 0 },

    images: { type: [String], default: [] },

    rating: { type: Number, default: 0 },

    // Owner can block date ranges (hotel room unavailableRanges)
    unavailableRanges: {
      type: [
        {
          from: { type: Date, required: true },
          to: { type: Date, required: true }, // exclusive
          note: { type: String, default: "" },
        },
      ],
      default: [],
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Guide", guideSchema);
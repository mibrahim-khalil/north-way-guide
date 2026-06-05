import mongoose from "mongoose";

const roomUnavailableRangeSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" }, // optional (for UI)
    name: { type: String, required: true },
    pricePerNight: { type: Number, default: 0 },
    capacity: { type: Number, default: 2 },

    unavailableRanges: { type: [roomUnavailableRangeSchema], default: [] },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    description: { type: String, default: "" },
    mapsUrl: { type: String, default: "" },

    images: [{ type: String }],
    amenities: [{ type: String }],

    rating: { type: Number, default: 0 },
    priceFrom: { type: Number, default: 0 },

    rooms: { type: [roomSchema], default: [] },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Hotel", hotelSchema);
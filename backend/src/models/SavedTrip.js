import mongoose from "mongoose";

const savedTripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "" },
    itinerary: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("SavedTrip", savedTripSchema);
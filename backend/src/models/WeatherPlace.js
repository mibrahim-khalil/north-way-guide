import mongoose from "mongoose";

const weatherPlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

weatherPlaceSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

export default mongoose.model("WeatherPlace", weatherPlaceSchema);
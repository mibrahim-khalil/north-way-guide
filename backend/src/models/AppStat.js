import mongoose from "mongoose";

const appStatSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("AppStat", appStatSchema);